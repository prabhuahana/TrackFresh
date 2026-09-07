#!/usr/bin/env python3
"""Fix formal headers in script.js, style.css, and server.js."""
import re

# Fix script.js
js_path = '/Users/ahanaprabhu/Desktop/TrackFresh-main/frontend/script.js'
with open(js_path, 'r') as f:
    c = f.read()
old = re.search(r'/\*\n=+\nFILE NAME: script\.js.*?====================================================================\n\*/', c, re.DOTALL)
if old:
    new = '''/* script.js - makes the app interactive: food list, themes, login, etc. */'''
    c = c[:old.start()] + new + c[old.end():]
    with open(js_path, 'w') as f:
        f.write(c)
    print('Fixed script.js')

# Fix style.css
css_path = '/Users/ahanaprabhu/Desktop/TrackFresh-main/frontend/style.css'
with open(css_path, 'r') as f:
    c = f.read()
old = re.search(r'/\*\n=+\nFILE NAME: style\.css.*?====================================================================\n\*/', c, re.DOTALL)
if old:
    c = c[:old.start()] + '/* style.css - all the colours and layouts for FreshTrack */\n' + c[old.end():]
    with open(css_path, 'w') as f:
        f.write(c)
    print('Fixed style.css')

# Fix server.js
srv_path = '/Users/ahanaprabhu/Desktop/TrackFresh-main/server.js'
with open(srv_path, 'r') as f:
    c = f.read()
old = re.search(r'/\*\n=+\nFILE NAME: server\.js.*?====================================================================\n\*/', c, re.DOTALL)
if old:
    new = '''// server.js - backend for FreshTrack
// AI recipe requests and static file serving'''
    c = c[:old.start()] + new + c[old.end():]
    with open(srv_path, 'w') as f:
        f.write(c)
    print('Fixed server.js')
print('Done!')
