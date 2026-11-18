#!/usr/bin/env python3
"""Package 트쌤 (T-SAM) for a claude.ai artifact (the version both people open from one link).

claude.ai wraps the page in its own <!doctype html><head><body>, so the page file holds only the
title, stylesheets, the app root and scripts. Everything else is published next to it under the
same relative paths. Left out: the service worker, the web manifest and the Tesseract engine
(inside claude.ai the InBody sheet is read by Claude instead).

usage: python3 tools/build_artifact.py <out_dir>
prints the {published path: source path} map used for the publish call as JSON.
"""
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist'))

index = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
scripts = re.findall(r'<script src="([^"]+)"></script>', index)

page = ['<title>트쌤</title>',
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        # Chakra Petch (numbers) from Google Fonts; Wanted Sans (Korean text) is published with the page
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&display=swap">',
        '<link rel="stylesheet" href="vendor/fonts/wanted-sans/WantedSansVariable.css">',
        '<link rel="stylesheet" href="css/app.css">',
        '<div id="app"></div>']
page += ['<script src="%s"></script>' % s for s in scripts]

files = {}
def add(rel):
    src = os.path.join(ROOT, rel)
    dst = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    files[rel] = rel

MARK = os.path.join(OUT, '.mypt-build')
if os.path.isdir(OUT) and os.listdir(OUT):
    # only ever clear a folder this script made before
    if not os.path.isfile(MARK) or os.path.commonpath([OUT, ROOT]) == OUT:
        sys.exit('refusing to clear %s: not an earlier MY PT build folder' % OUT)
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)
open(MARK, 'w').write('MY PT artifact build output (safe to delete)\n')
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write('\n'.join(page) + '\n')

add('css/app.css')
for s in scripts:
    add(s)
add('vendor/fonts/wanted-sans/WantedSansVariable.css')
for f in sorted(os.listdir(os.path.join(ROOT, 'vendor/fonts/wanted-sans/woff2'))):
    add('vendor/fonts/wanted-sans/woff2/' + f)
for d in ('assets/img/ex', 'assets/img/food', 'assets/img/trainers'):
    for f in sorted(os.listdir(os.path.join(ROOT, d))):
        if f.endswith('.webp'):
            add(d + '/' + f)

size = sum(os.path.getsize(os.path.join(OUT, p)) for p in files) + os.path.getsize(os.path.join(OUT, 'index.html'))
print(json.dumps(files, ensure_ascii=False, indent=0))
print('files: %d (+ index.html), total %.1f MB' % (len(files), size / 1e6), file=sys.stderr)
if len(files) > 254:
    print('WARNING: more than 255 files in one publish; split it over two publishes', file=sys.stderr)
