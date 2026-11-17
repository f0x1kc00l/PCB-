"""Builds appendix F (book map) and D (common errors) from lesson frontmatter / <Mistakes> blocks.
Usage (из корня проекта): python3 scripts/gen_appendix.py .
"""
import os
import re
import sys
import json

ROOT = sys.argv[1]
DOCS = os.path.join(ROOT, 'src', 'content', 'docs')


CH = {1: 'Основы электроники', 2: 'Транзисторы', 3: 'Полевые транзисторы',
      4: 'Обратная связь и операционные усилители', 5: 'Активные фильтры и генераторы',
      6: 'Стабилизаторы напряжения и источники питания'}

def frontmatter(text):
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    return m.group(1) if m else ''

def field(fm, name):
    m = re.search(rf'^{name}:\s*"?(.*?)"?\s*$', fm, re.M)
    return m.group(1) if m else ''

lessons = []
for d in sorted(os.listdir(DOCS)):
    if not re.match(r'm\d\d-', d):
        continue
    for f in sorted(os.listdir(os.path.join(DOCS, d))):
        if not f.endswith(('.md', '.mdx')):
            continue
        p = os.path.join(DOCS, d, f)
        text = open(p, encoding='utf-8').read()
        fm = frontmatter(text)
        label = re.search(r'^\s+label:\s*"?(.*?)"?\s*$', fm, re.M)
        lessons.append({
            'id': f'{d}/{os.path.splitext(f)[0]}',
            'dir': d,
            'label': label.group(1) if label else field(fm, 'title'),
            'fm': fm,
            'text': text,
        })

# ---------- F. Book map ----------
sec_titles = {k: tuple(v) for k, v in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sections_full.json'), encoding='utf-8')).items()}

refs = {}  # (book, sec) -> list of lesson links
for l in lessons:
    for m in re.finditer(r'\{([^{}]*\bch:\s*\d[^{}]*)\}', l['fm']):
        body = m.group(1)
        bk = re.search(r'book:\s*"?(\w+)', body)
        bk = bk.group(1) if bk else 'horowitz'
        ch = int(re.search(r'ch:\s*(\d+)', body).group(1))
        sec = re.search(r'sec:\s*"([\d.]+)"', body)
        page = re.search(r'page:\s*(\d+)', body)
        key = sec.group(1) if sec else f'{ch}.p{page.group(1) if page else "?"}'
        refs.setdefault((bk, key), [])
        link = f'[{l["label"]}](../../{l["id"]}/)'
        if link not in refs[(bk, key)]:
            refs[(bk, key)].append(link)

def sort_key(k):
    a, b = k.split('.', 1)
    return (int(a), 999 if b.startswith('p') else int(b))

MAL = {k: tuple(v) for k, v in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'maloratsky_sections.json'), encoding='utf-8')).items()}

lines = ['---', 'title: "F. Карта учебника"',
         'description: "Какие параграфы учебников Хоровица — Хилла и Малорацкого используются в каких уроках курса."',
         'sidebar:', '  order: 6', '---', '',
         'Основной учебник: П. Хоровиц, У. Хилл. *Искусство схемотехники*, т. 1. — М.: Мир, 1993. Номера страниц совпадают со страницами PDF-файла. Второй учебник (модуль 12) — Л. Г. Малорацкий, «Микроминиатюризация элементов и устройств СВЧ», в конце страницы.',
         '', 'Таблица собрана автоматически из ссылок `book` в уроках (скрипт `scripts/gen_appendix.py`).', '']
cur = None
for k in sorted((k for b, k in refs if b == 'horowitz'), key=sort_key):
    ch = int(k.split('.')[0])
    if ch != cur:
        cur = ch
        lines += ['', f'## Глава {ch}. {CH.get(ch, "")}', '', '| Параграф | Страница | Уроки курса |', '|---|---|---|']
    if k.split('.', 1)[1].startswith('p'):
        title, page = '(без номера параграфа)', k.split('p')[1]
    else:
        page, t = sec_titles.get(k, ('', ''))
        title = f'§{k} {t}'.strip()
    lines.append(f'| {title} | {page} | {"<br />".join(refs[("horowitz", k)])} |')
lines += ['', 'Главы 1–6 — это весь первый том. Цифровая техника и микроконтроллеры (тома 2–3) в курсе опираются на даташиты и документацию производителей.']
mal = sorted((k for b, k in refs if b == 'maloratsky'), key=sort_key)
if mal:
    lines += ['', '## Малорацкий. Микроминиатюризация элементов и устройств СВЧ', '',
              'Малорацкий Л. Г. — М.: Сов. радио, 1976. Второй учебник курса, используется в модуле 12. Страницы — книжные (страница PDF на 1 больше).', '',
              '| Параграф | Страница | Уроки курса |', '|---|---|---|']
    for k in mal:
        if k.split('.', 1)[1].startswith('p'):
            title, page = '(введение и общие разделы)', k.split('p')[1]
        else:
            page, t = MAL.get(k, ('', ''))
            title = f'§{k} {t}'.strip()
        lines.append(f'| {title} | {page} | {"<br />".join(refs[("maloratsky", k)])} |')
lines += ['']
open(os.path.join(DOCS, 'appendix', '06-book-map.md'), 'w', encoding='utf-8').write('\n'.join(lines))

# ---------- D. Common errors ----------
rows = []
for l in lessons:
    for block in re.findall(r'<Mistakes\s+items=\{\[(.*?)\]\}\s*/>', l['text'], re.S):
        for item in re.finditer(r"problem:\s*'((?:[^'\\]|\\.)*)'.*?fix:\s*'((?:[^'\\]|\\.)*)'", block, re.S):
            rows.append((l['dir'], l['label'], l['id'], item.group(1).replace("\\'", "'"), item.group(2).replace("\\'", "'")))

mods = json.loads(json.dumps({}))
lines = ['---', 'title: "D. Типичные ошибки и решения"',
         'description: "Сводная таблица ошибок из блоков «Типичные ошибки» всех уроков курса."',
         'sidebar:', '  order: 4', '---', '',
         f'Здесь собраны все {len(rows)} ошибок из блоков «Типичные ошибки» по урокам. Подробности и объяснение «почему» — в самом уроке по ссылке.', '']
cur = None
for d, label, lid, prob, fix in rows:
    if d != cur:
        cur = d
        lines += ['', f'## Модуль {int(d[1:3])}', '', '| Проблема | Решение | Урок |', '|---|---|---|']
    esc = lambda s: s.replace('|', '\\|').replace('\n', ' ')
    lines.append(f'| {esc(prob)} | {esc(fix)} | [{label}](../../{lid}/) |')
open(os.path.join(DOCS, 'appendix', '04-common-errors.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('book refs:', len(refs), 'mistakes:', len(rows), 'lessons scanned:', len(lessons))
