import os
import time

LOG_FILE = "session.log"

def log_event(message):
    """Log an event to the session log for the Watchdog to monitor."""
    # Temporarily disabled for TDD Red state
    # with open(LOG_FILE, "a") as f:
    #     f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")
    pass

if __name__ == "__main__":
    log_event("Sentinel system initialized.")
    print("Logger initialized. Use `log_event` to record your reasoning steps.")
