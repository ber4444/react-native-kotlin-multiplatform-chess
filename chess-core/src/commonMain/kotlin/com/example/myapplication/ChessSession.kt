@file:Suppress("unused")
@file:OptIn(kotlin.js.ExperimentalJsExport::class)

package com.example.myapplication

import com.example.myapplication.board3d.Board3DSceneMapper
import com.example.myapplication.board3d.Board3DSessionState
import com.example.myapplication.board3d.CameraMath
import com.example.myapplication.board3d.BoardRayPicker
import com.example.myapplication.board3d.BoardSquare
import com.example.myapplication.board3d.PieceColor
import com.example.myapplication.board3d.encode
import com.example.myapplication.board3d.Board3DScene
import kotlin.js.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

// ──────────────────────────────────────────────────────────────────────────────
// JS-facing DTOs. All exposed types must be @JsExport-compatible (primitives,
// String, arrays thereof, or @JsExport classes). No Pair<*,*>, no arbitrary
// Kotlin classes cross the boundary.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * One piece on the board, as seen from JS. `kind` is the upper-case simple class
 * name ("KING", "QUEEN", ...); [color] is "WHITE" or "BLACK".
 */
@JsExport
data class PieceDto(
    val kind: String,
    val color: String,
    val row: Int,
    val col: Int,
)

/**
 * The camera the 3D renderer should project with. Matches the `setCamera`
 * argument shape consumed by `window.chess3d.setCamera`.
 */
@JsExport
data class CameraView(
    val px: Float, val py: Float, val pz: Float,
    val tx: Float, val ty: Float, val tz: Float,
    val ux: Float, val uy: Float, val uz: Float,
    val fov: Float,
    val aspect: Float,
)

/**
 * One piece in the 3D scene, JS-friendly. `kind` is the `PieceKind` ordinal
 * (0=KING, 1=QUEEN, 2=ROOK, 3=BISHOP, 4=KNIGHT, 5=PAWN) — same index the three.js
 * `KIND_NAMES` array and Filament's mesh-name lookup both consume. `color` is
 * 0=WHITE / 1=BLACK. Position is world space from `BoardGeometry.squareCenter`.
 *
 * This is the unit both BoardRenderer backends reconcile against: three.js's
 * fixed node pool and Filament's 32-slot `<ModelInstance>` pool.
 */
@JsExport
data class PieceInstanceDto(
    val kind: Int,
    val color: Int,
    val row: Int,
    val col: Int,
    val x: Float,
    val y: Float,
    val z: Float,
    val rotationYDegrees: Float,
)

/**
 * The ONE scene model both renderers consume (plan §6). Native (Filament)
 * iterates [pieces] to position its `<ModelInstance>` pool; web (three.js) calls
 * `currentSceneEncoded()` for the compact wire form. Same source of truth.
 */
@JsExport
data class SceneDto(
    val pieces: Array<PieceInstanceDto>,
    val sideToMove: Int,          // 0=WHITE, 1=BLACK
    val selectedRow: Int,
    val selectedCol: Int,
    val hasSelection: Boolean,
)

/**
 * Immutable UI snapshot pushed to JS on every state change. RN derives its whole
 * render tree from this object via `useSyncExternalStore`/`useState`. Mirrors the
 * three Kotlin StateFlows (gameState + animState + viewState) collapsed into one.
 *
 * Legal-move targets for the selected square are flattened into [legalMoves] as
 * `[r1,c1, r2,c2, ...]` pairs so the 2D board can render dots without recomputing
 * move generation in JS.
 */
@JsExport
data class ChessSnapshot(
    val turn: String,
    val winState: String,
    val piecesWhite: Array<PieceDto>,
    val piecesBlack: Array<PieceDto>,
    val selectedRow: Int,
    val selectedCol: Int,
    val hasSelection: Boolean,
    val legalMoves: IntArray,
    val pendingPromotion: Boolean,
    val drawOfferBy: String?,
    val drawOfferDeclinedBy: String?,
    val show3D: Boolean,
    val board3DUnavailable: Boolean,
    val moveButtonLock: Boolean,
    // 2D slide animation (mirrors PieceAnimationState). When [animating] is false
    // the 2D board renders pieces statically; when true it renders the moving
    // piece(s) via react-native-reanimated from *Row/*Col -> *Row/*Col.
    val animating: Boolean,
    val animKind: String,
    val animColor: String,
    val animFromRow: Int,
    val animFromCol: Int,
    val animToRow: Int,
    val animToCol: Int,
    val animSecondary: Boolean,
    val animSecondaryKind: String,
    val animSecondaryFromRow: Int,
    val animSecondaryFromCol: Int,
    val animSecondaryToRow: Int,
    val animSecondaryToCol: Int,
    // Current FEN (for debugging / restoring state across 2D<->3D switches).
    val fen: String,
)

/**
 * A JS-side chess engine. Implementations return a Promise that resolves to the
 * best move in UCI notation (e.g. "e2e4", "e7e8q") or null when no engine is
 * available — the Kotlin core then falls back to its built-in CPU mover.
 *
 * Pass an instance to [ChessSession.attachEngine].
 */
@JsExport
fun interface JsChessEngine {
    /**
     * @param fen current position in FEN
     * @param thinkTimeMs suggested per-move thinking budget
     * @return Promise<String | null> UCI best move or null
     */
    fun getBestMove(fen: String, thinkTimeMs: Int): Promise<String?>
}

private fun Piece.kindName(): String = when (this) {
    is King -> "KING"
    is Queen -> "QUEEN"
    is Rook -> "ROOK"
    is Bishop -> "BISHOP"
    is Knight -> "KNIGHT"
    is Pawn -> "PAWN"
    else -> "UNKNOWN"
}

private fun Piece.colorName(): String = if (set == Set.WHITE) "WHITE" else "BLACK"

private const val INVALID_ROW = -9
private const val INVALID_COL = -9

/**
 * Kotlin/JS interop facade for the React Native app. Created once per game;
 * the RN side keeps a single instance, drives inputs synchronously, and renders
 * from the snapshot stream returned by [subscribe]. See plan §5.2.
 *
 * No game logic lives in JS — every method delegates into the (Compose-free)
 * Kotlin core and emits a new [ChessSnapshot] through the active subscription.
 */
@JsExport
class ChessSession {
    internal val viewModel: GameViewModel = GameViewModel()
    internal val cameraSession: Board3DSessionState = Board3DSessionState()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val subscribers = mutableMapOf<Int, Job>()
    private var nextSubscriberId = 0

    // ── Outputs ───────────────────────────────────────────────────────────────

    /**
     * Synchronous read of the current snapshot. Use to seed initial render state
     * before [subscribe]'s first (async) emission lands.
     */
    fun getSnapshot(): ChessSnapshot {
        return buildSnapshot(
            viewModel.gameState.value,
            viewModel.animState.value,
            viewModel.viewState.value,
        )
    }

    /**
     * Subscribes to UI state changes. [cb] is invoked with a fresh [ChessSnapshot]
     * immediately (current state) and on every subsequent change. Returns an
     * unsubscribe function.
     */
    fun subscribe(cb: (ChessSnapshot) -> Unit): () -> Unit {
        val id = nextSubscriberId++
        val job = scope.launch {
            combine(viewModel.gameState, viewModel.animState, viewModel.viewState) { gs, an, vs ->
                buildSnapshot(gs, an, vs)
            }.collect { cb(it) }
        }
        subscribers[id] = job
        return {
            job.cancel()
            subscribers.remove(id)
        }
    }

    /**
     * The current 3D scene as a structured JS DTO — the ONE model both renderers
     * consume (plan §6). Filament iterates `pieces` for its `<ModelInstance>` pool.
     */
    fun currentScene(): SceneDto {
        val fen = FenConverter.gameStateToFen(viewModel.gameState.value)
        val scene = Board3DSceneMapper.fromFen(fen)
        val sel = viewModel.gameState.value.selectedSquare
        return SceneDto(
            pieces = Array(scene.pieces.size) { i ->
                val p = scene.pieces[i]
                PieceInstanceDto(
                    kind = p.kind.ordinal,
                    color = if (p.color == PieceColor.WHITE) 0 else 1,
                    row = p.square.row,
                    col = p.square.col,
                    x = p.position.x,
                    y = p.position.y,
                    z = p.position.z,
                    rotationYDegrees = p.rotationYDegrees,
                )
            },
            sideToMove = if (scene.sideToMove == PieceColor.WHITE) 0 else 1,
            selectedRow = if (sel != INVALID_POSITION) sel.first else -1,
            selectedCol = if (sel != INVALID_POSITION) sel.second else -1,
            hasSelection = sel != INVALID_POSITION,
        )
    }

    /** Compact wire form (`Board3DScene.encode()`) — convenience for the three.js path. */
    fun currentSceneEncoded(): String {
        val fen = FenConverter.gameStateToFen(viewModel.gameState.value)
        return Board3DSceneMapper.fromFen(fen).encode()
    }

    /** The current 3D camera, derived from the session's OrbitCameraController. */
    fun currentCamera(): CameraView {
        val c = cameraSession.camera
        return CameraView(
            c.position.x, c.position.y, c.position.z,
            c.target.x, c.target.y, c.target.z,
            c.up.x, c.up.y, c.up.z,
            c.fovYDegrees, c.aspect,
        )
    }

    /** Current FEN of the game. */
    fun currentFen(): String =
        FenConverter.gameStateToFen(viewModel.gameState.value)

    // ── 2D inputs ─────────────────────────────────────────────────────────────

    /** Selects a square (a White piece) for highlighting + legal-move display. */
    fun selectSquare(row: Int, col: Int) {
        viewModel.updateSelected(Pair(row, col))
    }

    /** Clears the current selection. */
    fun clearSelection() {
        viewModel.updateSelected(INVALID_POSITION)
    }

    /**
     * Plays White's move from ([fromRow],[fromCol]) to ([toRow],[toCol]). No-op if
     * the source isn't a White piece, the move is illegal, or it isn't White's turn.
     */
    fun playerMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int) {
        val idx = viewModel.gameState.value.positionsWhite.indexOf(Pair(fromRow, fromCol))
        if (idx != -1) viewModel.playerMove(idx, Pair(toRow, toCol))
    }

    /** Completes a pending promotion (0=QUEEN, 1=ROOK, 2=BISHOP, 3=KNIGHT). */
    fun promote(typeOrdinal: Int) {
        val type = PromotionType.entries.getOrNull(typeOrdinal) ?: return
        viewModel.promotePawn(type)
    }

    /** Cancels a pending promotion. */
    fun cancelPromotion() {
        viewModel.cancelPromotion()
    }

    // ── Animation lifecycle ───────────────────────────────────────────────────

    /**
     * Signals that the 2D slide animation completed. The RN 2D board must call
     * this after its react-native-reanimated slide finishes so the core can
     * trigger Black's reply (and unlock further White input).
     */
    fun animationEnd() {
        viewModel.animationEnd()
    }

    // ── Draw offers ───────────────────────────────────────────────────────────

    fun offerDraw() { viewModel.requestDrawOffer() }
    fun acceptDrawOffer() { viewModel.acceptDrawOffer() }
    fun declineDrawOffer() { viewModel.declineDrawOffer() }

    // ── Game lifecycle ────────────────────────────────────────────────────────

    fun resetGame() { viewModel.resetGame() }
    fun hideWindow() { viewModel.hideWindow() }

    // ── 3D view controls ──────────────────────────────────────────────────────

    fun setShow3D(enabled: Boolean) { viewModel.setShow3D(enabled) }
    fun markBoard3DUnavailable() { viewModel.markBoard3DUnavailable() }

    /** Drags the 3D camera (normalized deltas). */
    fun cameraDrag(dx: Float, dy: Float) { cameraSession.onDrag(dx, dy) }

    /** Pinch-zooms the 3D camera (factor). */
    fun cameraZoom(factor: Float) { cameraSession.onZoom(factor) }

    /** Updates the 3D camera aspect on viewport resize. */
    fun cameraResize(aspect: Float) { cameraSession.onResize(aspect) }

    /**
     * Picks the board square under a normalized screen tap (origin top-left,
     * [xNorm],[yNorm] in [0,1]). Returns `row*8 + col`, or -1 if the ray misses
     * the board. Reuses the Kotlin [BoardRayPicker] so 2D and 3D picking match.
     */
    fun pickSquareFromRay(xNorm: Float, yNorm: Float): Int {
        val camera = cameraSession.camera
        val ray = CameraMath.rayFromScreen(camera, xNorm, yNorm)
        val fen = FenConverter.gameStateToFen(viewModel.gameState.value)
        val scene: Board3DScene? = runCatching { Board3DSceneMapper.fromFen(fen) }.getOrNull()
        val sq: BoardSquare? = BoardRayPicker.pickSquare(ray, scene)
        return sq?.let { it.row * 8 + it.col } ?: -1
    }

    // ── Engine ────────────────────────────────────────────────────────────────

    /**
     * Attaches a JS-side [JsChessEngine] (e.g. a Stockfish worker bridge). When
     * omitted, Black falls back to the built-in CPU mover.
     */
    fun attachEngine(engine: JsChessEngine?) {
        if (engine == null) { viewModel.attachEngine(null); return }
        viewModel.attachEngine(JsChessEngineAdapter(engine))
    }

    /** Releases the Kotlin core's coroutine scope + any attached engine. */
    fun close() {
        scope.cancel()
        viewModel.close()
    }

    // ── Snapshot builder ──────────────────────────────────────────────────────

    private fun buildSnapshot(
        gs: GameUiState,
        an: PieceAnimationState,
        vs: ViewState,
    ): ChessSnapshot {
        val piecesWhite = Array(gs.piecesWhite.size) { i ->
            val p = gs.piecesWhite[i]
            val pos = gs.positionsWhite[i]
            PieceDto(p.kindName(), p.colorName(), pos.first, pos.second)
        }
        val piecesBlack = Array(gs.piecesBlack.size) { i ->
            val p = gs.piecesBlack[i]
            val pos = gs.positionsBlack[i]
            PieceDto(p.kindName(), p.colorName(), pos.first, pos.second)
        }

        val legalMoves: IntArray = if (gs.selectedSquare != INVALID_POSITION) {
            val idx = gs.positionsWhite.indexOf(gs.selectedSquare)
            if (idx != -1) {
                val moves = getLegalMovesForPiece(
                    pieceIndex = idx,
                    enemyPieces = gs.piecesBlack,
                    enemyPositions = gs.positionsBlack,
                    allyPositions = gs.positionsWhite,
                    allyPieces = gs.piecesWhite,
                    castlingRights = gs.castlingRights,
                    enPassantTarget = gs.enPassantTarget,
                )
                IntArray(moves.size * 2) { k ->
                    val m = moves[k / 2]
                    if (k % 2 == 0) m.first else m.second
                }
            } else IntArray(0)
        } else IntArray(0)

        val animating = an.pieceToAnimate != null && an.moveIsValid()
        val sel = gs.selectedSquare

        return ChessSnapshot(
            turn = gs.turn.name,
            winState = gs.winState.name,
            piecesWhite = piecesWhite,
            piecesBlack = piecesBlack,
            selectedRow = if (sel == INVALID_POSITION) INVALID_ROW else sel.first,
            selectedCol = if (sel == INVALID_POSITION) INVALID_COL else sel.second,
            hasSelection = sel != INVALID_POSITION,
            legalMoves = legalMoves,
            pendingPromotion = gs.pendingPromotion != null,
            drawOfferBy = gs.drawOffer?.name,
            drawOfferDeclinedBy = gs.drawOfferDeclinedBy?.name,
            show3D = vs.show3D,
            board3DUnavailable = vs.board3DUnavailable,
            moveButtonLock = vs.moveButtonLock,
            animating = animating,
            animKind = if (animating) an.pieceToAnimate!!.kindName() else "",
            animColor = if (animating) an.pieceToAnimate!!.colorName() else "",
            animFromRow = an.animatePositionStart.first,
            animFromCol = an.animatePositionStart.second,
            animToRow = an.animatePositionEnd.first,
            animToCol = an.animatePositionEnd.second,
            animSecondary = animating && an.secondaryPiece != null,
            animSecondaryKind = if (animating && an.secondaryPiece != null) an.secondaryPiece!!.kindName() else "",
            animSecondaryFromRow = an.secondaryStart.first,
            animSecondaryFromCol = an.secondaryStart.second,
            animSecondaryToRow = an.secondaryEnd.first,
            animSecondaryToCol = an.secondaryEnd.second,
            fen = FenConverter.gameStateToFen(gs),
        )
    }
}
