// Local fallback for the traffic-light rules, used only when the backend is unreachable.
// The backend (backend/assess.py) is the source of truth; keep the two in sync.
// DEMO thresholds from common reference ranges. Not clinically validated.
const band = (v, g, y) => (v >= g[0] && v <= g[1] ? 'green' : v >= y[0] && v <= y[1] ? 'yellow' : 'red');
export const qtc = (qtMs, hr) => Math.round(qtMs / Math.sqrt(60 / hr));

export function localAssess({ features: f, vitals: v }) {
  const m = [];
  const add = (key, label, value, unit, status, normal, reason) =>
    m.push({ key, label, value, unit, status, normal, reason: status === 'green' ? null : reason });
  add('hr', 'Heart rate', f.hr, 'bpm', band(f.hr, [60, 100], [50, 120]), '60-100', 'Outside 60-100 bpm');
  const rs = { 'Sinus rhythm': 'green', Tachycardia: 'yellow', Bradycardia: 'yellow' }[f.rhythm] || 'red';
  add('rhythm', 'Rhythm', f.rhythm, '', rs, 'Sinus rhythm', `Rhythm: ${f.rhythm}`);
  const st = Math.abs(f.stDeviation);
  add('st', 'ST deviation', f.stDeviation, 'mV', band(st, [0, 0.04], [0, 0.09]), '< 0.05',
    st >= 0.1 ? 'At or above 0.10 mV (possible ischemia)' : 'Borderline ST deviation');
  const q = qtc(f.qtMs, f.hr);
  add('qtc', 'QTc (Bazett)', q, 'ms', band(q, [0, 450], [0, 500]), '<= 450', q > 500 ? 'Above 500 ms (arrhythmia risk)' : 'Prolonged QTc');
  if (v.sbp != null) add('sbp', 'Systolic BP', v.sbp, 'mmHg', band(v.sbp, [100, 139], [90, 179]), '100-139', 'Abnormal blood pressure');
  if (v.rr != null) add('rr', 'Respiratory rate', v.rr, '/min', band(v.rr, [12, 20], [9, 24]), '12-20', 'Abnormal respiratory rate');
  if (v.o2 != null) add('spo2', 'SpO2', v.o2, '%', band(v.o2, [95, 100], [90, 100]), '>= 95', v.o2 < 90 ? 'Below 90% (hypoxia)' : 'Borderline oxygen saturation');
  if (v.temp != null) add('temp', 'Temperature', v.temp, 'F', band(v.temp, [97, 99.5], [96, 100.3]), '97.0-99.5', 'Fever or hypothermia');
  const reds = m.filter((x) => x.status === 'red').map((x) => `${x.label}: ${x.reason}`);
  const yellows = m.filter((x) => x.status === 'yellow').map((x) => `${x.label}: ${x.reason}`);
  const overall = reds.length ? 'red' : yellows.length ? 'yellow' : 'green';
  return {
    overall, metrics: m, admission: null, thresholds_version: 'demo-0.1 (local)',
    notify_level: reds.length ? 'urgent' : yellows.length ? 'review' : 'none',
    notify_reasons: reds.length ? reds : yellows,
  };
}
