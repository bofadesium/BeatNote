// DEMO traffic-light bands, kept in sync with backend/assess.py (demo-0.1).
// green = inside `good`; yellow = inside the wider `caution` band (the tolerated margin);
// anything outside `caution` is red. Not clinically validated.
export const BANDS = {
  hr: { label: 'Heart rate', unit: 'bpm', good: [60, 100], caution: [50, 120] },
  rhythm: { label: 'Rhythm', unit: '', good: ['Sinus rhythm'], caution: ['Tachycardia', 'Bradycardia'] },
  st: { label: 'ST deviation', unit: 'mV', good: [0, 0.04], caution: [0, 0.09] },
  qtc: { label: 'QTc (Bazett)', unit: 'ms', good: [0, 450], caution: [0, 500] },
  sbp: { label: 'Systolic BP', unit: 'mmHg', good: [100, 139], caution: [90, 179] },
  rr: { label: 'Respiratory rate', unit: '/min', good: [12, 20], caution: [9, 24] },
  spo2: { label: 'SpO2', unit: '%', good: [95, 100], caution: [90, 100] },
  temp: { label: 'Temperature', unit: 'F', good: [97, 99.5], caution: [96, 100.3] },
  admission: { label: 'Admission risk', unit: '%', goodText: '< 30%', cautionText: '30–59%' },
};

function rangeText(range, unit) {
  if (typeof range[0] === 'string') return range.join(' / ');
  const body = range[0] === 0 ? `≤ ${range[1]}` : `${range[0]}–${range[1]}`;
  return unit === '%' ? `${body}%` : unit ? `${body} ${unit}` : body;
}

// "good 60–100 bpm" / "caution 50–120 bpm" text for one band.
export const bandText = (b, which) => b[`${which}Text`] ?? rangeText(b[which], b.unit);

export const band = (value, b) =>
  value >= b.good[0] && value <= b.good[1] ? 'green'
    : value >= b.caution[0] && value <= b.caution[1] ? 'yellow'
      : 'red';
