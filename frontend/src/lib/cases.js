import { synthesize, extractFeatures } from './ecg';

const defs = [
  { id: 'normal', title: 'Routine check', patient: { age: 34, sex: 'F', arrival: 'Walk-in', chestPain: false }, triage: { esi: 4, n_edvisits: 0, n_admissions: 0, n_surgeries: 1 }, vitals: { sbp: 118, dbp: 76, rr: 16, o2: 98, temp: 98.2 }, sig: { hr: 72, hrvMs: 25, st: 0, qt: 0.38, seed: 3 } },
  { id: 'stemi', title: 'Suspected STEMI', patient: { age: 67, sex: 'M', arrival: 'Ambulance', chestPain: true }, triage: { esi: 2, n_edvisits: 1, n_admissions: 1, n_surgeries: 2 }, vitals: { sbp: 128, dbp: 80, rr: 20, o2: 96, temp: 98.4 }, sig: { hr: 98, hrvMs: 20, st: 0.45, qt: 0.36, seed: 7 } },
  { id: 'afib', title: 'Irregular rhythm', patient: { age: 72, sex: 'F', arrival: 'Walk-in', chestPain: false }, triage: { esi: 3, n_edvisits: 3, n_admissions: 1, n_surgeries: 2 }, vitals: { sbp: 148, dbp: 90, rr: 22, o2: 94, temp: 98.6 }, sig: { hr: 118, hrvMs: 140, st: 0.02, qt: 0.3, seed: 11 } },
];

export const CASES = defs.map((d) => {
  const signal = synthesize(d.sig);
  return { ...d, signal, features: extractFeatures(signal, d.sig) };
});
