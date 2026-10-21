#!/usr/bin/env bash
# runall.sh <outdir> <specs.tsv | boards.json>
# Runs compdiff.mjs for every row of specs.tsv: board<TAB>route[<TAB>--flag<TAB>value]...
# Given a REVIEW boards.json, it writes <outdir>/specs.tsv from it (specs-from-boards.mjs) and runs that.
# Optional environment:
#   COMPDIFF_HEALTH      command that must succeed before a board is measured (waits up to 30 min)
#   COMPDIFF_STAMP_FILE  file whose first line names the build on the live instance; a board measured
#                        while it changed is measured again (max 3 tries)
#   COMPDIFF_LOCK_DIR    directory with slot locks <dir>/pixel-1.lock and pixel-2.lock, shared with other runs
#   COMPDIFF_SLICE       systemd user slice to run each browser in, capped at 2G
#   COMPDIFF_SKIP_FIRST_RUN  app ids whose first-run dialogs to suppress (default: none), not on /settings/ routes
set -u
out=$1; specs=$2; mkdir -p "$out"
HERE="$(cd "$(dirname "$0")" && pwd)"
# A REVIEW boards.json in place of a specs file: its rows are written first, each board with its steps in order.
if [[ "$specs" == *.json ]]; then
	node "$HERE/specs-from-boards.mjs" "$specs" > "$out/specs.tsv" || exit 2
	specs="$out/specs.tsv"
fi
stamp() { [ -n "${COMPDIFF_STAMP_FILE:-}" ] && head -1 "$COMPDIFF_STAMP_FILE" 2>/dev/null; }
healthy() {
	[ -z "${COMPDIFF_HEALTH:-}" ] && return 0
	for _ in $(seq 1 30); do bash -c "$COMPDIFF_HEALTH" >/dev/null 2>&1 && return 0; echo "$(date +%T) waiting for health" >> "$out/run.log"; sleep 60; done
	return 1
}
measure() {
	local cmd=(timeout 600 node "$HERE/compdiff.mjs" "$@")
	[ -n "${COMPDIFF_SLICE:-}" ] && cmd=(systemd-run --user --scope --quiet --slice="$COMPDIFF_SLICE" -p MemoryMax=2G "${cmd[@]}")
	if [ -z "${COMPDIFF_LOCK_DIR:-}" ]; then "${cmd[@]}"; return; fi
	# Both slots busy: queue on one slot for 1 s, then the other. A queued flock is woken the moment the slot is
	# released, so a run that waits gets the slot before a run that only polls it between boards.
	local turn=1
	while true; do
		for slot in 1 2; do
			exec 9>"$COMPDIFF_LOCK_DIR/pixel-$slot.lock"
			if flock -n 9; then "${cmd[@]}"; local rc=$?; flock -u 9; return $rc; fi
			exec 9>&-
		done
		exec 9>"$COMPDIFF_LOCK_DIR/pixel-$turn.lock"
		if flock -w 1 9; then "${cmd[@]}"; local rc=$?; flock -u 9; return $rc; fi
		exec 9>&-
		turn=$((3 - turn))
	done
}
while IFS=$'\t' read -r b u rest; do
	[ -z "$b" ] && continue
	extra=(); [ -n "$rest" ] && IFS=$'\t' read -r -a extra <<< "$rest"
	skip=(); [ -n "${COMPDIFF_SKIP_FIRST_RUN:-}" ] && skip=(--skip-first-run "$COMPDIFF_SKIP_FIRST_RUN")
	case "$u" in /settings/*) skip=();; esac
	res=""
	for _ in 1 2 3; do
		healthy || break
		s1=$(stamp)
		res=$(measure --board "$b" --url "$u" --out "$out" "${skip[@]}" "${extra[@]}" 2>>"$out/run.log" </dev/null | grep '^{' | tail -1)
		[ "$s1" = "$(stamp)" ] && break
		echo "$(date +%T) $b build changed during the measurement, measuring again" >> "$out/run.log"; res=""
	done
	[ -n "$res" ] || res="{\"board\":\"$b\",\"error\":1}"
	echo "$res" >> "$out/results.jsonl"
	echo "$b $res"
done < "$specs"
echo BATCH-DONE
