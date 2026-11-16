import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { STATUS } from '../theme';

export default function StatusPill({ status }) {
  const s = STATUS[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg, borderColor: s.border }]} accessibilityLabel={s.word}>
      <Text style={[styles.text, { color: s.fg }]}>{s.icon} {s.word}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  pill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '800' },
});
