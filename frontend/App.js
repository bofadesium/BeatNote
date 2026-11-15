import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import EcgChart from './src/components/EcgChart';
import { CASES } from './src/lib/cases';
import { fuseRisk, RISK_COLORS } from './src/lib/triage';
import { generateNote } from './src/lib/api';

export default function App() {
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 720) - 64;
  const [caseId, setCaseId] = useState(CASES[0].id);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const c = CASES.find((x) => x.id === caseId);
  const risk = useMemo(() => fuseRisk(c.features, c.patient), [c]);

  const select = (id) => { setCaseId(id); setNote(null); setError(null); setCopied(false); };
  const onGenerate = async () => {
    setLoading(true); setError(null); setCopied(false);
    try { setNote(await generateNote({ patient: c.patient, features: c.features, risk })); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const onCopy = async () => { await Clipboard.setStringAsync(note); setCopied(true); };

  const feats = [
    ['Heart rate', `${c.features.hr} bpm`],
    ['HRV (RMSSD)', `${c.features.rmssd} ms`],
    ['ST deviation', `${c.features.stDeviation} mV`],
    ['QT interval', `${c.features.qtMs} ms`],
    ['Rhythm', c.features.rhythm],
  ];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.col}>
        <Text style={styles.h1}>BeatNote</Text>
        <Text style={styles.sub}>ECG-to-triage with auto-drafted clinical notes</Text>

        <Text style={styles.label}>1 · Select a demo ECG</Text>
        <View style={styles.row}>
          {CASES.map((x) => (
            <Pressable key={x.id} onPress={() => select(x.id)} style={[styles.chip, x.id === caseId && styles.chipOn]}>
              <Text style={[styles.chipText, x.id === caseId && styles.chipTextOn]}>{x.title}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.meta}>
          {c.patient.age}y {c.patient.sex} · {c.patient.arrival}{c.patient.chestPain ? ' · chest pain' : ''}
        </Text>

        <Text style={styles.label}>2 · Signal</Text>
        <View style={styles.card}>
          <EcgChart title="Raw (noise, baseline wander, 60 Hz)" data={c.signal.raw} color="#8b95a3" width={chartW} />
          <EcgChart title="Filtered + R-peaks" data={c.signal.filtered} peaks={c.signal.peaks} color="#0b6bcb" width={chartW} />
        </View>

        <Text style={styles.label}>3 · Features and fused risk</Text>
        <View style={styles.card}>
          <View style={styles.riskRow}>
            <View style={[styles.badge, { backgroundColor: RISK_COLORS[risk.level] }]}>
              <Text style={styles.badgeText}>{risk.level.toUpperCase()}</Text>
            </View>
            <Text style={styles.score}>{risk.score}<Text style={styles.scoreOf}>/100</Text></Text>
          </View>
          {feats.map(([k, v]) => (
            <View key={k} style={styles.featRow}>
              <Text style={styles.featK}>{k}</Text>
              <Text style={styles.featV}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>4 · Triage note</Text>
        <Pressable onPress={onGenerate} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Note</Text>}
        </Pressable>
        {error && <Text style={styles.error}>{error}</Text>}
        {note && (
          <View style={styles.card}>
            <Text selectable style={styles.note}>{note}</Text>
            <Pressable onPress={onCopy} style={styles.btnGhost}>
              <Text style={styles.btnGhostText}>{copied ? 'Copied ✓' : 'Copy to EHR (simulated)'}</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.foot}>Demo only. Synthetic data. Not a medical device.</Text>
      </View>
      <StatusBar style="dark" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f5f8' },
  content: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  col: { width: '100%', maxWidth: 720 },
  h1: { fontSize: 32, fontWeight: '800', color: '#101828' },
  sub: { color: '#5b6573', marginBottom: 8, fontSize: 15 },
  label: { marginTop: 22, marginBottom: 8, fontWeight: '700', color: '#101828', fontSize: 15 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d5dbe3' },
  chipOn: { backgroundColor: '#0b6bcb', borderColor: '#0b6bcb' },
  chipText: { color: '#344054', fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  meta: { marginTop: 8, color: '#5b6573' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e3e8ee' },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  badgeText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  score: { fontSize: 34, fontWeight: '800', color: '#101828' },
  scoreOf: { fontSize: 16, color: '#5b6573', fontWeight: '500' },
  featRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#eef1f5' },
  featK: { color: '#5b6573' },
  featV: { color: '#101828', fontWeight: '600' },
  btn: { backgroundColor: '#0b6bcb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnGhost: { marginTop: 12, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#0b6bcb' },
  btnGhostText: { color: '#0b6bcb', fontWeight: '600' },
  note: { color: '#101828', lineHeight: 22, fontFamily: Platform.select({ web: 'ui-monospace, monospace', ios: 'Menlo', default: 'monospace' }), fontSize: 13 },
  error: { color: '#d6342c', marginBottom: 8 },
  foot: { marginTop: 24, textAlign: 'center', color: '#8b95a3', fontSize: 12 },
});
