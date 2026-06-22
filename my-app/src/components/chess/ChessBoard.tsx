// Port of the 2D `Board` + `Square` composables (GameScreen.kt). Renders an 8×8
// grid with selection highlights, legal-move rings, piece SVGs, and the slide
// animation overlay. Square sizing is explicit (boardSize/8) so the animated
// piece's translate offsets line up exactly.

import { StyleSheet, View } from 'react-native';

import type { ChessSnapshot } from '@/chess-core';
import type { ChessTheme } from '@/constants/chessTheme';
import { SQUARE_COLORS } from '@/constants/chessTheme';
import { parseLegalMoves } from '@/chess-core';

import { AnimatedChessPiece } from './AnimatedChessPiece';
import { ChessPieceSvg } from './ChessPieceSvg';

type SquareType =
  | 'Empty'
  | 'WhitePiece'
  | 'BlackPiece'
  | 'CanMove'
  | 'CannotMove'
  | 'PossibleMove'
  | 'PossibleCapture';

interface ChessBoardProps {
  snapshot: ChessSnapshot;
  theme: ChessTheme;
  boardSize: number;
  onSelectSquare: (row: number, col: number) => void;
  onMoveTo: (row: number, col: number) => void;
  onAnimationEnd: () => void;
}

const isSquareHiddenByAnimation = (
  snapshot: ChessSnapshot,
  row: number,
  col: number,
): boolean => {
  if (!snapshot.animating) return false;
  const matches = (r: number, c: number) => r === row && c === col;
  if (
    matches(snapshot.animFromRow, snapshot.animFromCol) ||
    matches(snapshot.animToRow, snapshot.animToCol)
  ) {
    return true;
  }
  if (snapshot.animSecondary) {
    if (
      matches(snapshot.animSecondaryFromRow, snapshot.animSecondaryFromCol) ||
      matches(snapshot.animSecondaryToRow, snapshot.animSecondaryToCol)
    ) {
      return true;
    }
  }
  return false;
};

export function ChessBoard({
  snapshot,
  theme,
  boardSize,
  onSelectSquare,
  onMoveTo,
  onAnimationEnd,
}: ChessBoardProps) {
  const squareSize = boardSize / 8;
  const legalMoves = parseLegalMoves(snapshot);
  const legalSet = new Set(legalMoves.map(m => `${m.row},${m.col}`));
  const whitePosSet = new Set(snapshot.piecesWhite.map(p => `${p.row},${p.col}`));
  const blackPosSet = new Set(snapshot.piecesBlack.map(p => `${p.row},${p.col}`));

  // Build a quick lookup from "row,col" → piece for both colours.
  const whitePieceAt = new Map(snapshot.piecesWhite.map(p => [`${p.row},${p.col}`, p]));
  const blackPieceAt = new Map(snapshot.piecesBlack.map(p => [`${p.row},${p.col}`, p]));

  const selKey =
    snapshot.hasSelection ? `${snapshot.selectedRow},${snapshot.selectedCol}` : null;

  const rows = [];
  for (let row = 0; row < 8; row++) {
    const cols = [];
    for (let col = 0; col < 8; col++) {
      const key = `${row},${col}`;
      const isDark = (row + col) % 2 === 1;
      const isWhite = whitePosSet.has(key);
      const isBlack = blackPosSet.has(key);
      const isLegal = legalSet.has(key);

      let squareType: SquareType;
      if (selKey === key) {
        squareType = legalMoves.length > 0 ? 'CanMove' : 'CannotMove';
      } else if (isLegal) {
        squareType = isBlack ? 'PossibleCapture' : 'PossibleMove';
      } else if (isWhite) {
        squareType = 'WhitePiece';
      } else if (isBlack) {
        squareType = 'BlackPiece';
      } else {
        squareType = 'Empty';
      }

      const clickable =
        squareType === 'PossibleMove' ||
        squareType === 'PossibleCapture' ||
        squareType === 'WhitePiece';

      const hidePiece = isSquareHiddenByAnimation(snapshot, row, col);

      let borderW = 0;
      let borderColor = 'transparent';
      if (squareType === 'CanMove') {
        borderW = Math.max(1, squareSize * 0.03);
        borderColor = SQUARE_COLORS.selectedCanMoveBorder;
      } else if (squareType === 'CannotMove') {
        borderW = Math.max(1, squareSize * 0.03);
        borderColor = SQUARE_COLORS.selectedCannotMoveBorder;
      }

      const showRing = squareType === 'PossibleMove' || squareType === 'PossibleCapture';
      const ringColor =
        squareType === 'PossibleCapture'
          ? SQUARE_COLORS.possibleCaptureRing
          : SQUARE_COLORS.possibleMoveRing;

      cols.push(
        <View
          key={key}
          style={[
            styles.square,
            {
              width: squareSize,
              height: squareSize,
              backgroundColor: isDark ? theme.secondary : 'white',
              borderWidth: borderW,
              borderColor,
            },
          ]}
        >
          {!hidePiece && (squareType === 'WhitePiece' || squareType === 'CanMove' || squareType === 'CannotMove') && whitePieceAt.has(key) && (
            <ChessPieceSvg
              kind={whitePieceAt.get(key)!.kind}
              color={whitePieceAt.get(key)!.color}
              size={squareSize * 0.88}
            />
          )}
          {!hidePiece && (squareType === 'BlackPiece' || squareType === 'PossibleCapture') && blackPieceAt.has(key) && (
            <ChessPieceSvg
              kind={blackPieceAt.get(key)!.kind}
              color={blackPieceAt.get(key)!.color}
              size={squareSize * 0.88}
            />
          )}
          {showRing && (
            <View
              style={[
                styles.ring,
                {
                  width: squareSize * 0.55,
                  height: squareSize * 0.55,
                  borderRadius: (squareSize * 0.55) / 2,
                  borderWidth: Math.max(3, squareSize * 0.12),
                  borderColor: ringColor,
                },
              ]}
              pointerEvents="none"
            />
          )}
          {clickable && (
            <View
              style={styles.hit}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => {
                if (squareType === 'WhitePiece') {
                  onSelectSquare(row, col);
                } else if (squareType === 'PossibleMove' || squareType === 'PossibleCapture') {
                  onMoveTo(row, col);
                }
              }}
            />
          )}
        </View>,
      );
    }
    rows.push(
      <View key={`row-${row}`} style={styles.row}>
        {cols}
      </View>,
    );
  }

  return (
    <View style={{ width: boardSize, height: boardSize }}>
      {rows}
      {snapshot.animating && (
        <>
          <AnimatedChessPiece
            kind={snapshot.animKind}
            color={snapshot.animColor}
            squareSizePx={squareSize}
            fromRow={snapshot.animFromRow}
            fromCol={snapshot.animFromCol}
            toRow={snapshot.animToRow}
            toCol={snapshot.animToCol}
            onAnimationEnd={onAnimationEnd}
          />
          {snapshot.animSecondary && (
            <AnimatedChessPiece
              kind={snapshot.animSecondaryKind}
              color={snapshot.animColor}
              squareSizePx={squareSize}
              fromRow={snapshot.animSecondaryFromRow}
              fromCol={snapshot.animSecondaryFromCol}
              toRow={snapshot.animSecondaryToRow}
              toCol={snapshot.animSecondaryToCol}
              onAnimationEnd={() => {}}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  square: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  hit: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
