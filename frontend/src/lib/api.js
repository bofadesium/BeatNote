// EXPO_PUBLIC_API_URL (set in .env, e.g. http://localhost:8010) points at the FastAPI backend.
// Without it (or if it is down) the app falls back to local rules + a mock note.
import { localAssess } from './assess';

const API = process.env.EXPO_PUBLIC_API_URL;
export const hasBackend = !!API;

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error(`Can't reach the backend at ${API}. Is it running?`);
  }
  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  return res.json();
}

export async function assess(c) {
  if (hasBackend) {
    try {
      return { ...(await post('/assess', {
        case_id: c.id, patient: c.patient, triage: c.triage, vitals: c.vitals,
        ecg: c.features,
      })), source: 'backend' };
    } catch { /* fall through to local rules */ }
  }
  return { ...localAssess(c), source: 'local' };
}

export async function sendAlert(caseId, level, reasons) {
  if (!hasBackend) throw new Error('offline');
  return post('/alerts', { case_id: caseId, level, reasons });
}

export async function generateNote(payload) {
  if (hasBackend) return post('/note', payload); // { note, source }
  await new Promise((r) => setTimeout(r, 900));
  return { note: mockNote(payload), source: 'mock' };
}

function mockNote({ patient, features: f, risk, flags }) {
  const action = { High: 'Immediate physician evaluation; repeat 12-lead ECG, troponin series, activate cath lab pathway if ST changes persist.',
    Moderate: 'Prompt clinician review; serial ECGs and troponin. Monitor on telemetry.',
    Low: 'Routine evaluation; reassess if symptoms change.' }[risk.level];
  return [
    `Subjective: ${patient.age}y ${patient.sex} presenting via ${patient.arrival.toLowerCase()}${patient.chestPain ? ' with chest pain' : ''}.`,
    `Objective: HR ${f.hr} bpm, ${f.rhythm.toLowerCase()}. RMSSD ${f.rmssd} ms. ST deviation ${f.stDeviation} mV. QT ${f.qtMs} ms.`,
    `Assessment: ED admission-risk score ${risk.score}/100; overall triage status ${risk.level}.${flags.length ? ` Flagged for clinician: ${flags.join('; ')}.` : ''}`,
    `Plan: ${action}`,
    '',
    'Draft generated for clinician review (demo, not a medical device).',
  ].join('\n');
}
