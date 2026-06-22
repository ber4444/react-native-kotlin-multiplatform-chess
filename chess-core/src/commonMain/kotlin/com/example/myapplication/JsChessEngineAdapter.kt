package com.example.myapplication

import kotlin.js.Promise
import kotlinx.coroutines.await

/**
 * Adapts a [JsChessEngine] (JS-side, Promise-returning) to the Kotlin
 * [ChessEngine] interface (suspend). The core's `pickMoveStockfish` and
 * `evaluatePositionCp` then drive it transparently.
 */
internal class JsChessEngineAdapter(
    private val jsEngine: JsChessEngine,
) : ChessEngine {
    private val thinkTimeMs: Int = UciProtocolClient.DEFAULT_THINK_TIME_MS.toInt()

    override suspend fun getBestMove(fen: String): String? =
        jsEngine.getBestMove(fen, thinkTimeMs).await()

    override fun close() {
        // JS engines own their own lifecycle (worker/process); nothing to free here.
    }
}
