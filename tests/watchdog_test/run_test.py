import subprocess
import time
import os
import signal
import sys

# Configuration
LOG_FILE = "session.log"
SENTINEL_SCRIPT = "sentinel.py"
LOOP_SCRIPT = "tests/watchdog_test/simulate_loop.py"
LOCK_FILE = "killswitch.lock"

def run_test():
    print("🧪 Starting Watchdog Stress Test...")
    print(f"1. Cleaning up previous runs...")
    for f in [LOG_FILE, LOCK_FILE]:
        if os.path.exists(f):
            os.remove(f)
            print(f"   - Removed {f}")

    print(f"\n2. Starting the Sentinel in the background...")
    # Start the sentinel in a new process group so it doesn't die if we kill the parent
    sentinel_proc = subprocess.Popen([
        "python3", SENTINEL_SCRIPT
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    print(f"   - Sentinel PID: {sentinel_proc.pid}")

    try:
        print(f"\n3. Starting the Loop Simulation...")
        # Run the loop script in the same process group
        subprocess.run(["python3", LOOP_SCRIPT])

        print(f"\n4. Checking for 'killswitch.lock'...")
        # Give the sentinel more time to catch up
        time.sleep(5) 
        
        if os.path.exists(LOCK_FILE):
            print("\n✅ TEST PASSED: The Watchdog detected the loop and created the lock!")
            print("Status: SUCCESS")
        else:
            print("\n❌ TEST FAILED: The loop finished, but no lock was created.")
            print("Status: FAILURE")
            sys.exit(1)

    except Exception as e:
        print(f"An error occurred during the test: {e}")
        sys.exit(1)
    finally:
        print(f"\n5. Cleaning up...")
        sentinel_proc.terminate()
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
        print("Cleanup complete. Test terminated.")

if __name__ == "__main__":
    run_test()
