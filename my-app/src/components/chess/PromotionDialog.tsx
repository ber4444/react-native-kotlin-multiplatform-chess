// Port of PromotionDialog (GameScreen.kt). Blocks play until the user picks a
// promotion piece. The four PromotionType entries render in their declared
// order (QUEEN, ROOK, BISHOP, KNIGHT) — the ordinal is what the Kotlin core
// expects via ChessSession.promote(typeOrdinal).

import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { STRINGS } from '@/constants/chessStrings';

import { ChessPieceSvg } from './ChessPieceSvg';
import { PopupCard } from './PopupCard';

const PROMOTIONS = [
  { ordinal: 0, kind: 'QUEEN' },
  { ordinal: 1, kind: 'ROOK' },
  { ordinal: 2, kind: 'BISHOP' },
  { ordinal: 3, kind: 'KNIGHT' },
] as const;

interface PromotionDialogProps {
  // White's promotion is the only one surfaced to the UI.
  color: string;
  onSelect: (typeOrdinal: number) => void;
  onDismiss: () => void;
}

export function PromotionDialog({ color, onSelect, onDismiss }: PromotionDialogProps) {
  return (
    <PopupCard>
      <Text style={styles.title}>{STRINGS.promotion_prompt}</Text>
      <View style={styles.row}>
        {PROMOTIONS.map(p => (
          <TouchableWithoutFeedback
            key={p.ordinal}
            onPress={() => onSelect(p.ordinal)}
            accessibilityLabel={`promotion_choice_${p.kind}`}
          >
            <View style={styles.choice}>
              <ChessPieceSvg kind={p.kind} color={color} size={44} />
            </View>
          </TouchableWithoutFeedback>
        ))}
      </View>
      <TouchableWithoutFeedback onPress={onDismiss} accessibilityLabel="promotion_dismiss">
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableWithoutFeedback>
    </PopupCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, marginBottom: 12, color: 'black', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  choice: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  cancel: { marginTop: 16, color: '#6650a4' },
});
