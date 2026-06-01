#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/admin/pdf-converter-web}"
BACKUP_DIR="${BACKUP_DIR:-/home/admin/pdf-converter-web-backups}"
STAMP="$(date +%F_%H%M%S)"

mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/data-backup-$STAMP.tar.gz" -C "$APP_DIR" data

echo "Backup written to $BACKUP_DIR/data-backup-$STAMP.tar.gz"
