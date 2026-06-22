// Port of PopupWindow (GameScreen.kt). Shown when winState != NONE. Renders the
// king icon (white/black) or the "no winner" graphic, the result message, and
// Play Again / Cancel buttons.

import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import type { ChessSnapshot } from '@/chess-core';
import { STRINGS } from '@/constants/chessStrings';

import { ChessPieceSvg, NoWinnerIcon } from './ChessPieceSvg';
import { PopupCard } from './PopupCard';

interface GameOverPopupProps {
  winState: ChessSnapshot['winState'];
  onPlayAgain: () => void;
  onCancel: () => void;
}

function resultText(winState: ChessSnapshot['winState']): { icon: 'KING' | 'NONE'; body: string } {
  switch (winState) {
    case 'WHITE':
      return { icon: 'KING', body: STRINGS.game_end_message_winner('WHITE') };
    case 'BLACK':
      return { icon: 'KING', body: STRINGS.game_end_message_winner('BLACK') };
    case 'DRAW':
    case 'STALEMATE':
      return { icon: 'NONE', body: STRINGS.game_end_message_no_winner(winState) };
    default:
      return { icon: 'NONE', body: '' };
  }
}

export function GameOverPopup({ winState, onPlayAgain, onCancel }: GameOverPopupProps) {
  const { icon, body } = resultText(winState);
  return (
    <PopupCard>
      {icon === 'KING' ? (
        <ChessPieceSvg kind="KING" color={winState === 'WHITE' ? 'WHITE' : 'BLACK'} size={50} />
      ) : (
        <NoWinnerIcon size={50} />
      )}
      <Text style={styles.message}>{body}</Text>
      <View style={styles.row}>
        <TouchableWithoutFeedback onPress={onPlayAgain} accessibilityLabel="play_again">
          <View style={styles.button}>
            <Text style={styles.buttonText}>{STRINGS.play_again_button}</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={onCancel} accessibilityLabel="cancel">
          <View style={styles.button}>
            <Text style={styles.buttonText}>{STRINGS.cancel_button}</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </PopupCard>
  );
}

const styles = StyleSheet.create({
  message: { color: 'red', fontSize: 18, marginVertical: 12, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  button: { backgroundColor: '#6650a4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  buttonText: { color: 'white' },
});
