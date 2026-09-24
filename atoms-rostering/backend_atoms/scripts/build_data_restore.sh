#!/usr/bin/env bash
# Build a FK-safe data-only restore from the full rostering dump.
# Runs with session_replication_role=replica (bypasses FK ordering on load).
set -e
SRC=/home/airnav/teknik2026/backups/rostering.sql
OUT=/home/airnav/teknik2026/backups/rostering_data_restore.sql
LOGGED=/home/airnav/teknik2026/backups/.restore_progress.log

EXCL=" migrations sessions personal_access_tokens account_tokens cache cache_locks failed_jobs job_batches jobs notifications account_tokens "

python3 - "$SRC" "$OUT" "$EXCL" <<'PYEOF'
import sys, io, re
src, out, excl = sys.argv[1], sys.argv[2], sys.argv[3]
with open(out, "w", encoding="utf-8") as W:
    W.write("SET session_replication_role = replica;\n\n")
    keep=False
    for line in io.open(src, encoding="utf-8", errors="replace"):
        s = line.rstrip("\n")
        if s.startswith("COPY public.") and " FROM stdin;" in s:
            t = re.match(r"COPY public\.(\w+) ", s).group(1)
            keep = (" "+t+" " in " "+excl+" ")
            if keep:
                W.write(s + "\n")
            continue
        if keep:
            if s == "\\.":
                W.write("\\.\n")
                keep = False
            else:
                W.write(s + "\n")
    W.write("\nSET session_replication_role = DEFAULT;\n")
print("built", out)
PYEOF
echo "built $(basename $OUT)"