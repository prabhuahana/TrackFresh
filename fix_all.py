import re, glob, os

base = '/Users/ahanaprabhu/Desktop/TrackFresh-main'

# Files to process
files = glob.glob(base + '/frontend/*.html') + glob.glob(base + '/frontend/*.js') + glob.glob(base + '/frontend/*.css') + [base + '/server.js', base + '/frontend/data.js']

for fp in files:
    if not os.path.isfile(fp):
        continue
    with open(fp, 'r') as f:
        content = f.read()
    original = content
    
    # Remove formal pseudocode comment blocks (multi-line blocks with ==== or ----)
    # Remove blocks like:
    # /*
    # ====================================================================
    # PSEUDOCODE - ...
    # ====================================================================
    # */
    content = re.sub(r'/\*\s*\n[=\-]{10,}.*?\*/', '', content, flags=re.DOTALL)
    
    # Remove single-line formal comments
    content = re.sub(r'//\s*PSEUDOCODE.*\n', '', content)
    content = re.sub(r'//\s*EXAM.*\n', '', content)
    content = re.sub(r'//\s*HIGH SCHOOL.*\n', '', content)
    content = re.sub(r'//\s*VALIDATION FUNCTIONS.*\n', '', content)
    content = re.sub(r'//\s*HOW THE.*\n', '', content)
    content = re.sub(r'//\s*DATA STORAGE.*\n', '', content)
    content = re.sub(r'//\s*MAIN PROGRAM.*\n', '', content)
    content = re.sub(r'//\s*INITIALIZATION.*\n', '', content)
    content = re.sub(r'//\s*FUNCTION:.*\n', '', content)
    content = re.sub(r'//\s*PURPOSE:.*\n', '', content)
    
    # Fix FreshTrack -> TrackFresh in user-facing text (but not in code/variable names)
    content = content.replace('FreshTrack', 'TrackFresh')
    content = content.replace('Fresh Track', 'TrackFresh')
    
    if content != original:
        with open(fp, 'w') as f:
            f.write(content)
        print(f'Fixed: {os.path.basename(fp)}')
    else:
        print(f'No changes: {os.path.basename(fp)}')

print('Done!')
