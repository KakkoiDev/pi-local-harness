#!/bin/bash
set -euo pipefail
harness_root="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$harness_root/plh.py" "$@"
