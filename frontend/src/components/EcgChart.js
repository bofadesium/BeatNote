import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Ellipse, Text as SvgText } from 'react-native-svg';
import { STATUS } from '../theme';

export default function EcgChart({ title, data, peaks = [], regions = [], color, width, height = 120 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const x = (i) => (i / data.length) * width;
  const y = (v) => height - 10 - ((v - min) / (max - min)) * (height - 20);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={width} height={height} style={styles.svg}>
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
        {peaks.map((p) => <Circle key={p} cx={x(p)} cy={y(data[p])} r={3} fill="#8b95a3" />)}
        {regions.map((r, i) => {
          const seg = data.slice(r.start, r.end + 1);
          const top = y(Math.max(...seg)), bottom = y(Math.min(...seg));
          const cx = (x(r.start) + x(r.end)) / 2;
          const rx = (x(r.end) - x(r.start)) / 2 + 6, ry = Math.max((bottom - top) / 2 + 8, 14);
          const cy = (top + bottom) / 2;
          const c = STATUS[r.status].solid;
          return (
            <React.Fragment key={i}>
              <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={c} strokeWidth={2} strokeDasharray="5 3" />
              {r.label && <SvgText x={Math.max(cx - rx, 2)} y={Math.max(cy - ry - 3, 10)} fontSize="11" fontWeight="700" fill={c}>{r.label}</SvgText>}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  title: { fontSize: 12, fontWeight: '600', color: '#5b6573', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  svg: { backgroundColor: '#fbfcfd', borderRadius: 8, borderWidth: 1, borderColor: '#e3e8ee' },
});
