#!/bin/bash

# watch_dev.sh - A simple hot-reloader for the agent environment

# Function to kill background processes
stop_processes() {
    echo "🛑 Stopping all processes..."
    # Kill processes by name to be safe, or use jobs
    pkill -f "python3 agent_api.py"
    pkill -f "python3 sentinel.py"
    pkill -f "python3 -m http.server"
    sleep 1
}

# Function to start everything
start_everything() {
    echo "🚀 Starting all services..."
    ./start.sh
}

# Initial start
start_everything

# Get initial modification times for all relevant files
# We track .py, .html, .js, and .md files
get_mtimes() {
    find . -maxdepth 2 -name "*.py" -o -name "*.html" -o -name "*.js" -o -name "*.md" | xargs stat -c '%Y %n'
}

echo "👀 Watching for file changes..."
LAST_MTIMES=$(get_mtimes)

while true; do
    sleep 2 # Check every 2 seconds
    CURRENT_MTIMES=$(get_mtimes)

    if [ "$LAST_MTIMES" != "$CURRENT_MTIMES" ]; then
        echo "✨ Change detected! Hot-reloading..."
        stop_processes
        start_everything
        LAST_MTIMES=$CURRENT_MTIMES
    fi
done
