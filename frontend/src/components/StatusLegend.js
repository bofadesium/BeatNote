import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { STATUS } from '../theme';
import { BANDS } from '../lib/thresholds';

// Colour key for the measurement numbers: red = bad, yellow = caution, green = good,
// plus the bands each colour comes from.
const KEY = [
  { status: 'red', meaning: 'Bad' },
  { status: 'yellow', meaning: 'Caution' },
  { status: 'green', meaning: 'Good' },
];

function rangeText(range, unit) {
  if (typeof range[0] === 'string') return range.join(' / ');
  const body = range[0] === 0 ? `≤ ${range[1]}` : `${range[0]}–${range[1]}`;
  return unit ? `${body} ${unit}` : body;
}
const bandText = (b, which) => b[`${which}Text`] ?? rangeText(b[which], b.unit);

export default function StatusLegend({ metrics, showAdmission }) {
  const keys = (metrics ? metrics.map((m) => m.key) : Object.keys(BANDS)).concat(showAdmission ? ['admission'] : []);
  return (
    <View style={styles.wrap} accessibilityLabel="Number colours: red means bad, yellow means caution, green means good">
      <Text style={styles.title}>Number colours</Text>
      <View style={styles.row}>
        {KEY.map(({ status, meaning }) => {
          const s = STATUS[status];
          return (
            <View key={status} style={[styles.chip, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.text, { color: s.fg }]}>{s.icon} {meaning}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.title, styles.bandsTitle]}>Bands used</Text>
      <View>
        {keys.map((key) => {
          const b = BANDS[key];
          if (!b) return null;
          return (
            <View key={key} style={styles.bandRow}>
              <Text style={styles.bandLabel}>{b.label}</Text>
              <Text style={styles.bandValue}>
                <Text style={{ color: STATUS.green.fg }}>good {bandText(b, 'good')}</Text>
                <Text style={styles.sep}> · </Text>
                <Text style={{ color: STATUS.yellow.fg }}>caution {bandText(b, 'caution')}</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  title: { color: '#8b95a3', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '800' },
  bandsTitle: { marginTop: 10 },
  bandRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 10, paddingVertical: 1 },
  bandLabel: { color: '#5b6573', fontSize: 11, fontWeight: '600' },
  bandValue: { fontSize: 11 },
  sep: { color: '#8b95a3' },
});
