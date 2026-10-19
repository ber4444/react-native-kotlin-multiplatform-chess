package expo.modules.stockfish

import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.File
import java.io.OutputStream

/**
 * Android Stockfish bridge (plan §9). Launches the bundled `libstockfish.so`
 * from the app's `nativeLibraryDir` as a child process, then drives it via UCI
 * over stdin/stdout.
 *
 * The binary has to be extracted to disk to be executable, so app.json sets
 * `android.useLegacyPackaging: true` through expo-build-properties.
 *
 * On any failure (binary missing, crash, illegal position) `getBestMove`
 * resolves null and the Kotlin core's `pickMoveCPU` fallback takes over.
 */
class StockfishModule : Module() {
  private val lock = Any()
  @Volatile private var process: Process? = null
  private var stdin: OutputStream? = null
  private var stdout: BufferedReader? = null

  private val binary: File?
    get() = appContext.reactContext?.applicationInfo?.nativeLibraryDir
      ?.let { File(it, "libstockfish.so") }

  override fun definition() = ModuleDefinition {
    Name("Stockfish")

    // Stockfish thinks for up to thinkTimeMs while we block on its output, so
    // run on the IO pool instead of Expo's shared module queue.
    AsyncFunction("getBestMove") Coroutine { fen: String, thinkTimeMs: Int ->
      withContext(Dispatchers.IO) { bestMove(fen, thinkTimeMs) }
    }

    AsyncFunction("isAvailable") {
      binary?.exists() == true
    }

    // Not under the lock: killing the process also unblocks a search in progress.
    OnDestroy { stop() }
  }

  /** Serialized so concurrent calls queue up on the single engine process. */
  private fun bestMove(fen: String, thinkTimeMs: Int): String? = synchronized(lock) {
    // UCI is newline-delimited, so a FEN carrying CR/LF would smuggle extra commands into the
    // engine's stdin rather than being parsed as a position. Reject before touching the process;
    // JS already treats null as "no engine move", so pickMoveCPU takes over as it would for any
    // position Stockfish declines. Stockfish stays the authority on whether a FEN is *legal* —
    // this only guards the command boundary.
    if (!fen.matches(FEN_CHARS)) return null
    try {
      ensureReady()
      send("position fen $fen")
      send("go movetime $thinkTimeMs")
      val line = checkNotNull(readUntil { it.startsWith("bestmove") }) { "stockfish exited" }
      line.split(" ").getOrNull(1)?.takeIf { it != "(none)" }
    } catch (_: Exception) {
      // Drop the engine so the next call starts a fresh one.
      stop()
      null
    }
  }

  private fun stop() {
    try { process?.destroy() } catch (_: Exception) {}
    process = null
  }

  /** Lazily spawns Stockfish and runs the UCI handshake. Caller holds [lock]. */
  private fun ensureReady() {
    if (process?.isRunning() == true) return
    val path = checkNotNull(binary) { "React context is not available" }.path
    val proc = ProcessBuilder(path).redirectErrorStream(true).start()
    process = proc
    stdin = proc.outputStream
    stdout = proc.inputStream.bufferedReader()
    send("uci")
    send("isready")
    checkNotNull(readUntil { it.contains("readyok") }) { "stockfish EOF during handshake" }
  }

  private fun send(cmd: String) {
    stdin?.write("$cmd\n".toByteArray())
    stdin?.flush()
  }

  /** Reads lines until one matches, or returns null if the process exits first. */
  private fun readUntil(predicate: (String) -> Boolean): String? =
    generateSequence { stdout?.readLine() }.firstOrNull(predicate)

  // Process.isAlive() needs API 26; the app's minSdk is 24.
  private fun Process.isRunning(): Boolean =
    try {
      exitValue()
      false
    } catch (_: IllegalThreadStateException) {
      true
    }

  private companion object {
    /**
     * Every character a FEN can legitimately hold: piece letters, rank digits, '/' between ranks,
     * the spaces separating its six fields, and '-' for an empty castling or en-passant field
     * (castling also allows file letters under Shredder-FEN). An allowlist rather than a
     * blocklist of separators, so control characters and future UCI metacharacters are covered
     * without having to enumerate them.
     */
    val FEN_CHARS = Regex("[A-Za-z0-9/ -]+")
  }
}
