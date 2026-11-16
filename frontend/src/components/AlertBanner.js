import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { STATUS } from '../theme';

const COPY = {
  urgent: { status: 'red', title: 'CLINICIAN NOTIFICATION REQUIRED', sub: 'Critical finding(s). A clinician must review this patient now.' },
  review: { status: 'yellow', title: 'Clinician review recommended', sub: 'Borderline finding(s). Flag for clinician review.' },
  none: { status: 'green', title: 'All measurements in normal range', sub: 'No clinician notification needed.' },
};

export default function AlertBanner({ level, reasons, notify, onRetry }) {
  const c = COPY[level];
  const s = STATUS[c.status];
  let line = null;
  if (level === 'urgent') {
    if (notify.status === 'sending') line = 'Notifying clinician…';
    else if (notify.status === 'sent') line = `✓ Clinician notified ${notify.at}${notify.deduped ? ' (alert already open)' : ''} · alert #${notify.id} · awaiting acknowledgement`;
    else if (notify.status === 'failed') line = '⚠ Notification FAILED. Notify a clinician manually.';
    else if (notify.status === 'offline') line = '⚠ Backend not connected: no alert was sent. Notify a clinician manually.';
  }
  return (
    <View style={[styles.box, { backgroundColor: s.bg, borderColor: s.solid }]} accessibilityRole="alert">
      <Text style={[styles.title, { color: s.fg }]}>{s.icon} {c.title}</Text>
      <Text style={[styles.sub, { color: s.fg }]}>{c.sub}</Text>
      {reasons.map((r) => <Text key={r} style={[styles.reason, { color: s.fg }]}>• {r}</Text>)}
      {line && <Text style={[styles.status, { color: s.fg }]}>{line}</Text>}
      {level === 'urgent' && (notify.status === 'failed' || notify.status === 'sent') && (
        <Pressable onPress={onRetry} style={[styles.btn, { borderColor: s.solid }]}>
          <Text style={[styles.btnText, { color: s.fg }]}>{notify.status === 'failed' ? 'Retry notification' : 'Notify again'}</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  box: { borderWidth: 2, borderRadius: 12, padding: 14, marginTop: 16 },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  sub: { marginTop: 2, marginBottom: 6 },
  reason: { fontSize: 13, marginTop: 2 },
  status: { marginTop: 10, fontWeight: '700', fontSize: 13 },
  btn: { marginTop: 10, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  btnText: { fontWeight: '700' },
});
