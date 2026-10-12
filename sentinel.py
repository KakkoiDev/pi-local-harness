import os
import time
import sys
import json
import urllib.request
from datetime import datetime

# Configuration
LOG_FILE = "session.log"
LOOP_THRESHOLD = 0.85
STALL_TIMEOUT = 60  # seconds
STALL_ESCALATION_TIMEOUT = 180 # seconds
CHECK_INTERVAL = 10    # seconds

class Sentinel:
    def __init__(self, log_file, loop_threshold=0.85, stall_timeout=60, escalation_timeout=180, interval=1):
        self.log_file = log_file
        self.loop_threshold = loop_threshold
        self.stall_timeout = stall_timeout
        self.escalation_timeout = escalation_timeout
        self.interval = interval
        self.stall_state = "NORMAL" # NORMAL, WARNING, HANGING

    def check_for_loop(self, lines):
        thoughts = [line.split('REASONING_STEP:', 1)[1].strip()
                    for line in lines if 'REASONING_STEP:' in line][-100:]
        seen = {}
        for index in range(len(thoughts) - 2):
            triple = tuple(thoughts[index:index + 3])
            if triple in seen and index - seen[triple] >= 3:
                return True
            seen.setdefault(triple, index)
        return False

    def parse_timestamp(self, line):
        """Extracts timestamp from a line like '[2026-10-11 20:32:29] MESSAGE'"""
        try:
            if line.startswith('['):
                # Timestamp format is '[YYYY-MM-DD HH:MM:SS]' -> 21 chars including '[' and ']'
                # Line example: '[2026-10-11 20:32:29] REASONING_STEP: ...'
                # We need the 19 chars after the '['
                ts_str = line[1:20]
                return datetime.strptime(ts_str, '%Y-%m-%d %H:%M:%S')
        except Exception:
            pass
        return None

    def get_last_activity(self):
        """Finds the timestamp of the most recent activity (REASONING_STEP, TOOL_CALL, or AGENT_RESPONSE)."""
        if not os.path.exists(self.log_file):
            return None
        
        try:
            with open(self.log_file, "r") as f:
                lines = f.readlines()
                for line in reversed(lines):
                    if any(marker in line for marker in ["REASONING_STEP:", "TOOL_CALL:", "AGENT_RESPONSE:"]):
                        ts = self.parse_timestamp(line)
                        if ts:
                            return ts
        except Exception as e:
            print(f"Sentinel Error reading logs: {e}")
        return None

    def check_for_canary(self, lines):
        """Checks if the most recent response starts with the [CANARY] token."""
        if not lines:
            return True
        
        last_line = lines[-1]
        # We expect lines like: "[2026-10-11 20:32:29] AGENT_RESPONSE: [CANARY] ..."
        # or "[2026-10-11 20:32:29] TOOL_CALL: ..." (Wait, canary is for agent responses)
        
        if "AGENT_RESPONSE:" in last_line:
            # Extract message after 'AGENT_RESPONSE: ' and check for '[CANARY]'
            content = last_line.split("AGENT_RESPONSE:")[1].strip()
            if not content.startswith("[CANARY]"):
                return False
        return True

    def log_event(self, event_type, message):
        """Logs a sentinel event to the session log."""
        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(self.log_file, "a") as f:
            f.write(f"[{ts}] {event_type}: {message}\n")
        print(f"[{ts}] {event_type}: {message}")

    def wake_up_actor(self):
        """Attempts to nudge the actor via the Agent API."""
        url = "http://127.0.0.1:8000/chat"
        data = json.dumps({"message": "WAKE_UP_SIGNAL"})
        req = urllib.request.Request(url, data=data.encode('utf-8'), headers={'Content-Type': 'application/json'})
        try:
            # Use a short timeout to prevent the sentinel from hanging
            with urllib.request.urlopen(req, timeout=2) as response:
                pass
        except Exception as e:
            print(f"Sentinel: Failed to send wake-up signal: {e}")

def main_loop():
    print("Standalone Sentinel retired: start pi with ./start.sh. "
          "The pi extension owns active-turn monitoring and recovery; "
          "log inactivity cannot determine whether a model is working.")

if __name__ == "__main__":
    main_loop()
