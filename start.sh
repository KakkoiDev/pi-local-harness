#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
# Explicit loading also works when project extension discovery is disabled.
exec pi --extension "$PWD/.pi/extensions/local-harness.ts" "$@"
