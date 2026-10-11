import os
import utils

def test_log_event():
    log_file = "test_session.log"
    # Patch the LOG_FILE in utils for testing
    utils.LOG_FILE = log_file
    
    msg = "Testing the logger"
    utils.log_event(msg)
    
    assert os.path.exists(log_file)
    with open(log_file, "r") as f:
        content = f.read()
        assert msg in content
    
    os.remove(log_file)

if __name__ == "__main__":
    try:
        test_log_event()
        print("Test Passed!")
    except Exception as e:
        print(f"Test Failed: {e}")
        exit(1)
