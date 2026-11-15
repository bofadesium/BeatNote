import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

export default function EcgChart({ title, data, peaks = [], color, width, height = 110, seconds = 8, fs }) {
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i) => (i / data.length) * width;
  const y = (v) => height - 8 - ((v - min) / (max - min)) * (height - 16);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={width} height={height} style={styles.svg}>
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
        {peaks.map((p) => (
          <Circle key={p} cx={x(p)} cy={y(data[p])} r={3.5} fill="#d6342c" />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  title: { fontSize: 12, fontWeight: '600', color: '#5b6573', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  svg: { backgroundColor: '#fbfcfd', borderRadius: 8, borderWidth: 1, borderColor: '#e3e8ee' },
});
