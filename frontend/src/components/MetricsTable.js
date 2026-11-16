import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import StatusPill from './StatusPill';
import { STATUS } from '../theme';
import { BANDS, bandText } from '../lib/thresholds';

// Caution limit for a row: the wider band that still counts as yellow.
const cautionLimit = (key) => {
  const b = BANDS[key === 'adm' ? 'admission' : key];
  return b ? bandText(b, 'caution') : null;
};

export default function MetricsTable({ metrics, admission }) {
  const rows = [];
  if (admission) {
    rows.push({ key: 'adm', label: 'Admission risk (Yale model)', value: `${Math.round(admission.probability * 100)}%`, unit: '',
      status: admission.status, normal: '< 30%', reason: admission.status === 'red' ? 'High likelihood of hospital admission' : 'Elevated likelihood of admission' });
  }
  rows.push(...metrics.map((m) => ({ ...m, value: `${m.value}${m.unit ? ' ' + m.unit : ''}` })));
  return (
    <View>
      {rows.map((r) => (
        <View key={r.key} style={[styles.row, r.status !== 'green' && { backgroundColor: STATUS[r.status].bg }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.normal}>normal: {r.normal}{cautionLimit(r.key) ? ` · caution ${cautionLimit(r.key)}` : ''}</Text>
            {r.reason && <Text style={[styles.reason, { color: STATUS[r.status].fg }]}>{r.reason}</Text>}
          </View>
          <View style={styles.right}>
            <Text style={styles.value}>{r.value}</Text>
            <StatusPill status={r.status} />
          </View>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#eef1f5', borderRadius: 6 },
  label: { color: '#101828', fontWeight: '600' },
  normal: { color: '#8b95a3', fontSize: 11, marginTop: 1 },
  reason: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 4 },
  value: { color: '#101828', fontWeight: '800', fontSize: 15 },
});
