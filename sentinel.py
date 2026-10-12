import os
import time
import sys
import difflib
import json
import urllib.request
from datetime import datetime

# Configuration
LOG_FILE = "session.log"
LOOP_THRESHOLD = 0.85
STALL_TIMEOUT = 60  # seconds
STALL_ESCALATION_TIMEOUT = 180 # seconds
CHECK_INTERVAL = 1    # seconds

class Sentinel:
    def __init__(self, log_file, loop_threshold=0.85, stall_timeout=60, escalation_timeout=180, interval=1):
        self.log_file = log_file
        self.loop_threshold = loop_threshold
        self.stall_timeout = stall_timeout
        self.escalation_timeout = escalation_timeout
        self.interval = interval
        self.stall_state = "NORMAL" # NORMAL, WARNING, HANGING

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
        """Finds the timestamp of the most recent REASONING_STEP or TOOL_CALL."""
        if not os.path.exists(self.log_file):
            return None
        
        try:
            with open(self.log_file, "r") as f:
                lines = f.readlines()
                for line in reversed(lines):
                    if "REASONING_STEP:" in line or "TOOL_CALL:" in line:
                        ts = self.parse_timestamp(line)
                        if ts:
                            return ts
        except Exception as e:
            print(f"Sentinel Error reading logs: {e}")
        return None

    def check_for_loop(self, lines):
        """Detects if recent reasoning steps are too similar."""
        recent_messages = []
        for line in lines:
            if "REASONING_STEP:" in line:
                msg = line.split("REASONING_STEP:")[1].strip()
                recent_messages.append(msg)
        
        if len(recent_messages) < 2:
            return False

        # Take the last N messages for comparison
        n = 5
        recent_messages = recent_messages[-n:]
        
        # Compare the last message against all preceding ones in the window
        last_msg = recent_messages[-1]
        for i in range(len(recent_messages) - 1):
            prev_msg = recent_messages[i]
            similarity = difflib.SequenceMatcher(None, last_msg, prev_msg).ratio()
            if similarity > self.loop_threshold:
                return True
        return False

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
    sentinel = Sentinel(LOG_FILE, LOOP_THRESHOLD, STALL_TIMEOUT, STALL_ESCALATION_TIMEOUT, CHECK_INTERVAL)
    print(f"🚀 Watchdog Sentinel is active. Monitoring {LOG_FILE}...")
    
    while True:
        try:
            if not os.path.exists(LOG_FILE):
                time.sleep(CHECK_INTERVAL)
                continue

            with open(LOG_FILE, "r") as f:
                lines = f.readlines()

            if not lines:
                time.sleep(CHECK_INTERVAL)
                continue

            # 1. Check for Loop
            if sentinel.check_for_loop(lines):
                print("\n[!!!] 🚨 WATCHDOG ALERT: REASONING LOOP DETECTED! 🚨")
                sentinel.log_event("LOOP_DETECTION", "High semantic similarity detected in reasoning steps.")
                # Escalation: Create lock file
                with open("killswitch.lock", "w") as lock:
                    lock.write("STOP")
                print("Killswitch lock created. Agent should abort.")
                sys.exit(0)

            # 2. Check for Stall
            last_ts = sentinel.get_last_activity()
            if last_ts:
                elapsed = (datetime.now() - last_ts).total_seconds()
                
                if elapsed > STALL_ESCALATION_TIMEOUT:
                    if sentinel.stall_state != "HANGING":
                        print("\n[!!!] 🚨 WATCHDOG ALERT: SYSTEM HANG DETECTED! 🚨")
                        sentinel.log_event("SYSTEM_HANG", f"No activity for {elapsed}s. Initiating Hang Recovery.")
                        sentinel.stall_state = "HANGING"
                        # Hang Recovery: Kill the agent process
                        print("Sentinel: Attempting to kill process listening on port 8000 (Hang Recovery)...")
                        os.system("lsof -t -i:8000 | xargs kill -9")
                elif elapsed > STALL_TIMEOUT:
                    if sentinel.stall_state == "NORMAL":
                        print("\n[!] ⚠️ WATCHDOG WARNING: STALL DETECTED! ⚠️")
                        sentinel.log_event("STALL_WARNING", f"No activity detected for {elapsed}s. Attempting Wake-up.")
                        sentinel.stall_state = "WARNING"
                        sentinel.wake_up_actor()
                else:
                    # Activity is within normal bounds
                    if sentinel.stall_state != "NORMAL":
                        # Reset state on new activity
                        sentinel.stall_state = "NORMAL"
            else:
                # No activity found yet (initial state)
                pass

        except Exception as e:
            print(f"Sentinel runtime error: {e}")
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main_loop()
