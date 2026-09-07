#!/usr/bin/env python3
"""Rewrite script_new.js header."""

js2_path = '/Users/ahanaprabhu/Desktop/TrackFresh-main/frontend/script_new.js'
with open(js2_path, 'r') as f:
    c = f.read()

# Find and replace the formal header block
import re
old_pattern = r'/\*\n=+\nFILE NAME: script_new\.js.*?====================================================================\n\*/'
match = re.search(old_pattern, c, re.DOTALL)
if match:
    c = c[:match.start()] + '// script_new.js - backup copy of the app logic (not used on pages)\n' + c[match.end():]
    with open(js2_path, 'w') as f:
        f.write(c)
    print("Updated script_new.js header")
else:
    print("No formal header found in script_new.js - checking manually...")
    # Show first 20 lines
    lines = c.split('\n')[:20]
    for i, line in enumerate(lines):
        print(f"  {i+1}: {line}")
