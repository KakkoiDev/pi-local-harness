import glob
import os
import re
import subprocess
import sys

def verify_workflow():
    errors = []
    
    # Prefer the current dashboard, retaining legacy compatibility.
    dashboard = "ROADMAP.md" if os.path.exists("ROADMAP.md") else "todo.md"
    # 1. Load dashboard
    if not os.path.exists(dashboard):
        print("Error: workflow dashboard not found")
        sys.exit(1)
    
    with open(dashboard, "r") as f:
        todo_content = f.read()
    
    # Find all tasks in todo.md: - [ ] [Name](path) or - [x] [Name](path)
    task_pattern = re.compile(r'- \[(.)\] \[(.*?)\]\((.*?)\)')
    todos = task_pattern.findall(todo_content)
    
    for status, name, path in todos:
        # Normalize path (remove potential trailing space or weirdness)
        path = path.strip()
        
        # Check if the task file actually exists
        if not os.path.exists(path):
            errors.append(f"Task file missing: {path} (referenced in todo.md)")
            continue
            
        # If task is marked completed [x], check all boxes in the file
        if status == 'x':
            with open(path, "r") as tf:
                task_content = tf.read()
                # Find all checkboxes in the task file
                checkboxes = re.findall(r'- \[(.)\]', task_content)
                for cb_status in checkboxes:
                    if cb_status != 'x':
                        errors.append(f"Task {path} marked completed in todo.md but has unchecked boxes")
                        break
    
    # Run the Python and Node suites; any failure fails the gate.
    suites = [('unittest', [sys.executable, '-m', 'unittest', 'discover', '-s', 'tests'])] if os.path.isdir('tests') else []
    node_tests = sorted(glob.glob('tests/harness/*.test.mjs'))
    if node_tests:
        suites.append(('node --test', ['node', '--test', *node_tests]))
    for label, command in suites:
        completed = subprocess.run(command, capture_output=True, text=True)
        if completed.returncode:
            errors.append(f"{label} failed (exit {completed.returncode}):\n{(completed.stdout + completed.stderr)[-3000:]}")
        else:
            print(f"✅ {label} passed")

    if errors:
        for err in errors:
            print(f"❌ {err}")
        return False
    
    print("✅ Workflow Verification Passed!")
    return True

if __name__ == "__main__":
    if not verify_workflow():
        sys.exit(1)
