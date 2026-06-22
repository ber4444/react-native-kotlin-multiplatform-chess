// Electron preload — exposes a minimal `window.desktopBridge` for the renderer
// (the RN app) to call the system Stockfish via IPC. The RN app detects this and
// attaches it as a JsChessEngine (plan §9). Uses contextBridge so the renderer
// has no direct Node access.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopBridge', {
  isElectron: true,
  getBestMove: (fen, thinkTimeMs) => ipcRenderer.invoke('stockfish:getBestMove', fen, thinkTimeMs),
});
