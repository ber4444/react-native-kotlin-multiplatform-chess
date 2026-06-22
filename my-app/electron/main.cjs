// Electron main process for the chess desktop app (plan §4.1, §9).
//
// Serves the RN Web static export (dist-web/) over a local HTTP server so the
// three.js renderer's fetch('./chess.glb') etc. work (file:// would block fetch),
// and bridges the system Stockfish binary (Homebrew `stockfish`) to the renderer
// via a UCI-over-stdin/stdout child process. Exposes `window.desktopBridge` via
// the preload script; the RN app attaches it as a JsChessEngine.

const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist-web');
const HTTP_PORT = 8888;

const MIME_TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream',
  '.ktx': 'application/octet-stream', '.map': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

// ── Static file server (so fetch() works for assets) ──────────────────────────
function startStaticServer() {
  return http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(DIST_DIR, urlPath);
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(data);
    });
  }).listen(HTTP_PORT);
}

// ── Stockfish UCI bridge (child_process) ──────────────────────────────────────
class StockfishBridge {
  constructor() {
    this.sf = spawn('stockfish');
    this.lineBuffer = '';
    this.ready = false;
    this.readyResolvers = [];
    this.pendingMoveResolver = null;

    this.sf.stdout.on('data', (chunk) => {
      this.lineBuffer += chunk.toString();
      const lines = this.lineBuffer.split('\n');
      this.lineBuffer = lines.pop(); // keep the partial trailing line
      for (const line of lines) this.handleLine(line.trim());
    });
    this.sf.stderr.on('data', (d) => console.error('[stockfish]', d.toString()));
    this.sf.on('exit', () => { this.ready = false; });

    // Kick off the UCI handshake.
    this.send('uci');
  }

  send(cmd) {
    this.sf.stdin.write(cmd + '\n');
  }

  handleLine(line) {
    if (line === 'uciok') {
      this.send('isready');
    } else if (line === 'readyok') {
      this.ready = true;
      this.readyResolvers.forEach((r) => r());
      this.readyResolvers = [];
    } else if (line.startsWith('bestmove')) {
      if (this.pendingMoveResolver) {
        const move = line.split(/\s+/)[1];
        this.pendingMoveResolver(move && move !== '(none)' ? move : null);
        this.pendingMoveResolver = null;
      }
    }
  }

  async waitReady() {
    if (this.ready) return;
    await new Promise((resolve) => this.readyResolvers.push(resolve));
  }

  async getBestMove(fen, thinkTimeMs) {
    await this.waitReady();
    return new Promise((resolve) => {
      this.pendingMoveResolver = resolve;
      this.send(`position fen ${fen}`);
      this.send(`go movetime ${thinkTimeMs}`);
    });
  }
}

let stockfish = null;

// ── App lifecycle ─────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(`http://localhost:${HTTP_PORT}/`);
}

app.whenReady().then(() => {
  startStaticServer();
  try {
    stockfish = new StockfishBridge();
  } catch (e) {
    console.warn('[electron] Stockfish not available, falling back to CPU:', e.message);
  }

  ipcMain.handle('stockfish:getBestMove', async (_event, fen, thinkTimeMs) => {
    if (!stockfish) return null;
    try {
      return await stockfish.getBestMove(fen, thinkTimeMs);
    } catch (e) {
      console.error('[stockfish] error:', e);
      return null;
    }
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (stockfish) { stockfish.sf.kill(); stockfish = null; }
  app.quit();
});
