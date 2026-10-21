#!/usr/bin/env bash
# track.sh <statedir> <specs.tsv>
# One pass of a component track. When the build named by COMPDIFF_STAMP_FILE differs from the last one measured,
# it measures every board, writes the fleet summary and updates <statedir>/findings.md (open, fixed, verified).
# Prints "NO-CHANGE <stamp>" or the new run directory. Takes the same environment as runall.sh.
set -u
state=$1; specs=$2
HERE="$(cd "$(dirname "$0")" && pwd)"
: "${COMPDIFF_STAMP_FILE:?set COMPDIFF_STAMP_FILE to the file that names the live build}"
mkdir -p "$state/runs"
stamp=$(head -1 "$COMPDIFF_STAMP_FILE" 2>/dev/null)
last=$(cat "$state/runs/LAST_STAMP" 2>/dev/null)
if [ -n "$stamp" ] && [ "$stamp" = "$last" ]; then echo "NO-CHANGE ${stamp:0:9}"; exit 0; fi
out="$state/runs/$(date +%m%d-%H%M)-${stamp:0:9}"
mkdir -p "$out"
echo "stamp=$stamp boards=$(git -C "$HERE" rev-parse --short HEAD 2>/dev/null)" > "$out/RUN-INFO"
"$HERE/runall.sh" "$out" "$specs" > "$out/batch.log" 2>&1
node "$HERE/summarize.mjs" "$out"
node "$HERE/findings.mjs" "$out" "$state/findings.md"
echo "$stamp" > "$state/runs/LAST_STAMP"
echo "$out"
