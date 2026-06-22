// Port of DrawOfferDialog (GameScreen.kt). Black offered a draw — Accept/Decline.

import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { STRINGS } from '@/constants/chessStrings';

import { PopupCard } from './PopupCard';

interface DrawOfferDialogProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function DrawOfferDialog({ onAccept, onDecline }: DrawOfferDialogProps) {
  return (
    <PopupCard>
      <Text style={styles.title}>{STRINGS.draw_offer_prompt}</Text>
      <View style={styles.row}>
        <TouchableWithoutFeedback onPress={onAccept} accessibilityLabel="draw_offer_accept">
          <View style={styles.button}>
            <Text style={styles.buttonText}>{STRINGS.accept_button}</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={onDecline} accessibilityLabel="draw_offer_decline">
          <View style={styles.button}>
            <Text style={styles.buttonText}>{STRINGS.decline_button}</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </PopupCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, marginBottom: 12, color: 'black', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: '#6650a4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  buttonText: { color: 'white' },
});
