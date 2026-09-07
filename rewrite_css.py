#!/usr/bin/env python3
"""Rewrite style.css comments to sound student-like."""

fp = '/Users/ahanaprabhu/Desktop/TrackFresh-main/frontend/style.css'
with open(fp, 'r') as f:
    c = f.read()

# Replace header
c = c.replace(
    '''/*
============================================================================
FILE NAME: style.css
PURPOSE: Main stylesheet for the FreshTrack app.
          Contains all CSS rules for:
          - Colour scheme (light and dark themes)
          - Layout (sidebar, dashboard cards, login pages)
          - Responsive design (mobile/tablet/desktop)
          - AI recipe card styling
CONNECTION TO APP:
   - Linked to all HTML pages via <link rel="stylesheet" href="style.css">
   - Uses CSS variables for easy theming
============================================================================

PSEUDOCODE - How the styles work:
1. Define CSS variables for colour schemes (light and dark modes)
2. Create base styles for body, headings, and text
3. Style the sidebar navigation and layout containers
4. Build card designs for inventory, recipes, and shopping list
5. Add responsive breakpoints for mobile screens
6. Style form inputs and error messages
============================================================================
*/''',
    '''/* style.css - all the colours, layouts, and designs for FreshTrack */'''
)

# Replace SECTION comments
c = c.replace(
    '''/*
============================================================================
SECTION 1: CSS VARIABLES (THEME COLOURS)
Defines colour palette for both light and dark themes.
CSS custom properties allow easy colour customization.
============================================================================
*/''',
    '// colour variables for light and dark mode'
)
c = c.replace(
    '''/*
============================================================================
SECTION 2: LAYOUT
Main layout structure using flexbox.
============================================================================
*/''',
    '// main page layout'
)
c = c.replace(
    '''/*
============================================================================
SECTION 3: SIDEBAR NAVIGATION
Styling for the sidebar navigation menu.
============================================================================
*/''',
    '// sidebar menu styling'
)
c = c.replace(
    '''/*
============================================================================
SECTION 4: LOGIN PAGE STYLES
Styling for the login and signup pages.
============================================================================
*/''',
    '// login and signup page styling'
)
c = c.replace(
    '''/*
============================================================================
SECTION 5: MOBILE RESPONSIVE STYLES
Styles for screens 768px and smaller.
Converts sidebar to bottom navigation bar.
============================================================================
*/''',
    '// mobile styling for smaller screens'
)
c = c.replace(
    '''/*
============================================================================
SECTION 6: AI RECIPE CARD STYLING
Styles for the recipe cards from the AI tool.
============================================================================
*/''',
    '// styling for recipe cards'
)

with open(fp, 'w') as f:
    f.write(c)
print("Updated style.css comments!")
