#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
. ./.env
file="backups/gd-birthday-$(date -u +%Y%m%d-%H%M%S).dump"
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$file.tmp"
mv "$file.tmp" "$file"
chmod 600 "$file"
find backups -name 'gd-birthday-*.dump' -mtime +7 -delete
echo "$(date -u +%FT%TZ) backup $file"
