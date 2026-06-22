// Port of AnimatedChessPiece (GameScreen.kt) — slides a piece from `from` to
// `to` over ~500ms via react-native-reanimated (plan §7.1), then invokes
// onAnimationEnd. Positioned by square index × squareSizePx so it lines up with
// the grid board. Shared values + useAnimatedStyle keep this compatible with the
// React Compiler (no ref access during render).

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { ChessPieceSvg } from './ChessPieceSvg';

interface AnimatedChessPieceProps {
  kind: string;
  color: string;
  squareSizePx: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  onAnimationEnd: () => void;
}

export function AnimatedChessPiece({
  kind,
  color,
  squareSizePx,
  fromRow,
  fromCol,
  toRow,
  toCol,
  onAnimationEnd,
}: AnimatedChessPieceProps) {
  const offsetX = useSharedValue(fromCol * squareSizePx);
  const offsetY = useSharedValue(fromRow * squareSizePx);
  const ended = useSharedValue(false);

  useEffect(() => {
    ended.value = false;
    offsetX.value = withTiming(toCol * squareSizePx, { duration: 500 });
    offsetY.value = withTiming(toRow * squareSizePx, { duration: 500 }, () => {
      if (!ended.value) {
        ended.value = true;
        runOnJS(onAnimationEnd)();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  return (
    <Animated.View
      style={[styles.piece, { width: squareSizePx, height: squareSizePx }, animatedStyle]}
    >
      <ChessPieceSvg kind={kind} color={color} size={squareSizePx * 0.88} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
