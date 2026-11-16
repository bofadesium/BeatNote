import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { hasBackend, scoreBatch } from '../lib/api';

const STATUS = {
  red: { word: 'High', color: '#d6342c' },
  yellow: { word: 'Elevated', color: '#e0a000' },
  green: { word: 'Low', color: '#2e9e5b' },
};

export default function ImportPanel() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const pick = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await scoreBatch(file));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (Platform.OS !== 'web') {
    return <Text style={styles.hint}>Open the web app to upload a cohort file.</Text>;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.hint}>
        CSV or parquet export of ED visits. Columns are matched by name (esi, age, gender, arrival, vitals);
        a missing vital is scored empty. The file is read in memory and not stored.
      </Text>
      {!hasBackend && (
        <Text style={styles.error}>Uploads need the API running (EXPO_PUBLIC_API_URL). This build has no backend connected.</Text>
      )}
      {React.createElement('input', {
        type: 'file',
        accept: '.csv,.parquet',
        'data-testid': 'cohort-file',
        onChange: (e) => pick(e.target.files && e.target.files[0]),
        style: { marginTop: 10, fontSize: 13 },
      })}
      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator />
          <Text style={styles.hint}> Scoring {fileName}…</Text>
        </View>
      )}
      {error && hasBackend && <Text style={styles.error}>{error}</Text>}
      {result && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.summary}>
            {result.rows} rows scored · {result.summary.high} high · {result.summary.elevated} elevated ·{' '}
            {result.summary.low} low
          </Text>
          {result.warnings.map((w) => (
            <Text key={w} style={styles.hint}>{w}</Text>
          ))}
          {result.results.map((r) => (
            <View key={r.row} style={styles.resultRow}>
              <Text style={styles.rowLabel}>Row {r.row}</Text>
              <Text style={[styles.prob, { color: STATUS[r.status].color }]}>
                {Math.round(r.probability * 100)}% · {STATUS[r.status].word}
              </Text>
            </View>
          ))}
          <Text style={styles.fine}>
            Highest-risk {result.results.length} rows shown. Model {result.model}, thresholds{' '}
            {result.thresholds_version}: demo values, not clinically validated.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e3e8ee' },
  hint: { color: '#5b6472', fontSize: 12, lineHeight: 18 },
  error: { color: '#c1352a', fontSize: 12, marginTop: 8 },
  busy: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  summary: { fontWeight: '700', color: '#101828', fontSize: 13 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eef1f5' },
  rowLabel: { color: '#344054', fontSize: 13 },
  prob: { fontWeight: '700', fontSize: 13 },
  fine: { marginTop: 10, color: '#8b95a3', fontSize: 11 },
});
