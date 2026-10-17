#!/usr/bin/env python3
"""Derive a screens design system's --sc-* variables from a thematiq NL Design System token set.

    python3 scripts/screens/sc_from_thematiq.py <system-id> [<rijkshuisstijl.css path or URL>]

Reads the set's `--nldesign-*` declarations (by default thematiq's css/tokens/<set>.css on its
development branch, where `set` is the system's `set` field in design-systems.json), maps them onto
the screens' roles with the same correspondences thematiq's css/systems/nldesign/overrides.css uses
for a real Nextcloud instance (primary to the primary element, text to the main text, text-muted to
the max-contrast text, border to the border, border-dark to the control border, the radius scale to
the radius scale), and writes the result into the system's `vars` in preview/screens/design-systems.json.
Nothing is typed by hand: change the token in thematiq, run this, commit the JSON.
"""
import json
import pathlib
import re
import sys
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
DS_JSON = HERE.parent.parent / 'preview' / 'screens' / 'design-systems.json'
THEMATIQ_RAW = 'https://raw.githubusercontent.com/ConductionNL/thematiq/development/css/tokens/{set}.css'

# screens role -> thematiq token (the fallback token is read when the first is not declared)
MAPPING = {
    '--sc-primary': ['--nldesign-color-primary'],
    '--sc-primary-deep': ['--nldesign-color-primary-hover'],
    '--sc-primary-light': ['--nldesign-color-primary-light'],
    '--sc-accent': ['--nldesign-color-accent', '--nldesign-color-primary'],
    '--sc-accent-deep': ['--nldesign-color-accent-text', '--nldesign-color-primary-hover'],
    '--sc-site-ink': ['--nldesign-color-text'],
    '--sc-site-muted': ['--nldesign-website-color-text-muted', '--nldesign-color-text-muted'],
    '--sc-site-border': ['--nldesign-color-border'],
    '--sc-site-ground': ['--nldesign-color-surface', '--nldesign-color-background-hover'],
    '--sc-work-ink': ['--nldesign-color-text'],
    '--sc-work-text': ['--nldesign-color-text'],
    '--sc-work-muted': ['--nldesign-color-text-muted'],
    '--sc-work-line': ['--nldesign-color-border'],
    '--sc-work-soft': ['--nldesign-color-surface', '--nldesign-color-background-hover'],
    '--sc-work-ground': ['--nldesign-component-content-surface-background-color', '--nldesign-color-surface'],
    '--sc-work-chip': ['--nldesign-color-background-hover'],
    '--sc-work-field': ['--nldesign-color-border-dark'],
    '--sc-link': ['--nldesign-color-link'],
    '--sc-radius': ['--nldesign-website-border-radius', '--nldesign-border-radius-small'],
    '--sc-radius-lg': ['--nldesign-website-border-radius-large', '--nldesign-border-radius-large'],
}


def declarations(css: str) -> dict:
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    return {m.group(1): m.group(2).strip() for m in re.finditer(r'(--[\w-]+)\s*:\s*([^;]+);', css)}


def read_source(source: str) -> str:
    if re.match(r'https?://', source):
        with urllib.request.urlopen(source, timeout=30) as r:  # noqa: S310 (a fixed GitHub raw URL)
            return r.read().decode('utf-8')
    return pathlib.Path(source).read_text(encoding='utf-8')


def font_family(value: str) -> str:
    first = value.split(',')[0].strip()
    return f"{first}, system-ui, sans-serif"


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    system_id = sys.argv[1]
    data = json.loads(DS_JSON.read_text(encoding='utf-8'))
    system = data['systems'].get(system_id)
    if system is None:
        sys.exit(f'{system_id}: not in {DS_JSON}')
    token_set = system.get('set', system_id)
    source = sys.argv[2] if len(sys.argv) > 2 else THEMATIQ_RAW.format(set=token_set)
    tokens = declarations(read_source(source))
    vars_out, missing = {}, []
    for role, names in MAPPING.items():
        value = next((tokens[n] for n in names if n in tokens), None)
        if value is None:
            missing.append((role, names))
            continue
        vars_out[role] = value.lower() if value.startswith('#') else value
    if missing:
        for role, names in missing:
            print(f'{role}: none of {names} declared in {source}', file=sys.stderr)
        return 1
    system['vars'] = vars_out
    if '--nldesign-font-family' in tokens:
        family = font_family(tokens['--nldesign-font-family'])
        system.setdefault('font', {})
        system['font']['family'] = family
        system['font']['heading'] = family
    system['source'] = {'thematiq': token_set, 'generator': 'scripts/screens/sc_from_thematiq.py'}
    DS_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'{system_id}: {len(vars_out)} variables from {source}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
