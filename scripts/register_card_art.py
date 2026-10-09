"""Register finished image_gen assets without replacing existing artwork.

Usage: python3 scripts/register_card_art.py /path/to/jobs.json
Each job supplies id, source (local generated image), and prompt.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = {c['id']: c for c in json.loads((ROOT / 'data/original-cards.json').read_text())}
FOLDERS = {'occupation': 'occupations', 'minor': 'minor-cards'}
REGISTRIES = {'occupation': 'OCCUPATION_ARTWORK', 'minor': 'MINOR_ARTWORK'}


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text())
    manifests = {}
    for kind, folder in FOLDERS.items():
        path = ROOT / 'assets' / folder / 'manifest.json'
        manifests[kind] = json.loads(path.read_text()) if path.exists() else {
            'tool': 'Built-in image_gen',
            'model': 'Version is not exposed by the built-in tool.',
            'style': 'Original European pastoral watercolor and gouache; clear subjects, distinct actions, tools, buildings and scenery; readable HTML rules.',
            'assets': [],
        }
    for job in jobs:
        card = CATALOG[job['id']]
        kind = card['kind']
        manifest = manifests[kind]
        if any(a['id'] == card['id'] for a in manifest['assets']):
            continue
        source = Path(job['source'])
        if not source.is_file():
            raise FileNotFoundError(source)
        output = ROOT / 'assets' / FOLDERS[kind] / (card['id'] + '.jpg')
        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists():
            raise FileExistsError(f'Unregistered artwork requires review: {output}')
        if source.suffix.lower() in ('.jpg', '.jpeg'):
            shutil.copy2(source, output)
        else:
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '86',
                            '-Z', '960', str(source), '--out', str(output)],
                           check=True, stdout=subprocess.DEVNULL)
        manifest['assets'].append({'id': card['id'], 'name': card['name'],
                                   'file': output.name, 'prompt': job['prompt']})
        # Checkpoint each finished asset so an interrupted batch can be resumed.
        (output.parent / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    game_path = ROOT / 'game.js'
    game = game_path.read_text()
    counts = {}
    for kind, manifest in manifests.items():
        manifest['assets'].sort(key=lambda a: a['id'])
        ids = [a['id'] for a in manifest['assets']]
        assert len(ids) == len(set(ids))
        all_ids = [c['id'] for c in CATALOG.values() if c['kind'] == kind]
        assert set(ids).issubset(all_ids)
        assert all((ROOT / 'assets' / FOLDERS[kind] / a['file']).is_file() for a in manifest['assets'])
        manifest.update(total=len(all_ids), completed=len(ids), pending=[i for i in all_ids if i not in ids])
        path = ROOT / 'assets' / FOLDERS[kind] / 'manifest.json'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        registry = REGISTRIES[kind]
        statement = f'const {registry} = new Set(' + json.dumps(ids, separators=(',', ':')) + ');'
        game, changed = re.subn(r'const ' + registry + r' = new Set\(\[.*?\]\);', statement, game)
        assert changed == 1, f'Missing registry {registry}'
        counts[kind] = len(ids)
    game_path.write_text(game)
    readme = ROOT / 'README.md'
    text = readme.read_text()
    text = re.sub(r'^- 职业卡插画按批次接入，.*$',
                  f"- 卡面插画按批次接入，当前职业卡 **{counts['occupation']} / 168 张**、次要发展卡 **{counts['minor']} / 168 张**。图片与提示词保存在 `assets/occupations/manifest.json` 和 `assets/minor-cards/manifest.json`，`pending` 记录未制作卡号；每张采用独立田园手绘插画。",
                  text, flags=re.M)
    text = re.sub(r'^- 卡面插画按批次接入，.*$',
                  f"- 卡面插画按批次接入，当前职业卡 **{counts['occupation']} / 168 张**、次要发展卡 **{counts['minor']} / 168 张**。图片与提示词保存在 `assets/occupations/manifest.json` 和 `assets/minor-cards/manifest.json`，`pending` 记录未制作卡号；每张采用独立田园手绘插画。",
                  text, flags=re.M)
    readme.write_text(text)
    print(json.dumps(counts))


if __name__ == '__main__':
    main()
