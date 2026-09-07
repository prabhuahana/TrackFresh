#!/usr/bin/env python3
"""Clean up server.js - remove broken comment, rename function, simplify."""

fp = '/Users/ahanaprabhu/Desktop/TrackFresh-main/server.js'

with open(fp, 'r') as f:
    content = f.read()

# 1. Remove the broken comment block inside cleanRecipes function
broken = '/*\n===============================================================================\nSECTION 3: AI RECIPE GENERATION\nCalls Mistral API to generate recipes based on user inventory.\n===============================================================================\n*/\n'
content = content.replace(broken, '')

# 2. Rename recipePrompt to buildRecipeMessage
content = content.replace('function recipePrompt(', 'function buildRecipeMessage(')
content = content.replace('content: recipePrompt(inventory, body.weather)',
                          'content: buildRecipeMessage(inventory, body.weather)')

with open(fp, 'w') as f:
    f.write(content)
print('Cleaned server.js!')
