import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import EcgChart from './src/components/EcgChart';
import AlertBanner from './src/components/AlertBanner';
import MetricsTable from './src/components/MetricsTable';
import StatusLegend from './src/components/StatusLegend';
import ImpactCard from './src/components/ImpactCard';
import { CASES } from './src/lib/cases';
import { fuseRisk } from './src/lib/triage';
import { abnormalRegions } from './src/lib/regions';
import { assess, sendAlert, generateNote, hasBackend } from './src/lib/api';
import { STATUS } from './src/theme';

const LEVEL = { green: 'Low', yellow: 'Moderate', red: 'High' };

export default function App() {
  const { width } = useWindowDimensions();
  const chartW = Math.min(width, 720) - 64;
  const [caseId, setCaseId] = useState(CASES[0].id);
  const [a, setA] = useState(null); // assessment
  const [notify, setNotify] = useState({ status: 'idle' });
  const [note, setNote] = useState(null);
  const [noteSource, setNoteSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const c = CASES.find((x) => x.id === caseId);
  const regions = useMemo(() => abnormalRegions(c.signal, c.features), [c]);

  const doNotify = useCallback(async (assessment) => {
    if (!hasBackend) { setNotify({ status: 'offline' }); return; }
    setNotify({ status: 'sending' });
    try {
      const r = await sendAlert(c.id, assessment.notify_level, assessment.notify_reasons);
      setNotify({ status: 'sent', id: r.id, deduped: r.deduped, at: new Date(r.created_at).toLocaleTimeString() });
    } catch { setNotify({ status: 'failed' }); }
  }, [c.id]);

  // Re-assess whenever the case changes; critical findings notify automatically.
  useEffect(() => {
    let cancelled = false;
    setA(null); setNote(null); setError(null); setCopied(false); setNotify({ status: 'idle' });
    (async () => {
      const res = await assess(c);
      if (cancelled) return;
      setA(res);
      if (res.notify_level === 'urgent') doNotify(res);
    })();
    return () => { cancelled = true; };
  }, [c, doNotify]);

  const onGenerate = async () => {
    setLoading(true); setError(null); setCopied(false);
    try {
      const score = a.admission ? Math.round(a.admission.probability * 100) : fuseRisk(c.features, c.patient).score;
      const r = await generateNote({ patient: c.patient, features: c.features, risk: { score, level: LEVEL[a.overall] }, flags: a.notify_reasons });
      setNote(r.note); setNoteSource(r.source);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const overall = a ? STATUS[a.overall] : null;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.col}>
        <Text style={styles.h1}>BeatNote</Text>
        <Text style={styles.sub}>ECG-to-triage with auto-drafted clinical notes</Text>

        <Text style={styles.label}>1 · Select a demo ECG</Text>
        <View style={styles.row}>
          {CASES.map((x) => (
            <Pressable key={x.id} onPress={() => setCaseId(x.id)} style={[styles.chip, x.id === caseId && styles.chipOn]}>
              <Text style={[styles.chipText, x.id === caseId && styles.chipTextOn]}>{x.title}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.meta}>{c.patient.age}y {c.patient.sex} · {c.patient.arrival} · ESI {c.triage.esi}{c.patient.chestPain ? ' · chest pain' : ''}</Text>

        {!a ? <ActivityIndicator style={{ marginTop: 24 }} /> : (
          <>
            <AlertBanner level={a.notify_level} reasons={a.notify_reasons} notify={notify} onRetry={() => doNotify(a)} />
            {a.source === 'local' && hasBackend && <Text style={styles.warn}>Backend unreachable: showing local thresholds, no Yale model, no alert sent.</Text>}

            <Text style={styles.label}>2 · Signal {regions.length > 0 && <Text style={{ color: STATUS[a.overall === 'green' ? 'yellow' : a.overall].fg }}>(abnormal areas circled)</Text>}</Text>
            <View style={styles.card}>
              <EcgChart title="Raw (noise, baseline wander, 60 Hz)" data={c.signal.raw} color="#8b95a3" width={chartW} />
              <EcgChart title="Filtered + R-peaks" data={c.signal.filtered} peaks={c.signal.peaks} regions={regions} color="#0b6bcb" width={chartW} />
              {regions.length > 0 && <Text style={styles.legend}>Dashed circles mark where the signal crosses a caution (yellow) or critical (red) threshold.</Text>}
            </View>

            <Text style={styles.label}>3 · Measurements</Text>
            <View style={styles.card}>
              <View style={[styles.overall, { backgroundColor: overall.bg, borderColor: overall.border }]}>
                <Text style={[styles.overallText, { color: overall.fg }]}>{overall.icon} Overall: {overall.word}</Text>
              </View>
              <StatusLegend metrics={a.metrics} showAdmission={!!a.admission} />
              <MetricsTable metrics={a.metrics} admission={a.admission} />
              {!a.admission && <Text style={styles.legend}>Admission-risk model not available (backend offline or model file missing).</Text>}
              <Text style={styles.legend}>Thresholds {a.thresholds_version}: demo values, not clinically validated.</Text>
            </View>

            <Text style={styles.label}>4 · Triage note</Text>
            <Pressable onPress={onGenerate} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Note</Text>}
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}
            {note && (
              <View style={styles.card}>
                <Text style={styles.src}>Source: {{ nemotron: 'NVIDIA Nemotron', template: 'backend template', mock: 'local mock' }[noteSource]}</Text>
                <Text selectable style={styles.note}>{note}</Text>
                <Pressable onPress={async () => { await Clipboard.setStringAsync(note); setCopied(true); }} style={styles.btnGhost}>
                  <Text style={styles.btnGhostText}>{copied ? 'Copied ✓' : 'Copy to EHR (simulated)'}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
        <ImpactCard />
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
  warn: { marginTop: 8, color: '#7a5500', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e3e8ee' },
  legend: { color: '#8b95a3', fontSize: 11, marginTop: 8 },
  overall: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8 },
  overallText: { fontWeight: '900', fontSize: 15 },
  btn: { backgroundColor: '#0b6bcb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnGhost: { marginTop: 12, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#0b6bcb' },
  btnGhostText: { color: '#0b6bcb', fontWeight: '600' },
  note: { color: '#101828', lineHeight: 22, fontFamily: Platform.select({ web: 'ui-monospace, monospace', ios: 'Menlo', default: 'monospace' }), fontSize: 13 },
  src: { fontSize: 11, color: '#8b95a3', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  error: { color: '#d6342c', marginBottom: 8 },
  foot: { marginTop: 24, textAlign: 'center', color: '#8b95a3', fontSize: 12 },
});
