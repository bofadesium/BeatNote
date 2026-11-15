import { synthesize, extractFeatures } from './ecg';

const defs = [
  { id: 'normal', title: 'Routine check', patient: { age: 34, sex: 'F', arrival: 'Walk-in', chestPain: false }, sig: { hr: 72, hrvMs: 25, st: 0, qt: 0.38, seed: 3 } },
  { id: 'stemi', title: 'Suspected STEMI', patient: { age: 67, sex: 'M', arrival: 'Ambulance', chestPain: true }, sig: { hr: 98, hrvMs: 20, st: 0.45, qt: 0.44, seed: 7 } },
  { id: 'afib', title: 'Irregular rhythm', patient: { age: 72, sex: 'F', arrival: 'Walk-in', chestPain: false }, sig: { hr: 118, hrvMs: 140, st: 0.05, qt: 0.4, seed: 11 } },
];

export const CASES = defs.map((d) => {
  const signal = synthesize(d.sig);
  return { ...d, signal, features: extractFeatures(signal, d.sig) };
});
