#!/usr/bin/env node
// Analyse l'enveloppe RMS de l'ident et situe les deux épanouissements du sub
// (le nom, puis le carré orange). Écrit la partie « full » de ident/timing.json.
// Usage : node scripts/analyse-ident.mjs [ident/TLF-ident-C-final.wav] [--plot]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) ?? 'ident/TLF-ident-C-final.wav';
const SR = 48000;
// Mono, flottant 32 bits, via ffmpeg.
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {
  maxBuffer: 1 << 28,
});
const x = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);

// Enveloppe RMS : fenêtre de 10 ms, pas de 5 ms.
const HOP = SR * 0.005, WIN = SR * 0.01;
const db = [];
for (let i = 0; i + WIN <= x.length; i += HOP) {
  let s = 0;
  for (let j = i; j < i + WIN; j++) s += x[j] * x[j];
  db.push(10 * Math.log10(s / WIN + 1e-18));
}
const t = (k) => +(k * 0.005).toFixed(3);

// Attaque : point bas local d'où l'enveloppe gagne plus de 6 dB en 40 ms, hors silence.
const onsets = [];
for (let k = 4; k < db.length - 8; k++) {
  if (db[k] < -60) continue;
  const rise = db[k + 8] - db[k];
  const isMin = db[k] <= Math.min(...db.slice(k - 2, k + 3));
  if (rise > 6 && isMin && (!onsets.length || t(k) - onsets.at(-1) > 0.5)) onsets.push(t(k));
}
if (onsets.length < 2) throw new Error(`Attaques trouvées : ${onsets.join(', ') || 'aucune'}`);
const [impactNom, impactCarre] = onsets;

if (process.argv.includes('--plot')) {
  for (let k = 0; k < db.length; k += 10) console.log(`${t(k).toFixed(2)} ${db[k].toFixed(1).padStart(7)} ${'#'.repeat(Math.max(0, Math.round(db[k] + 60)))}`);
}
const out = 'ident/timing.json';
const timing = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {};
timing.full = { impactNom, impactCarre };
writeFileSync(out, JSON.stringify(timing, null, 2) + '\n');
console.log(`Attaques détectées : ${onsets.join(' s, ')} s`);
console.log(`impactNom = ${impactNom} s, impactCarre = ${impactCarre} s → ${out}`);
