#!/usr/bin/env bash
# Gibeon Empire — PostgreSQL backup (PRD NFR: data backup & recovery).
# Usage: DATABASE_URL=postgres://... ./scripts/backup-db.sh [outdir]
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL}"
OUTDIR="${1:-backups}"
mkdir -p "$OUTDIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUTDIR/gibeon-$STAMP.sql.gz"

# Custom-format-ish plain dump, gzipped. Schedule via cron/Railway cron.
pg_dump "$DATABASE_URL" --no-owner --clean --if-exists | gzip > "$FILE"
echo "Backup written: $FILE"

# Retain the 14 most recent backups.
ls -1t "$OUTDIR"/gibeon-*.sql.gz | tail -n +15 | xargs -r rm --
