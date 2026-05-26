#!/bin/sh
set -e

echo "Running database migrations…"
node dist/db/migrate-cli.js

echo "Starting API server…"
exec node dist/index.js
