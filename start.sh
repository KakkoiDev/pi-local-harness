#!/bin/bash
set -euo pipefail
harness_root="$(cd "$(dirname "$0")" && pwd)"
cd "$HOME"
exec pi --extension "$harness_root/.pi/extensions/local-harness.ts" "$@"
