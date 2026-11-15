// Set EXPO_PUBLIC_API_URL (e.g. http://localhost:8000) to use the real backend.
// Without it, a local template stands in for the Nemotron-generated note.
const API = process.env.EXPO_PUBLIC_API_URL;

export async function generateNote(payload) {
  if (API) {
    const res = await fetch(`${API}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Backend error ${res.status}`);
    return (await res.json()).note;
  }
  await new Promise((r) => setTimeout(r, 900)); // simulate model latency
  return mockNote(payload);
}

function mockNote({ patient, features: f, risk }) {
  const action =
    risk.level === 'High'
      ? 'Immediate physician evaluation; repeat 12-lead ECG, troponin series, activate cath lab pathway if ST changes persist.'
      : risk.level === 'Moderate'
      ? 'Prompt clinician review; serial ECGs and troponin. Monitor on telemetry.'
      : 'Routine evaluation; reassess if symptoms change.';
  return [
    `S: ${patient.age}y ${patient.sex} presenting via ${patient.arrival.toLowerCase()}${patient.chestPain ? ' with chest pain' : ''}.`,
    `O: HR ${f.hr} bpm, ${f.rhythm.toLowerCase()}. RMSSD ${f.rmssd} ms. ST deviation ${f.stDeviation} mV. QT ${f.qtMs} ms.`,
    `A: Fused ECG + ED risk score ${risk.score}/100 (${risk.level}).`,
    `P: ${action}`,
    '',
    'Draft generated for clinician review (demo, not a medical device).',
  ].join('\n');
}
