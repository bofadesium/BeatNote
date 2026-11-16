import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { STATUS } from '../theme';

// Colour key for the measurement numbers: red = bad, yellow = caution, green = good.
const KEY = [
  { status: 'red', meaning: 'Bad' },
  { status: 'yellow', meaning: 'Caution' },
  { status: 'green', meaning: 'Good' },
];

export default function StatusLegend() {
  return (
    <View style={styles.wrap} accessibilityLabel="Number colours: red means bad, yellow means caution, green means good">
      <View style={styles.row}>
        {KEY.map(({ status, meaning }) => {
          const s = STATUS[status];
          return (
            <View key={status} style={[styles.chip, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.text, { color: s.fg }]}>{s.icon} {meaning}</Text>
            </View>
          );
        })}
        <Text style={styles.note}>caution = outside normal, bad = past the caution limit</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '800' },
  note: { color: '#8b95a3', fontSize: 11, flexShrink: 1 },
});
