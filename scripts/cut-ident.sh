#!/usr/bin/env bash
# Coupe courte du logo sonore TLF Studio.
# Usage : scripts/cut-ident.sh <début s> <fin s> <impact s> [source.wav]
#   début, fin : bornes dans l'ident complet ; impact : impact du carré dans l'ident complet
#   (voir ident/timing.json, full.impactCarre, mesuré par scripts/analyse-ident.mjs).
# Exemple : scripts/cut-ident.sh 2.015 3.815 2.615
# Sorties : ident/TLF-ident-C-short.{wav,mp3,ogg}, et la partie « short » de ident/timing.json.
set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage : $0 <début s> <fin s> <impact s> [source.wav]" >&2
  exit 1
fi
START=$1 END=$2 IMPACT=$3 SRC=${4:-ident/TLF-ident-C-final.wav}
OUT=ident/TLF-ident-C-short
FADE_IN=0.03 FADE_OUT=0.25
TARGET_I=-14 TARGET_TP=-1 TARGET_LRA=11

DUR=$(awk "BEGIN{printf \"%.3f\", $END - $START}")
FO_START=$(awk "BEGIN{printf \"%.3f\", $DUR - $FADE_OUT}")
SHORT_IMPACT=$(awk "BEGIN{printf \"%.3f\", $IMPACT - $START}")
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# 1. Coupe et fondus (fondu de sortie en courbe exponentielle douce pour ne pas tronquer la traînée).
ffmpeg -v error -y -i "$SRC" \
  -af "atrim=start=$START:end=$END,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=$FADE_IN:curve=tri,afade=t=out:st=$FO_START:d=$FADE_OUT:curve=exp" \
  -c:a pcm_f32le "$TMP/cut.wav"

# 2. Normalisation loudnorm en deux passes. Un extrait de 1,8 s est trop court pour la fenêtre
#    de 3 s de loudnorm : on le mesure et on le corrige sur une version bouclée (6 répétitions),
#    puis on ne garde que la première occurrence. Le gain linéaire est identique.
ffmpeg -v error -y -stream_loop 5 -i "$TMP/cut.wav" -c:a pcm_f32le "$TMP/loop.wav"
MEASURE=$(ffmpeg -hide_banner -nostats -i "$TMP/loop.wav" \
  -af "loudnorm=I=$TARGET_I:TP=$TARGET_TP:LRA=$TARGET_LRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
val() { echo "$MEASURE" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
LN="loudnorm=I=$TARGET_I:TP=$TARGET_TP:LRA=$TARGET_LRA:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true:print_format=summary"
ffmpeg -v error -y -i "$TMP/loop.wav" -af "$LN,atrim=0:$DUR,aresample=48000" -c:a pcm_f32le "$TMP/norm.wav"

# 3. Ajustement fin sur l'extrait seul : la boucle décale légèrement la mesure intégrée.
#    Gain résiduel = min(cible I - I mesuré, cible TP - TP mesuré), puis contrôle final.
ebu() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p'; }
R=$(ebu "$TMP/norm.wav")
I=$(echo "$R" | awk '/ I:/{print $2}') TP=$(echo "$R" | awk '/Peak:/{print $2}')
GAIN=$(awk "BEGIN{a=$TARGET_I-($I); b=$TARGET_TP-($TP); printf \"%.2f\", (a<b)?a:b}")
ffmpeg -v error -y -i "$TMP/norm.wav" -af "volume=${GAIN}dB" -c:a pcm_f32le "$TMP/final.wav"
R=$(ebu "$TMP/final.wav")
echo "Contrôle : $(echo "$R" | awk '/ I:/{print $2" "$3}') intégré, true peak $(echo "$R" | awk '/Peak:/{print $2" "$3}') (gain résiduel ${GAIN} dB)"

# 4. Exports.
ffmpeg -v error -y -i "$TMP/final.wav" -ar 48000 -c:a pcm_s24le "$OUT.wav"
ffmpeg -v error -y -i "$TMP/final.wav" -ar 48000 -c:a libmp3lame -b:a 320k "$OUT.mp3"
ffmpeg -v error -y -i "$TMP/final.wav" -ar 48000 -c:a libvorbis -q:a 8 "$OUT.ogg"

# 5. ident/timing.json : partie « short ».
node -e '
const fs = require("fs"); const f = "ident/timing.json";
const t = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
t.short = { impact: +process.argv[1], duree: +process.argv[2], debutDansFull: +process.argv[3] };
fs.writeFileSync(f, JSON.stringify(t, null, 2) + "\n");' "$SHORT_IMPACT" "$DUR" "$START"

echo "Coupe : $START → $END s ($DUR s), impact à $SHORT_IMPACT s → $OUT.{wav,mp3,ogg}"
