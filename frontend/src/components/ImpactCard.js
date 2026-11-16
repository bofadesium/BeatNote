import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

const ITEMS = [
  ['Better patient care', 'Critical findings (ST changes, irregular rhythm, unstable vitals) are flagged the moment the ECG is read, with the abnormal beats circled, so a clinician sees them first instead of waiting in a queue.'],
  ['Stronger discovery', 'Every assessment and alert is stored with its thresholds version, so the team can review which flags were right or wrong and tune the cut-offs to cut false alarms.'],
  ['Time back for clinicians', 'A SOAP-style note is drafted from the measurements for the clinician to review and edit, instead of writing it from scratch.'],
];

export default function ImpactCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.h}>How BeatNote helps</Text>
      {ITEMS.map(([t, d]) => (
        <View key={t} style={{ marginTop: 8 }}>
          <Text style={styles.t}>{t}</Text>
          <Text style={styles.d}>{d}</Text>
        </View>
      ))}
      <Text style={styles.fine}>Demo with synthetic data. Thresholds are placeholders and not clinically validated; impact is not yet measured.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e3e8ee', marginTop: 22 },
  h: { fontWeight: '800', color: '#101828', fontSize: 15 },
  t: { fontWeight: '700', color: '#0b6bcb' },
  d: { color: '#344054', lineHeight: 20, fontSize: 13 },
  fine: { marginTop: 12, color: '#8b95a3', fontSize: 11 },
});
