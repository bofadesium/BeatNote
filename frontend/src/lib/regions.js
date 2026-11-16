// Finds the parts of the ECG to circle. Returns [{start, end, status, label}] in sample indexes.
export function abnormalRegions(signal, features) {
  const { peaks, fs } = signal;
  const out = [];
  const st = Math.abs(features.stDeviation);
  if (st >= 0.05) {
    const status = st >= 0.1 ? 'red' : 'yellow';
    peaks.forEach((p, i) => {
      const start = p + Math.round(0.04 * fs), end = p + Math.round(0.3 * fs);
      if (end < signal.filtered.length) out.push({ start, end, status, label: i === 0 ? `ST ${features.stDeviation > 0 ? '↑' : '↓'}` : null });
    });
  }
  if (features.rhythm === 'Irregular') {
    const rr = peaks.slice(1).map((p, i) => p - peaks[i]);
    const med = [...rr].sort((a, b) => a - b)[Math.floor(rr.length / 2)];
    let labelled = false;
    rr.forEach((d, i) => {
      if (Math.abs(d - med) / med > 0.2) {
        out.push({ start: peaks[i], end: peaks[i + 1], status: 'red', label: labelled ? null : 'Irregular R-R' });
        labelled = true;
      }
    });
  }
  return out;
}
