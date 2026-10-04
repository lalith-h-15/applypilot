#!/usr/bin/env bash
# Quickstart script for ApplyPilot - Vikas Module
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PORT="${1:-8000}"

echo "=========================================================="
echo " Starting ApplyPilot - Vikas Module (Full-Stack Demo)"
echo " Server: Python 3 Standard Library HTTP + SQLite3"
echo " Port:   http://localhost:${PORT}"
echo "=========================================================="

python3 "${DIR}/backend/server.py" "${PORT}"
