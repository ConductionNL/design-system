#!/usr/bin/env python3
"""Flatten a .dc.html board into a plain, standalone HTML document.

Adapted from the school-design preview.py. It is not the real canvas runtime: it runs the board's
renderVals() in node, then expands sc-for, sc-if, {{ holes }} and dc-import itself. Good enough to show
layout, colour and type exactly as drawn.

Used by build.py; can also be run by hand:
    flatten.py <set-dir> <Board> [--tokenize] > Board.html
"""
import json
import pathlib
import re
import subprocess
import sys
from html.parser import HTMLParser

VOID = {'meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'col', 'wbr'}

# Zuiddrecht literal -> theme role. Matched case-insensitively, in CSS only (style attributes,
# <style> blocks, svg fill/stroke/stop-color attributes), never in visible text.
ROLES = {
    '#3669a5': 'primary',
    '#234a78': 'primary-deep',
    '#eaf0f7': 'primary-light',
    '#cc0000': 'accent',
    '#a30000': 'accent-deep',
    '#1a1a1a': 'site-ink',
    '#4a4a4a': 'site-muted',
    '#d3d8df': 'site-border',
    '#f4f6f9': 'site-ground',
    '#1b1c1d': 'work-ink',
    '#3d4047': 'work-text',
    '#5e6168': 'work-muted',
    '#e4e6ea': 'work-line',
    '#eef0f3': 'work-soft',
    '#f5f6f8': 'work-ground',
    '#f0f1f3': 'work-chip',
    '#c4c7cb': 'work-field',
}
HEX = re.compile(r'(?<![\w-])#(' + '|'.join(h[1:] for h in ROLES) + r')(?![0-9a-fA-F])', re.I)
FONT = re.compile(r"""(?<!var\(--sc-font, )(['"])Fira Sans\1""")
SVG_PAINT = ('fill', 'stroke', 'stop-color')


def tokenize_css(css):
    """Wrap every role colour in var(--sc-<role>, <literal>) and the body font in var(--sc-font, ...)."""
    css = HEX.sub(lambda m: f'var(--sc-{ROLES["#" + m.group(1).lower()]}, {m.group(0)})', css)
    return FONT.sub(lambda m: f"var(--sc-font, 'Fira Sans')", css)


def esc(value):
    return str(value).replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')


class Node:
    def __init__(self, tag=None, attrs=None, text=None):
        self.tag, self.attrs, self.text, self.kids = tag, attrs or [], text, []


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.root = Node('root')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].kids.append(n)
        if tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        n = Node(tag, attrs)
        n.selfclose = True
        self.stack[-1].kids.append(n)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        # pop to the matching open tag, tolerate stray end tags
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        self.stack[-1].kids.append(Node(text=data))

    def handle_entityref(self, name):
        self.stack[-1].kids.append(Node(text=f'&{name};'))

    def handle_charref(self, name):
        self.stack[-1].kids.append(Node(text=f'&#{name};'))


HOLE = re.compile(r'\{\{(.*?)\}\}')


def look(path, ctx):
    path = path.strip()
    if path in ('true', 'false'):
        return path == 'true'
    cur = ctx
    for part in path.split('.'):
        if isinstance(cur, dict):
            cur = cur.get(part)
        elif isinstance(cur, list) and part.isdigit():
            cur = cur[int(part)] if int(part) < len(cur) else None
        else:
            return None
    return cur


def fill(s, ctx):
    return HOLE.sub(lambda m: '' if look(m.group(1), ctx) is None else str(look(m.group(1), ctx)), s)


def raw(value, ctx):
    m = HOLE.fullmatch((value or '').strip())
    return look(m.group(1), ctx) if m else fill(value or '', ctx)


class Flattener:
    """One per set. blobs maps '/_blob/<id>' to a logo role (logo, logo-wit, emblem, ...)."""

    def __init__(self, src, blobs, asset_prefix, tokenize=False, link_name=None):
        self.src = pathlib.Path(src)
        self.blobs = blobs
        self.asset_prefix = asset_prefix  # e.g. '../assets/zuiddrecht/'
        self.tokenize = tokenize
        self.link_name = link_name or (lambda board: board)  # board name -> output file stem
        self.cache = {}

    # -- renderVals in node -------------------------------------------------
    def vals(self, file, props):
        text = (self.src / file).read_text()
        s = re.search(r"data-props='(.*?)'>\n(.*?)</script>", text, re.S)
        if not s:
            return {}, text
        declared = json.loads(s.group(1).replace('&amp;', '&').replace('&#39;', "'"))
        defaults = {k: v.get('default') for k, v in declared.items() if isinstance(v, dict) and 'default' in v}
        js = ('class DCLogic{constructor(p){this.props=p;this.state={}} setState(){} forceUpdate(){}}\n' + s.group(2) +
              '\nconst c=new Component(JSON.parse(process.argv[1]));if(c.state===undefined)c.state={};'
              'process.stdout.write(JSON.stringify(c.renderVals(),(k,v)=>typeof v==="function"?undefined:v))')
        r = subprocess.run(['node', '-e', js, json.dumps({**defaults, **props})], capture_output=True, text=True, timeout=60)
        if r.returncode:
            raise RuntimeError(f'{file}: {r.stderr[-400:]}')
        return json.loads(r.stdout), text

    # -- rendering ----------------------------------------------------------
    def css(self, s):
        return tokenize_css(s) if self.tokenize else s

    def render(self, node, ctx, head, parent=None):
        if node.tag is None:
            text = fill(node.text, ctx) if '{{' in node.text else node.text
            return self.css(text) if parent == 'style' else text
        a = dict(node.attrs)
        kids = lambda c=ctx: ''.join(self.render(k, c, head, node.tag) for k in node.kids)  # noqa: E731
        if node.tag == 'root':
            return kids()
        if node.tag == 'helmet':
            block = kids().strip()
            if block and block not in head:
                head.append(block)
            return ''
        if node.tag == 'sc-if':
            return kids() if raw(a.get('value'), ctx) else ''
        if node.tag == 'sc-for':
            items = raw(a.get('list'), ctx) or []
            return ''.join(kids({**ctx, a.get('as', 'item'): it, '$index': i}) for i, it in enumerate(items))
        if node.tag == 'dc-import':
            props = {re.sub(r'-(\w)', lambda m: m.group(1).upper(), k): raw(v, ctx)
                     for k, v in node.attrs if k not in ('name', 'hint-size')}
            return self.page(a['name'] + '.dc.html', props, head)
        parts, extra_style, logo = [], [], None
        for k, v in node.attrs:
            if v is None:
                parts.append([k, None])
                continue
            val = raw(v, ctx)
            if k in ('checked', 'disabled', 'selected', 'open', 'hidden', 'required', 'readonly'):
                if val is False or val == 'false' or val is None:
                    continue
                parts.append([k, None])
                continue
            val = '' if val is None else str(val)
            if k == 'src' and val in self.blobs:
                logo = self.blobs[val]
                val = f'{self.asset_prefix}{logo}.svg'
            elif k == 'href' and val.endswith('.dc.html') and '/' not in val:
                val = self.link_name(val[:-8]) + '.html'
            elif k == 'style':
                val = self.css(val)
            elif self.tokenize and k in SVG_PAINT and HEX.fullmatch(val.strip()):
                extra_style.append(f'{k}:{tokenize_css(val.strip())}')
            parts.append([k, val])
        if extra_style:
            st = next((p for p in parts if p[0] == 'style'), None)
            if st is None:
                parts.append(['style', ';'.join(extra_style)])
            else:
                st[1] = (st[1].rstrip().rstrip(';') + ';' if st[1].strip() else '') + ';'.join(extra_style)
        if logo and self.tokenize:
            parts.append(['data-sc-logo', logo])
        attrs = ' '.join(k if v is None else f'{k}="{esc(v)}"' for k, v in parts)
        head_tag = f'<{node.tag}{" " if attrs else ""}{attrs}>'
        if node.tag in VOID:
            return head_tag
        if getattr(node, 'selfclose', False):
            return head_tag + f'</{node.tag}>'
        return head_tag + kids() + f'</{node.tag}>'

    def page(self, file, props, head):
        v, text = self.vals(file, props)
        body = re.search(r'<x-dc>(.*)</x-dc>', text, re.S)
        if not body:
            raise RuntimeError(f'{file}: no <x-dc> block')
        t = Tree()
        t.feed(body.group(1))
        t.close()
        return self.render(t.root, v, head)

    def document(self, board, title, width, extra_head=''):
        """A complete standalone HTML document for one board."""
        head = []
        body = self.page(board + '.dc.html', {}, head)
        seen = set()

        def once(m):  # every helmet repeats the font link and body{margin:0}; keep the first
            if m.group(0) in seen:
                return ''
            seen.add(m.group(0))
            return m.group(0)
        head = [re.sub(r'<link [^>]*>\n?|body\{margin:0\}\n?', once, h) for h in head]
        return (
            '<!doctype html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{esc(title)}</title>\n'
            '<style>html,body{margin:0;padding:0}body{background:#ffffff}'
            f'.sc-board{{width:{width}px;position:relative}}</style>\n'
            + '\n'.join(head) + '\n' + extra_head +
            f'</head>\n<body>\n<div class="sc-board" data-board="{esc(board)}">{body}</div>\n</body>\n</html>\n'
        )


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    src = pathlib.Path(args[0])
    blobs = json.loads((src / 'blobs.json').read_text()) if (src / 'blobs.json').exists() else {}
    f = Flattener(src, blobs, f'../assets/{src.name}/', tokenize='--tokenize' in sys.argv)
    sys.stdout.write(f.document(args[1], args[1], 1440))
