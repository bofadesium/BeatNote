import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Ellipse } from 'react-native-svg';
import { STATUS } from '../theme';

export default function EcgChart({ title, data, peaks = [], regions = [], color, width, height = 120 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i) => (i / data.length) * width;
  const y = (v) => height - 10 - ((v - min) / (max - min)) * (height - 20);
  const shapes = regions.map((r) => {
    const seg = data.slice(r.start, r.end + 1);
    const top = y(Math.max(...seg)), bottom = y(Math.min(...seg));
    return {
      cx: (x(r.start) + x(r.end)) / 2, cy: (top + bottom) / 2,
      rx: (x(r.end) - x(r.start)) / 2 + 6, ry: Math.max((bottom - top) / 2 + 8, 14),
      color: STATUS[r.status].solid, label: r.label,
    };
  });
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={width} height={height} style={styles.svg}>
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
        {peaks.map((p) => <Circle key={p} cx={x(p)} cy={y(data[p])} r={3} fill="#8b95a3" />)}
        {shapes.map((g, i) => (
          <Ellipse key={i} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} fill="none" stroke={g.color} strokeWidth={2} strokeDasharray="5 3" />
        ))}
      </Svg>
      {shapes.filter((g) => g.label).map((g, i) => (
        <Text key={i} style={[styles.tag, { left: Math.max(g.cx - g.rx, 4), top: Math.max(g.cy - g.ry - 16, 22), color: g.color }]}>{g.label}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, position: 'relative' },
  tag: { position: 'absolute', fontSize: 11, fontWeight: '800' },
  title: { fontSize: 12, fontWeight: '600', color: '#5b6573', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  svg: { backgroundColor: '#fbfcfd', borderRadius: 8, borderWidth: 1, borderColor: '#e3e8ee' },
});
