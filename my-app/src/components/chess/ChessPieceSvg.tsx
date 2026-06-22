// Renders a chess piece (king/queen/rook/bishop/knight/pawn, white or black) as
// react-native-svg paths sourced from the original Android vector drawables.
//
// Mirrors the Compose `Piece` composable (GameScreen.kt) which drew a single
// DrawableResource via painterResource. Here we look up the path set by
// `<kind>_<light|dark>` and render each path on a 45×45 viewBox.

import Svg, { Path } from 'react-native-svg';

import { PIECE_PATHS, PIECE_VIEWBOX, type PiecePath } from './piece-paths.generated';

export type PieceKind = 'KING' | 'QUEEN' | 'ROOK' | 'BISHOP' | 'KNIGHT' | 'PAWN';
export type PieceColor = 'WHITE' | 'BLACK';

interface ChessPieceSvgProps {
  kind: string;
  color: string;
  size?: number;
}

function keyFor(kind: string, color: string): string {
  const shade = color === 'BLACK' ? 'dark' : 'light';
  return `${kind.toLowerCase()}_${shade}`;
}

export function ChessPieceSvg({ kind, color, size = 40 }: ChessPieceSvgProps) {
  const paths: PiecePath[] = PIECE_PATHS[keyFor(kind, color)] ?? [];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${PIECE_VIEWBOX} ${PIECE_VIEWBOX}`}>
      {paths.map((p, i) => (
        <Path
          key={i}
          d={p.d}
          fill={p.fill === 'none' ? undefined : p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinejoin={p.strokeLinejoin}
          strokeLinecap={p.strokeLinecap}
          fillRule={p.fillRule}
        />
      ))}
    </Svg>
  );
}

/** The "no winner" icon shown in the game-over popup for draws/stalemate. */
export function NoWinnerIcon({ size = 50 }: { size?: number }) {
  const paths: PiecePath[] = PIECE_PATHS['no_winner'] ?? [];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${PIECE_VIEWBOX} ${PIECE_VIEWBOX}`}>
      {paths.map((p, i) => (
        <Path
          key={i}
          d={p.d}
          fill={p.fill === 'none' ? undefined : p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          strokeLinejoin={p.strokeLinejoin}
          strokeLinecap={p.strokeLinecap}
          fillRule={p.fillRule}
        />
      ))}
    </Svg>
  );
}
