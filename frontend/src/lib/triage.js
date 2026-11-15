// Fuses ECG features with Yale-EM-style clinical factors into a 0-100 risk score.
export function fuseRisk(f, ctx) {
  let s = 0;
  s += Math.min(Math.abs(f.stDeviation) * 90, 40); // ST deviation
  s += f.hr > 110 || f.hr < 50 ? 15 : 0;
  s += f.rmssd > 90 ? 15 : 0;
  s += f.qtMs > 460 ? 10 : 0;
  s += ctx.age >= 65 ? 12 : ctx.age >= 50 ? 6 : 0;
  s += ctx.arrival === 'Ambulance' ? 8 : 0;
  s += ctx.chestPain ? 10 : 0;
  const score = Math.min(100, Math.round(s));
  const level = score >= 60 ? 'High' : score >= 30 ? 'Moderate' : 'Low';
  return { score, level };
}

export const RISK_COLORS = { Low: '#2e9e5b', Moderate: '#e0a000', High: '#d6342c' };
