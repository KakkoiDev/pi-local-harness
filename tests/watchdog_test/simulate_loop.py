import time
import sys
import os

# This script simulates an agent caught in a reasoning loop
# where it outputs the same string repeatedly.

LOG_FILE = "session.log"

def simulate_loop(iterations=10):
    print(f"🚀 Starting loop simulation ({iterations} iterations)...")
    
    # Ensure log is fresh
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    
    with open(LOG_FILE, "a") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] SYSTEM: Starting loop simulation.\n")

    for i in range(iterations):
        # The loop: repeating the same useless reasoning/command
        error_text = "didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' didn' "
        
        print(f"Attempt {i+1}: {error_text}")
        
        # Log the loop output so the Sentinel can "see" it
        with open(LOG_FILE, "a") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] REASONING_STEP: {error_text}\n")
        
        time.sleep(1)

    print("❌ Simulation complete. If the Watchdog is working, 'killswitch.lock' should exist.")

if __name__ == "__main__":
    simulate_loop()
