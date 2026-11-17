"""Tách một phần Basecoat (MIT) cho Hôm Nay Nấu Gì: token + btn, card, badge, tabs.
Đổi tên biến thể sang lớp sẵn có của web để không phải sửa markup."""
import re, sys
SRC = sys.argv[1]; OUT = sys.argv[2]
s = re.sub(r'/\*[\s\S]*?\*/', '', open(SRC, encoding='utf-8').read())
s = re.sub(r'^@layer [a-z, ]+;', '', s, flags=re.M)

def blocks(t):
    out = []; d = 0; st = 0; q = None
    for k, ch in enumerate(t):
        if q:
            if ch == q: q = None
            continue
        if ch in "'\"": q = ch; continue
        if ch == '{': d += 1
        elif ch == '}':
            d -= 1
            if d == 0: out.append(t[st:k + 1].strip()); st = k + 1
    return out

top = blocks(s)
def inner(b): return b.split('{', 1)[1].rsplit('}', 1)[0]

theme = [b for b in top if b.startswith('@layer theme')][0]
comps = [b for b in top if b.startswith('@layer components')]
big = max(comps, key=len)
props = [b for b in top if b.startswith('@property')]

KEEP = re.compile(r"^\.(btn|card|tabs)\b")
DROP = re.compile(r"\.card(\[data-size='sm'\])? > |\.card > section|tabpanel|data-size='(xs|sm|icon-xs|icon-sm|icon-lg)'|data-variant='(link|destructive)'|aria-orientation='vertical'|(?<!:not\()\[data-variant='line'\]")
rules = []
for b in [inner(x) for x in comps if x is not big] + [inner(big)]:
    for r in blocks(b):
        sel = r.split('{', 1)[0].strip()
        if not KEEP.match(sel) or sel == '.tabs': continue  # khung .tabs (dọc/ngang) không dùng: web chỉ có .seg
        parts = [p.strip() for p in sel.split(',') if not DROP.search(p)]
        if not parts: continue
        rules.append(', '.join(parts) + ' {' + r.split('{', 1)[1])

css = '\n'.join(rules)
# Bỏ khối lồng không dùng trên web (trạng thái lỗi ô nhập, icon chèn, gạch chân tab, svg size-*, aria-expanded)
BO = ("&[aria-invalid", "&:has(*:is([data-icon", "&::after", "& svg:not([class*='size-'])", "&[aria-expanded", "&:has(>img", "&>img", "> header", "> footer", "&:active")
def bo_khoi(t):
    out = []; k = 0
    while k < len(t):
        hit = next((b for b in BO if t.startswith(b, k)), None)
        if hit:
            j = t.index('{', k); d = 0
            for m in range(j, len(t)):
                if t[m] == '{': d += 1
                elif t[m] == '}':
                    d -= 1
                    if d == 0: break
            k = m + 1; continue
        out.append(t[k]); k += 1
    return ''.join(out)
css = bo_khoi(css)
# Bỏ dòng dự phòng cho trình duyệt chưa có color-mix (mọi trình duyệt từ 2023 đều có): giữ đúng giá trị trong @supports
css = re.sub(r"([\w-]+):[^;{}]+;\s*@supports \(color: color-mix\(in lab, red, red\)\) \{\s*\1:([^;{}]+);\s*\}", r"\1:\2;", css)
css = css.replace("-webkit-user-select: none;", "")
# &:is(dark *) chỉ còn rỗng thì bỏ
for _ in range(3):
    css = re.sub(r"&:is\(html\.dark \*\)\s*\{\s*\}", "", css)
    css = re.sub(r"[^{};]+\{\s*\}", "", css)
# Ánh xạ sang lớp sẵn có của web
css = (css
    .replace(".btn:not([data-variant])", ".btn:not(.ghost):not(.outline):not(.plain)")
    .replace(".btn[data-variant='secondary']", ".btn.ghost")
    .replace(".btn[data-variant='outline']", ".btn.outline")
    .replace(".btn[data-variant='ghost']", ".btn.plain")
    .replace(".btn[data-variant='primary']", ".btn.primary")
    .replace(".btn:not([data-size])", ".btn:not(.big):not(.icon)")
    .replace(".btn[data-size='default']", ".btn.default")
    .replace(".btn[data-size='lg']", ".btn.big")
    .replace(".btn[data-size='icon']", ".btn.icon")
    .replace(".badge:not([data-variant])", ".badge:not(.outline):not(.ghost)")
    .replace(".badge[data-variant='secondary']", ".badge.soft")
    .replace(".badge[data-variant='outline']", ".badge.outline")
    .replace(".badge[data-variant='ghost']", ".badge.ghost")
    .replace(".badge[data-variant='primary']", ".badge.primary")
    .replace(".tabs > [role='tablist']:not(.line)", ".seg")
    .replace(".tabs > [role='tablist']:not([data-variant='line'])", ".seg")
    .replace(".tabs > [role='tablist']", ".seg")
    .replace("html.dark", "html[data-theme='dark']")
    .replace(".dark", "[data-theme='dark']")
    .replace("var(--color-muted)", "var(--color-sc-muted)"))

# Biến theme cần dùng (lặp tới khi đủ)
tdecl = dict(re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', inner(inner(theme)) if inner(theme).strip().startswith(':root') else inner(theme)))
need, seen = set(re.findall(r'var\((--[\w-]+)', css)), set()
while need - seen:
    v = (need - seen).pop(); seen.add(v)
    if v in tdecl: need |= set(re.findall(r'var\((--[\w-]+)', tdecl[v]))
theme_css = ':root {\n  --color-sc-muted: var(--sc-muted);\n' + ''.join(f'  {k}: {tdecl[k]};\n' for k in sorted(seen) if k in tdecl and k not in ('--font-sans', '--font-mono')) + '}\n'
pdefs = [p for p in props if re.match(r'@property (--[\w-]+)', p).group(1) in seen]
# @property không có initial-value chỉ để chặn kế thừa; bỏ cho nhẹ (không ảnh hưởng hiển thị trên web này)
pdefs = [p for p in pdefs if 'initial-value' in p]
css = re.sub(r'oklch\(0\.708 0 0\)', 'var(--ring)', css)
head = """/*! Một phần Basecoat 1.1.0 (https://basecoat.ui, MIT License, Copyright (c) 2025 Ronan Berder),
   biên dịch bằng Tailwind CSS v4 (MIT). Chỉ lấy: btn, card, tabs. Biến thể đổi sang lớp của web:
   .btn.ghost = secondary, .btn.outline, .btn.plain = ghost, .btn.big = lg, .btn.icon; .seg = tabs > [role=tablist].
   Token màu shadcn (--background, --primary...) đặt trong style.css. Tạo lại: python3 scripts/basecoat-tach.py basecoat.cdn.css src/assets/basecoat.css. --muted của shadcn đổi tên --sc-muted (web đã dùng --muted cho chữ phụ). */
"""
open(OUT, 'w', encoding='utf-8').write(head + '\n'.join(pdefs) + '\n' + theme_css + '@layer components {\n' + css + '\n}\n')
print(len(head + css), 'vars', len(seen))
