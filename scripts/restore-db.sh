#!/usr/bin/env bash
# Gibeon Empire — restore a backup produced by backup-db.sh.
# Usage: DATABASE_URL=postgres://... ./scripts/restore-db.sh backups/gibeon-YYYYMMDD-HHMMSS.sql.gz
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL}"
FILE="${1:?Pass the .sql.gz backup file to restore}"

echo "Restoring $FILE into $DATABASE_URL"
gunzip -c "$FILE" | psql "$DATABASE_URL"
echo "Restore complete."
