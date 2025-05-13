#!/usr/bin/env python3
import os
import signal
import sys
import time

print("Stopping any running Node.js processes...")
try:
    # Attempt to kill the Node.js process
    os.system("pkill -f 'node|npm|tsx'")
except:
    pass

print("Starting Flask app...")
os.execv(sys.executable, [sys.executable, 'app.py'])