#!/usr/bin/env python3
"""Rewrite server.js comments to sound student-like."""

fp = '/Users/ahanaprabhu/Desktop/TrackFresh-main/server.js'
with open(fp, 'r') as f:
    c = f.read()

# Replace header
c = c.replace(
    '''/*
============================================================================
FILE NAME: server.js
PURPOSE: Backend server for the FreshTrack app.
          Handles:
          - Serving static files (HTML, CSS, JS, images)
          - AI recipe generation via Mistral API
          - Price comparison (if Python script is available)
CONNECTION TO APP:
   - Frontend (script.js) calls server endpoints for AI recipes
   - Runs on localhost:3000
   - Environment variables for API keys (.env file)
============================================================================

PSEUDOCODE - How the server works:
1. Load environment variables from .env file
2. Create HTTP server to handle requests
3. Route /api/recipes -> AI recipe generation (Mistral API)
4. Route /api/prices -> Price comparison (Python script)
5. Route /* -> Serve static files from frontend directory
============================================================================
*/''',
    '''// server.js - backend for FreshTrack, runs on localhost:3000
   // handles AI recipe requests and serves the static HTML/CSS/JS files

/*
====================================================================
HOW THE SERVER WORKS - EXAM PSEUDOCODE:
====================================================================
1. LOAD environment variables from .env file
2. CREATE HTTP server to handle incoming requests
3. ROUTE "/api/recipes" to AI recipe generation
4. ROUTE "/api/prices" to price comparison via Python script
5. ROUTE "everything else" to static files
====================================================================
*/'''
)

# Replace SECTION comments
c = c.replace(
    '''/*
============================================================================
SECTION 1: ENVIRONMENT VARIABLES
Loads API keys from .env file.
============================================================================
*/''',
    '// load API keys and setup'
)
c = c.replace(
    '''/*
============================================================================
SECTION 2: HELPER FUNCTIONS
Utilities for JSON responses and body parsing.
============================================================================
*/''',
    '// helper functions'
)
c = c.replace(
    '''/*
============================================================================
SECTION 3: AI RECIPE GENERATION
Calls Mistral API to generate recipes based on user inventory.
============================================================================
*/''',
    '// AI recipe generation - calls Mistral API to make recipe suggestions'
)
c = c.replace(
    '''/*
============================================================================
SECTION 4: STATIC FILE SERVING
Serves HTML, CSS, JS, and image files.
============================================================================
*/''',
    '// serves static files when you visit a page'
)

with open(fp, 'w') as f:
    f.write(c)
print("Updated server.js comments!")
