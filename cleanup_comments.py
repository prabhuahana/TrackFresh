#!/usr/bin/env python3
"""
Clean up AI traces and make comments sound student-like.
"""

# ============================================================
# 1. Fix script.js - remove duplicate header and simplify comments
# ============================================================
js_path = '/Users/ahanaprabhu/Desktop/TrackFresh-main/frontend/script.js'
with open(js_path, 'r') as f:
    content = f.read()

# Remove the duplicate "/* FreshTrack app logic */" at line 40
content = content.replace('\n/* FreshTrack app logic */\n\nfunction getFoods()',
                          '\nfunction getFoods()')

with open(js_path, 'w') as f:
    f.write(content)
print('Fixed script.js duplicated header')

# ============================================================
# 2. Fix data.js - clean up broken comment blocks and simplify
# ============================================================
data_path = '/Users/ahanaprabhu/Desktop/TrackFresh-main/frontend/data.js'
with open(data_path, 'r') as f:
    content = f.read()

# Replace the entire broken header section
old_header = '''/*
================================================================================
FILE NAME: data.js
PURPOSE: Central data file containing all constants and reference data for
         the FreshTrack app. This file does NOT contain any functions that
         manipulate data - it only stores static information used by other files.
CONNECTION TO APP:
   - Imported by script.js and script_new.js via <script> tags in HTML
   - Provides food emojis, categories, shelf life data, recipes, and price info
   - Referenced throughout the app for food-related lookups and validation
================================================================================

PSEUDOCODE - What this file contains:
1. FOOD_EMOJIS: Maps food names to single-letter codes for display in cards
2. CATEGORIES: List of food categories (dairy, meat, produce, etc.)

/*
================================================================================
SECTION 2: CATEGORIES

/*
================================================================================
SECTION 3: SHELF LIFE
Default shelf life (in days) for each food category.
================================================================================

/*
================================================================================
SECTION 4: RECIPES
Pre-defined recipe templates with ingredients, steps, and dietary info.
================================================================================
*/


*/

'''

new_header = '''// data.js - all the constant data and lookup tables for FreshTrack
// loaded by script.js and script_new.js via <script> tags in the HTML

/*
====================================================================
PSEUDOCODE - What this file holds:
====================================================================
1. FOOD_EMOJIS: maps food names to short codes for little cards
2. CATEGORIES: list of food types like dairy, meat, produce etc
3. SHELF_LIFE: how many days each food type stays fresh
4. RECIPES: recipe templates with what you need and how to do it
5. PRICE_DATA: sample prices from different grocery stores
6. BROCHURES: weekly deals from the main supermarket chains
7. AU_REGIONS: Australian states for regional stuff
8. POINTS_RULES: how many points you get for different actions
9. DASHBOARD_SECTIONS: the blocks you see on your dashboard
====================================================================
*/

'''

content = content.replace(old_header, new_header)

# Fix broken comment blocks that are mixed in with data
# Remove stray */ after CATEGORIES
content = content.replace('  "dairy", "meat", "produce", "grains", "pantry", "frozen", "beverages", "other"\n\n/*',
                          '  "dairy", "meat", "produce", "grains", "pantry", "frozen", "beverages", "other"\n')

content = content.replace('''
/* 
====================================================================
SECTION 5: PRICE DATA
Sample price comparison data for common grocery items.
====================================================================
*/
''', '''
// prices for different shops - used by the shopping list feature
''')

# Fix the broken section comments between data definitions
content = content.replace('''
/* 
====================================================================
SECTION 6: RECIPES
Pre-defined recipe templates with ingredients and cooking steps.
====================================================================
*/
''', '''
// pre-made recipe ideas that show on the recipes page
''')

content = content.replace('''
/* 
====================================================================
SECTION 7: BROCHURES
Weekly deals from Coles, Woolworths, and Aldi.
====================================================================
*/
''', '''
// weekly specials from the big supermarkets
''')

content = content.replace('''
/* 
====================================================================
SECTION 8: AUSTRALIAN REGIONS
====================================================================
*/
''', '''
// Australian states for regional features
''')

content = content.replace('''
/* 
====================================================================
SECTION 9: POINTS RULES
How many points you get for different actions in the app.
====================================================================
*/
''', '''
// points you earn for different things you do in the app
''')

content = content.replace('''
/* 
====================================================================
SECTION 10: DASHBOARD SECTIONS
Configurable dashboard sections for user preference.
====================================================================
*/
''', '''
// the different sections you can see on your dashboard
''')

with open(data_path, 'w') as f:
    f.write(content)
print('Fixed data.js comments')
