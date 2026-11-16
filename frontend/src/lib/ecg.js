// Synthetic ECG generator used for demo cases until the MATLAB/Python backend is wired in.
export const FS = 250; // samples per second

const g = (t, mu, sigma, amp) => amp * Math.exp(-((t - mu) ** 2) / (2 * sigma ** 2));

// One beat, t in seconds relative to the R peak.
function beat(t, { st = 0, qt = 0.4 }) {
  return (
    g(t, -0.2, 0.025, 0.12) + // P
    g(t, -0.03, 0.01, -0.12) + // Q
    g(t, 0, 0.012, 1.0) + // R
    g(t, 0.03, 0.01, -0.2) + // S
    (t > 0.04 && t < qt - 0.15 ? st : 0) + // ST segment shift
    g(t, qt - 0.1, 0.045, 0.3 + st * 0.5) // T
  );
}

// Deterministic PRNG so demo cases look identical on every load.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function synthesize({ hr, hrvMs, st, qt, seconds = 8, seed = 1 }) {
  const rand = rng(seed);
  const n = seconds * FS;
  const rr = 60 / hr;
  const peaks = [];
  let t = 0.6;
  while (t < seconds - 0.4) {
    peaks.push(Math.round(t * FS));
    t += rr + ((rand() - 0.5) * 2 * hrvMs) / 1000;
  }
  const clean = new Array(n).fill(0);
  const raw = new Array(n);
  for (let i = 0; i < n; i++) {
    for (const p of peaks) {
      const dt = (i - p) / FS;
      if (dt > -0.3 && dt < 0.5) clean[i] += beat(dt, { st, qt });
    }
  }
  for (let i = 0; i < n; i++) {
    const time = i / FS;
    raw[i] =
      clean[i] +
      0.35 * Math.sin(2 * Math.PI * 0.25 * time) + // baseline wander
      0.08 * Math.sin(2 * Math.PI * 60 * time) + // mains hum
      (rand() - 0.5) * 0.06; // sensor noise
  }
  return { fs: FS, raw, filtered: clean, peaks };
}

export function extractFeatures({ peaks, fs }, { st, qt }) {
  const rrs = peaks.slice(1).map((p, i) => ((p - peaks[i]) / fs) * 1000);
  const mean = rrs.reduce((a, b) => a + b, 0) / rrs.length;
  const diffs = rrs.slice(1).map((r, i) => r - rrs[i]);
  const rmssd = Math.sqrt(diffs.reduce((a, d) => a + d * d, 0) / diffs.length);
  return {
    hr: Math.round(60000 / mean),
    rmssd: Math.round(rmssd),
    stDeviation: Number(st.toFixed(2)),
    qtMs: Math.round(qt * 1000),
    rhythm: rmssd > 90 ? 'Irregular' : mean < 600 ? 'Tachycardia' : mean > 1000 ? 'Bradycardia' : 'Sinus rhythm',
  };
}
