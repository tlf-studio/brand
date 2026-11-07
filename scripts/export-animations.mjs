#!/usr/bin/env node
// Exporte en vidéo les 6 animations du monogramme, calées sur la coupe courte du logo sonore.
// Rendu image par image (animations en pause, currentTime avancé à 30 fps) : aucune capture
// en temps réel, la synchronisation est donc exacte.
// Usage : npm run export:animations [-- --only 1-assemblage] [-- --theme dark] [-- --format 16x9]
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'exports');
const AUDIO = path.join(ROOT, 'ident', 'TLF-ident-C-short.wav');
const FPS = 30;
const DUREE_MIN = 2.5; // durée cible
const BG = { light: '#F4F4F2', dark: '#111111' };
const FORMATS = { '16x9': [1920, 1080], '9x16': [1080, 1920] };

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const anims = JSON.parse(readFileSync(path.join(ROOT, 'logo', 'animated', 'timing.json'), 'utf8'));
const short = JSON.parse(readFileSync(path.join(ROOT, 'ident', 'timing.json'), 'utf8')).short;
if (!short) throw new Error('ident/timing.json sans partie « short » : lancer scripts/cut-ident.sh');

/**
 * Plan temporel d'une animation :
 * - si l'animation se pose avant short.impact, on la retarde (temps de pose au début) ;
 * - sinon, c'est le son qui démarre plus tard, pour que l'impact tombe sur la pose.
 * La durée vaut 2,5 s, prolongée si besoin pour ne pas couper la traînée du son.
 */
export function plan(pose) {
  const lead = Math.max(0, short.impact - pose); // retard de l'animation
  const audioDelay = Math.max(0, pose - short.impact); // retard du son
  const impact = pose + lead; // = short.impact + audioDelay
  const duree = Math.max(DUREE_MIN, Math.ceil((audioDelay + short.duree) * FPS) / FPS);
  return { lead, audioDelay, impact, duree };
}

function ffmpeg(args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
    p.on('error', reject);
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg a échoué (${c})`))));
    if (input) input(p.stdin);
  });
}

async function render(browser, name, theme, format) {
  const [W, H] = FORMATS[format];
  const { lead, audioDelay, impact, duree } = plan(anims[name].pose);
  const svgSrc = readFileSync(path.join(ROOT, 'logo', 'animated', `tlf-${name}-${theme}.svg`), 'utf8');
  // Le contenu du monogramme occupe 100 unités sur les 120 de la grille : hauteur visible = 28 % du petit côté.
  const size = (0.28 * Math.min(W, H) * 120) / 100;
  const svg = svgSrc.replace(/\swidth="\d+"\s+height="\d+"/, ` width="${size}" height="${size}"`);
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;background:${BG[theme]};display:grid;place-items:center;overflow:hidden">${svg}</body></html>`,
  );
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));

  const base = `tlf-${name}-${theme}-${format}`;
  const file = path.join(OUT, `${base}.mp4`);
  const frames = Math.round(duree * FPS);
  const audioFilter = `adelay=${Math.round(audioDelay * 1000)}:all=1,apad`;
  await ffmpeg(
    [
      '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-i', AUDIO,
      '-filter:a', audioFilter,
      '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
      '-t', duree.toFixed(3), '-movflags', '+faststart',
      file,
    ],
    async (stdin) => {
      for (let f = 0; f < frames; f++) {
        const t = Math.max(0, f / FPS - lead) * 1000;
        await page.evaluate((ms) => document.getAnimations().forEach((a) => (a.currentTime = ms)), t);
        const png = await page.screenshot({ type: 'png' });
        if (!stdin.write(png)) await new Promise((r) => stdin.once('drain', r));
      }
      stdin.end();
    },
  );
  await ffmpeg(['-i', file, '-map', '0:v', '-c:v', 'copy', '-an', '-movflags', '+faststart', path.join(OUT, `${base}-muet.mp4`)]);
  await page.close();
  console.log(`${base} : ${duree.toFixed(2)} s, impact à ${impact.toFixed(3)} s (animation +${lead.toFixed(3)} s, son +${audioDelay.toFixed(3)} s)`);
}

if (!existsSync(AUDIO)) throw new Error(`${AUDIO} absent : lancer scripts/cut-ident.sh`);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  const names = Object.keys(anims).filter((n) => !n.startsWith('_') && (!arg('only') || n === arg('only')));
  for (const name of names)
    for (const theme of arg('theme') ? [arg('theme')] : ['light', 'dark'])
      for (const format of arg('format') ? [arg('format')] : Object.keys(FORMATS)) await render(browser, name, theme, format);
} finally {
  await browser.close();
}
