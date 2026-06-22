// Port of GameControls (GameScreen.kt). Reset + Offer Draw buttons, plus the
// "draw declined" / "3D unavailable" status lines.

import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import type { ChessSnapshot } from '@/chess-core';
import { STRINGS } from '@/constants/chessStrings';

interface GameControlsProps {
  snapshot: ChessSnapshot;
  onReset: () => void;
  onOfferDraw: () => void;
  transparentButtons?: boolean;
}

function canOfferDraw(snapshot: ChessSnapshot): boolean {
  // Mirrors DrawAgreement.canOfferDraw: not during animation, not over, no pending
  // promotion, no outstanding draw offer, and the game is far enough along that a
  // draw offer makes sense (fullmove >= 1 here — the precise gating lives in core).
  return (
    !snapshot.animating &&
    snapshot.winState === 'NONE' &&
    !snapshot.pendingPromotion &&
    snapshot.drawOfferBy === null &&
    snapshot.turn === 'WHITE'
  );
}

export function GameControls({
  snapshot,
  onReset,
  onOfferDraw,
  transparentButtons = false,
}: GameControlsProps) {
  const drawEnabled = canOfferDraw(snapshot);
  const buttonStyle = transparentButtons ? styles.transparentButton : styles.button;
  return (
    <View style={styles.container}>
      {snapshot.board3DUnavailable && (
        <Text style={styles.unavailable}>{STRINGS.board_3d_unavailable}</Text>
      )}
      <View style={styles.row}>
        <TouchableWithoutFeedback onPress={onReset} accessibilityLabel="reset_button">
          <View style={buttonStyle}>
            <Text style={transparentButtons ? styles.transparentText : styles.buttonText}>
              {STRINGS.reset_button}
            </Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          disabled={!drawEnabled}
          onPress={onOfferDraw}
          accessibilityLabel="offer_draw_button"
        >
          <View style={[buttonStyle, !drawEnabled && styles.disabled]}>
            <Text
              style={[
                transparentButtons ? styles.transparentText : styles.buttonText,
                !drawEnabled && styles.disabledText,
              ]}
            >
              {STRINGS.offer_draw_button}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
      {snapshot.drawOfferDeclinedBy === 'BLACK' && (
        <Text style={styles.declined}>{STRINGS.draw_offer_declined}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: '#6650a4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buttonText: { color: 'white' },
  transparentButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
  },
  transparentText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.4 },
  disabledText: { color: 'rgba(0,0,0,0.38)' },
  declined: { color: '#444', fontStyle: 'italic' },
  unavailable: { color: 'red' },
});
