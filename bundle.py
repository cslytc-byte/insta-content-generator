import os

dir_path = os.path.dirname(os.path.abspath(__file__))
index_file = os.path.join(dir_path, 'index.html')
css_file = os.path.join(dir_path, 'styles.css')
js_file = os.path.join(dir_path, 'app.js')
out_file = os.path.join(dir_path, 'instacopy_standalone.html')

with open(index_file, 'r', encoding='utf-8') as f:
    html = f.read()

with open(css_file, 'r', encoding='utf-8') as f:
    css = f.read()

with open(js_file, 'r', encoding='utf-8') as f:
    js = f.read()

html = html.replace('<link rel="stylesheet" href="styles.css" />', f'<style>\n{css}\n</style>')
html = html.replace('<script src="app.js"></script>', f'<script>\n{js}\n</script>')

with open(out_file, 'w', encoding='utf-8') as f:
    f.write(html)

print('Standalone bundle created at:', out_file)
