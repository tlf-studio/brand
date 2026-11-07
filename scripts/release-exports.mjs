#!/usr/bin/env node
// Publie les vidéos de exports/ dans une release GitHub brand-vX.Y.Z (gh release create).
// Version : argument --version X.Y.Z, sinon la version du package.json.
// Usage : npm run export:release   (exporte puis publie)
//         node scripts/release-exports.mjs --version 1.1.0 [--draft]
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--version');
const version = i > 0 ? process.argv[i + 1] : JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error(`Version invalide : ${version}`);
const tag = `brand-v${version}`;

const dir = path.join(ROOT, 'exports');
const files = readdirSync(dir).filter((f) => f.endsWith('.mp4')).sort().map((f) => path.join(dir, f));
if (files.length === 0) throw new Error('exports/ est vide : lancer npm run export:animations');

const ident = JSON.parse(readFileSync(path.join(ROOT, 'ident', 'timing.json'), 'utf8'));
const notes = `Exports vidéo des 6 animations du monogramme, calés sur la coupe courte du logo sonore.

- Formats : 1920 × 1080 (16x9) et 1080 × 1920 (9x16), 30 i/s, H.264, AAC 192 kbit/s.
- Chaque vidéo existe avec son et en version muette (suffixe -muet).
- L'impact de l'animation tombe sur l'impact du son (coupe courte : ${ident.short.impact} s après son début).
- Nommage : tlf-{n}-{nom}-{light|dark}-{16x9|9x16}[-muet].mp4

Générés par \`npm run export:animations\` depuis \`logo/animated/\` et \`ident/TLF-ident-C-short.wav\`.`;

const args = ['release', 'create', tag, ...files, '--title', `Exports vidéo ${tag}`, '--notes', notes];
if (process.argv.includes('--draft')) args.push('--draft');
execFileSync('gh', args, { stdio: 'inherit', cwd: ROOT });
console.log(`Release ${tag} : ${files.length} fichiers.`);
