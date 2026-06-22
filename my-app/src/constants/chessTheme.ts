// Ported from compose-multiplatform-chess ui/theme/{Color,Theme}.kt.
// Material 3 color tokens used by the chess board. The board's dark squares use
// the theme `secondary` token (PurpleGrey40 light / PurpleGrey80 dark), matching
// the web/iOS Compose look.

import { useColorScheme } from 'react-native';

export const COLORS = {
  // Color.kt equivalents
  purple80: '#D0BCFF',
  purpleGrey80: '#CCC2DC',
  pink80: '#EFB8C8',
  purple40: '#6650a4',
  purpleGrey40: '#625b71',
  pink40: '#7D5260',
} as const;

export interface ChessTheme {
  primary: string;
  secondary: string;
  tertiary: string;
  isDark: boolean;
}

export function useChessTheme(): ChessTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    primary: isDark ? COLORS.purple80 : COLORS.purple40,
    secondary: isDark ? COLORS.purpleGrey80 : COLORS.purpleGrey40,
    tertiary: isDark ? COLORS.pink80 : COLORS.pink40,
    isDark,
  };
}

// Square state highlight colours — verbatim from GameScreen.kt's SquareType styling.
export const SQUARE_COLORS = {
  selectedCanMoveBorder: 'green',
  selectedCannotMoveBorder: 'red',
  possibleMoveRing: 'yellow',
  possibleCaptureRing: 'red',
} as const;
