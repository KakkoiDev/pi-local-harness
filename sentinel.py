import os
import time
import subprocess
import sys

# Configuration
LOG_FILE = "session.log"
OLLAMA_ENDPOINT = "http://localhost:11434/api/generate"
MODEL_NAME = "laya"
CHECK_INTERVAL = 1  # Faster for testing
LOOP_THRESHOLD = 3

class Sentinel:
    def __init__(self, log_file, threshold=3, interval=1):
        self.log_file = log_file
        self.threshold = threshold
        self.interval = interval

    def log_event(self, message):
        with open(self.log_file, "a") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")

    def check_for_loop(self):
        if not os.path.exists(self.log_file):
            return False
        try:
            with open(self.log_file, "r") as f:
                lines = f.readlines()
                if len(lines) < self.threshold:
                    return False

                # Extract the actual content from the last few lines
                # We filter for lines containing the simulated REASONING_STEP
                recent_messages = []
                for line in lines[-self.threshold:]:
                    if "REASONING_STEP:" in line:
                        msg = line.split("REASONING_STEP:")[1].strip()
                        recent_messages.append(msg)
                
                if len(recent_messages) < 2:
                    return False

                import difflib
                # Force failure for TDD
                return False
                similarity = difflib.SequenceMatcher(None, recent_messages[-1], recent_messages[-2]).ratio()
                return similarity > 0.8
        except Exception as e:
            print(f"Watchdog Error: {e}")
            return False

def main_loop():
    sentinel = Sentinel(LOG_FILE, LOOP_THRESHOLD, CHECK_INTERVAL)
    print(f"🚀 Watchdog Sentinel is active. Monitoring {LOG_FILE}...")
    print(f"Target Model: {MODEL_NAME} | Interval: {CHECK_INTERVAL}s")
    
    while True:
        if sentinel.check_for_loop():
            print("\n[!!!] 🚨 WATCHDOG ALERT: REASONING LOOP DETECTED! 🚨")
            print("Initiating Emergency Shutdown...")
            with open("killswitch.lock", "w") as f:
                f.write("STOP")
            print("Killswitch lock created. Agent should abort on next turn.")
            sys.exit(0)
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main_loop()
