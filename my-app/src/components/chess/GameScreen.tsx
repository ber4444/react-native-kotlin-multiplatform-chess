// Port of ChessApp + GameScreen (GameScreen.kt / ChessApp.kt). Single screen:
// 2D board (default) or 3D board (toggle), with dialogs and controls overlaid.
// Board sizing matches the web/iOS rule: min(width, 0.85 × height) so it fits
// landscape windows (plan §7.1/§7.2).

import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { STRINGS } from '@/constants/chessStrings';
import { useChessTheme } from '@/constants/chessTheme';
import { getChessSession, useChessSnapshot } from '@/hooks/useChessSession';

import { ChessBoard } from './ChessBoard';
import { DrawOfferDialog } from './DrawOfferDialog';
import { GameControls } from './GameControls';
import { GameOverPopup } from './GameOverPopup';
import { PromotionDialog } from './PromotionDialog';

// P3: the three.js board. Lazily loaded so the 2D-only path stays light.
import { Board3D } from './Board3D';

type WidthClass = 'Compact' | 'Medium' | 'Expanded';

function widthClass(width: number): WidthClass {
  // ChessApp.kt breakpoints: <600 Compact, <840 Medium, else Expanded.
  if (width < 600) return 'Compact';
  if (width < 840) return 'Expanded';
  return 'Expanded';
}

function boardPadding(wc: WidthClass): number {
  switch (wc) { case 'Compact': return 0; case 'Medium': return 12; case 'Expanded': return 18; }
}

export function GameScreen() {
  const session = getChessSession();
  const snapshot = useChessSnapshot(session);
  const theme = useChessTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [hideWindow, setHideWindow] = useState(false);

  const wc = widthClass(width);
  const pad = boardPadding(wc);
  const boardSize = useMemo(
    () => Math.min(width - pad * 2, height * 0.85) - pad * 2,
    [width, height, pad],
  );

  // P0.5 spike: default to the 3D board so we can verify chess.glb renders via
  // Filament (Metal) on launch. The Kotlin core's ViewState default is show3D=true;
  // we honour it here rather than forcing 2D. Revisit the 2D-first default post-spike.
  // useEffect(() => { session.setShow3D(false); }, []);

  const show3D = snapshot.show3D;

  const onSelectSquare = (row: number, col: number) => session.selectSquare(row, col);
  const onMoveTo = (row: number, col: number) => {
    session.playerMove(snapshot.selectedRow, snapshot.selectedCol, row, col);
    session.clearSelection();
  };
  const onAnimationEnd = () => session.animationEnd();

  return (
    <View style={[styles.root, { backgroundColor: theme.isDark ? '#1a1a1a' : '#fff' }]}>
      {show3D && (
        // Full-screen FilamentView, rendered BEHIND the SafeAreaView so the skybox
        // fills the entire screen including under the top system bar.
        <View style={StyleSheet.absoluteFill}>
          <Board3D
            session={session}
            snapshot={snapshot}
            onSquareTapped={(row, col) => {
              if (snapshot.animating || snapshot.turn !== 'WHITE') return;
              if (snapshot.hasSelection) {
                session.playerMove(snapshot.selectedRow, snapshot.selectedCol, row, col);
                session.clearSelection();
              } else {
                session.selectSquare(row, col);
              }
            }}
          />
        </View>
      )}
      <SafeAreaView
        style={[styles.safe, show3D && { backgroundColor: 'transparent' }]}
        edges={['top', 'bottom']}
        pointerEvents={show3D ? 'box-none' : 'auto'}
      >
        {show3D ? (
          <>
            {/* 2D/3D toggle — anchored below the status bar (not overlapping it) */}
            <View style={[styles.toggleWrap, { top: insets.top + 8 }]}>
              <Text style={styles.toggleLabelLight}>
                {STRINGS.board_3d_toggle_label}
              </Text>
              <Switch
                value={snapshot.show3D}
                onValueChange={(v) => session.setShow3D(v)}
                disabled={snapshot.animating}
                accessibilityLabel="board_3d_toggle"
              />
            </View>
            {/* Controls — anchored above the bottom safe area */}
            <View style={[styles.controls3D, { bottom: insets.bottom + 16 }]}>
              <GameControls
                snapshot={snapshot}
                onReset={() => session.resetGame()}
                onOfferDraw={() => session.offerDraw()}
                transparentButtons
              />
            </View>
          </>
        ) : (
          <View style={styles.boardColumn}>
            <ChessBoard
              snapshot={snapshot}
              theme={theme}
              boardSize={boardSize}
              onSelectSquare={onSelectSquare}
              onMoveTo={onMoveTo}
              onAnimationEnd={onAnimationEnd}
            />
            <GameControls
              snapshot={snapshot}
              onReset={() => session.resetGame()}
              onOfferDraw={() => session.offerDraw()}
            />
            {/* 2D/3D toggle (top-end) */}
            <View style={styles.toggleWrap2D}>
              <Text style={[styles.toggleLabel, { color: theme.isDark ? '#ccc' : '#333' }]}>
                {STRINGS.board_3d_toggle_label}
              </Text>
              <Switch
                value={snapshot.show3D}
                onValueChange={(v) => session.setShow3D(v)}
                disabled={snapshot.animating}
                accessibilityLabel="board_3d_toggle"
              />
            </View>
          </View>
        )}
      </SafeAreaView>
      {snapshot.winState !== 'NONE' && !hideWindow && (
        <GameOverPopup
          winState={snapshot.winState}
          onPlayAgain={() => session.resetGame()}
          onCancel={() => {
            session.hideWindow();
            setHideWindow(true);
          }}
        />
      )}
      {snapshot.pendingPromotion && (
        <PromotionDialog
          color="WHITE"
          onSelect={(ord) => session.promote(ord)}
          onDismiss={() => session.cancelPromotion()}
        />
      )}
      {snapshot.drawOfferBy === 'BLACK' && snapshot.winState === 'NONE' && (
        <DrawOfferDialog
          onAccept={() => session.acceptDrawOffer()}
          onDecline={() => session.declineDrawOffer()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  boardColumn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  controls3D: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toggleWrap: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  toggleWrap2D: {
    position: 'absolute',
    top: 8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  toggleLabel: { fontSize: 14 },
  toggleLabelLight: { fontSize: 14, color: '#fff', fontWeight: '600' },
});

export default GameScreen;
