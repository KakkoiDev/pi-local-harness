#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

echo "🚀 Starting Agent API on http://localhost:8000..."
python3 agent_api.py &
sleep 1

echo "🛡️ Starting Watchdog Sentinel..."
python3 sentinel.py &
sleep 1

echo "🌐 Starting Frontend on http://localhost:3000..."
echo "Press Ctrl+C to stop both servers."
python3 -m http.server 3000
