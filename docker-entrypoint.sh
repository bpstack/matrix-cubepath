#!/bin/sh
set -e

# Fix ownership of data directory (handles volumes created by root)
chown -R appuser:appgroup /data

# Drop privileges and exec Node as appuser
exec su-exec appuser node dist/backend/start.js
