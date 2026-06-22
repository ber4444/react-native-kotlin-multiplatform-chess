package com.anonymous.myapp

import android.content.Context
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * Android Stockfish bridge (plan §9). Launches the vendored `libstockfish.so`
 * from the app's `nativeLibraryDir` as a child process (requires
 * `jniLibs.useLegacyPackaging = true` so the .so is extracted executable), then
 * drives it via UCI over stdin/stdout. Exposes a single @ReactMethod
 * `getBestMove(fen, thinkTimeMs, promise)` consumed from JS as
 * `NativeModules.StockfishAndroid.getBestMove`.
 *
 * On any failure (binary missing, crash, illegal position) the Promise resolves
 * null → the Kotlin core's `pickMoveCPU` fallback takes over (unchanged).
 */
class StockfishModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "StockfishAndroid"
    }

    override fun getName(): String = NAME

    private var process: Process? = null
    private var stdin: java.io.OutputStream? = null
    private var stdout: BufferedReader? = null
    private val lock = Any()

    /**
     * Lazily spawns Stockfish and runs the UCI handshake (uci→uciok, isready→readyok).
     * Synchronized so concurrent getBestMove calls serialize naturally.
     */
    private fun ensureReady(context: Context) {
        if (process?.isAlive == true) return
        synchronized(lock) {
            if (process?.isAlive == true) return
            val nativeDir = context.applicationInfo.nativeLibraryDir
            val stockfishPath = "$nativeDir/libstockfish.so"
            process = ProcessBuilder(stockfishPath).redirectErrorStream(true).start()
            stdin = process?.outputStream
            stdout = BufferedReader(InputStreamReader(process?.inputStream))
            // UCI handshake — block until ready.
            send("uci")
            send("isready")
            while (true) {
                val line = stdout?.readLine() ?: throw RuntimeException("stockfish EOF during handshake")
                if (line.contains("readyok")) break
            }
        }
    }

    private fun send(cmd: String) {
        stdin?.write("$cmd\n".toByteArray())
        stdin?.flush()
    }

    @ReactMethod
    fun getBestMove(fen: String, thinkTimeMs: Int, promise: Promise) {
        // Run on a background thread so we don't block the JS/UI thread while
        // Stockfish thinks.
        Thread {
            try {
                ensureReady(reactApplicationContext)
                synchronized(lock) {
                    send("position fen $fen")
                    send("go movetime $thinkTimeMs")
                    while (true) {
                        val line = stdout?.readLine()
                            ?: run { promise.resolve(null); return@Thread }
                        if (line.startsWith("bestmove")) {
                            val move = line.split(" ").getOrNull(1)
                            promise.resolve(if (move != null && move != "(none)") move else null)
                            return@Thread
                        }
                    }
                }
            } catch (e: Exception) {
                // Any failure → resolve null so the Kotlin CPU fallback handles Black's move.
                promise.resolve(null)
            }
        }.start()
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        val nativeDir = reactApplicationContext.applicationInfo.nativeLibraryDir
        val soFile = java.io.File("$nativeDir/libstockfish.so")
        promise.resolve(soFile.exists())
    }

    override fun onCatalystInstanceDestroy() {
        try { process?.destroy() } catch (_: Exception) {}
        process = null
        super.onCatalystInstanceDestroy()
    }
}
