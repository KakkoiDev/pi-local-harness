#!/bin/sh
# Task 311 (gate/sandbox.py): run one allowed test command under macOS sandbox-exec, with a scrubbed environment.
#   sandbox-run.sh <profile.sb> <temporary folder> '<command>'
# Only these variables pass: the toolchains' own, the locale, the terminal, PATH and HOME. No PI_HARNESS_*, no tokens.
profile="$1"; temporary="$2"; command="$3"
set --
for name in USER LOGNAME SHELL LANG LC_ALL LC_CTYPE LC_MESSAGES TERM COLORTERM NO_COLOR FORCE_COLOR CI TZ \
  UV_CACHE_DIR UV_PYTHON_INSTALL_DIR UV_TOOL_DIR UV_OFFLINE NPM_CONFIG_CACHE CARGO_HOME RUSTUP_HOME NVM_DIR VOLTA_HOME \
  PYENV_ROOT JAVA_HOME TAILWINDCSS_VERSION TAILWINDCSS_BIN_DIR DEVELOPER_DIR SDKROOT PYTHONDONTWRITEBYTECODE PYTHONPATH NODE_NO_WARNINGS; do
  eval "value=\${$name+set}"
  if [ "$value" = set ]; then eval "set -- \"\$@\" \"$name=\${$name}\""; fi
done
exec /usr/bin/env -i PATH="$PATH" HOME="$HOME" TMPDIR="$temporary/" "$@" /usr/bin/sandbox-exec -f "$profile" /bin/sh -c "$command"
