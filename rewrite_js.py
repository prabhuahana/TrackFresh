#!/usr/bin/env python3
"""Rewrite formal comments to sound like a student's notes."""

# ============================================================
# script.js - replace formal header with casual student comment
# ============================================================
js_path = '/Users/ahanaprabhu/Desktop/TrackFresh-main/frontend/script.js'
with open(js_path, 'r') as f:
    c = f.read()

old_header = '''/*
================================================================================
FILE NAME: script.js
PURPOSE: Main JavaScript file for FreshTrack app logic.
CONNECTION TO APP:
   - Loaded on all HTML pages via <script src="script.js">
   - Depends on data.js for constants and reference data
================================================================================

PSEUDOCODE (EXAM STYLE) - HOW THE APP WORKS:
================================================================================
INITIALIZATION:
    DISPLAY "FreshTrack"
    CALL applyTheme() function

MAIN PROGRAM LOOP:
    WHILE user is on page DO
        IF user adds food THEN
            CALL addFood() function
            CALL saveFoods() function
        ENDIF

        IF user views inventory THEN
            CALL getFoods() function
            DISPLAY food list
        ENDIF

        IF user clicks theme toggle THEN
            CALL toggleTheme() function
        ENDIF
    ENDWHILE

DATA STORAGE:
    SAVE all changes to localStorage
================================================================================
*/'''

new_header = '''/* script.js - handles all the app's interactive logic for FreshTrack
   runs on every page so the food list, themes, and login all work */

/*
====================================================================
HOW THE APP WORKS - EXAM PSEUDOCODE:
====================================================================
INITIALIZATION:
    DISPLAY "FreshTrack"
    CALL applyTheme() function

MAIN PROGRAM LOOP:
    WHILE user is on page DO
        IF user adds food THEN
            CALL addFood() function
            CALL saveFoods() function
        ENDIF
        IF user views inventory THEN
            CALL getFoods() function
            DISPLAY food list
        ENDIF
        IF user clicks theme toggle THEN
            CALL toggleTheme() function
        ENDIF
    ENDWHILE

DATA STORAGE:
    SAVE all changes to localStorage
====================================================================
*/'''

c = c.replace(old_header, new_header)
with open(js_path, 'w') as f:
    f.write(c)
print("Updated script.js header")
