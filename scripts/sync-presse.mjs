#!/usr/bin/env node
// Copie presse/ vers public/presse/ dans le repo du site.
// Usage : npm run sync:presse -- <chemin-du-site>
//   ex. npm run sync:presse -- ../site
// Le dossier de destination est remplacé entièrement, pour ne pas laisser d'anciens fichiers.
import { cpSync, existsSync, rmSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = process.argv[2];
if (!site) {
  console.error('Usage : npm run sync:presse -- <chemin-du-site>');
  process.exit(1);
}
const publicDir = path.resolve(site, 'public');
if (!existsSync(publicDir)) {
  console.error(`${publicDir} introuvable : le chemin doit pointer vers la racine du repo du site.`);
  process.exit(1);
}
const src = path.join(ROOT, 'presse');
const dest = path.join(publicDir, 'presse');
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
const count = (d) => readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
console.log(`${count(dest)} fichiers copiés vers ${dest}`);
