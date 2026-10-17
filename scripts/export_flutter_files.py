import os

with open('src/components/FlutterSourceCodeModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

os.makedirs('flutter_wallet_identity_verify/lib/controllers', exist_ok=True)
os.makedirs('flutter_wallet_identity_verify/lib/services', exist_ok=True)
os.makedirs('flutter_wallet_identity_verify/lib/screens', exist_ok=True)

# Simple non-regex string search for each entry
pos = 0
count = 0
while True:
    path_idx = content.find("path: '", pos)
    if path_idx == -1:
        break
    path_start = path_idx + len("path: '")
    path_end = content.find("'", path_start)
    rel_path = content[path_start:path_end]

    code_idx = content.find("code: `", path_end)
    if code_idx == -1:
        break
    code_start = code_idx + len("code: `")
    code_end = content.find("`,\n  },", code_start)
    if code_end == -1:
        break

    raw_code = content[code_start:code_end]
    clean_code = raw_code.replace('\\`', '`').replace('\\${', '${').replace('\\$', '$').replace('\\\\', '\\')

    full_path = os.path.join('flutter_wallet_identity_verify', rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as out:
        out.write(clean_code)
    print(f'Wrote {full_path}')
    count += 1
    pos = code_end + 5

print(f'Total files written: {count}')
