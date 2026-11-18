#!/usr/bin/env python3
"""
Шпаргалки по главам 1–6 и колода карточек для повторения.

Всё берётся из самих уроков, поэтому шпаргалка не расходится с текстом:
  - формулы: блоки <Formula tex="…" />;
  - «что надо уметь»: поле goals во frontmatter;
  - типичные ошибки: компонент <Mistakes items={[ { problem, why, fix } ]} />.
Карточки: термины из scripts/gen_glossary.py и формулы вида «X = …» (спереди — X, сзади — формула).

Запуск из корня проекта:  python3 scripts/gen_sheets.py
Результат: src/content/docs/lab/1N-sheet-chN.mdx и src/data/flashcards.json
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'src/content/docs'
CHAPTERS = [
    (1, 'm01-basics', 'Основы'),
    (2, 'm02-transistors', 'Транзисторы'),
    (3, 'm03-fet', 'Полевые транзисторы'),
    (4, 'm04-opamps', 'Операционные усилители'),
    (5, 'm05-filters-oscillators', 'Активные фильтры и генераторы'),
    (6, 'm06-power', 'Источники питания'),
]
STR = r"'((?:[^'\\]|\\.)*)'"


def fm(text):
    m = re.match(r'---\n(.*?)\n---\n', text, re.S)
    return m.group(1) if m else ''


def field(front, name):
    m = re.search(rf'^\s*{name}:\s*"?(.*?)"?\s*$', front, re.M)
    return m.group(1) if m else ''


def goals(front):
    m = re.search(r'^goals:\n((?:\s+-.*\n?)+)', front, re.M)
    if not m:
        return []
    return [g.strip()[1:].strip().strip('"') for g in m.group(1).splitlines() if g.strip().startswith('-')]


def mdx_safe(s):
    s = s.replace('\\\'', "'")
    return s.replace('{', '\\{').replace('}', '\\}').replace('<', '&lt;')


def lessons(d):
    out = []
    for p in sorted((DOCS / d).glob('*.mdx')):
        t = p.read_text(encoding='utf8')
        f = fm(t)
        order = int(field(f, 'order') or 0)
        label = field(f, 'label')
        if 'Упражнения' in label or 'Галерея' in label or 'галерея' in label.lower():
            continue
        formulas = re.findall(r'<Formula\s+tex="((?:[^"\\]|\\.)*)"(?:\s+label="([^"]*)")?\s*/>', t)
        mistakes = re.findall(r'problem:\s*' + STR + r',\s*why:\s*' + STR + r',\s*fix:\s*' + STR, t)
        out.append(
            dict(slug=p.stem, order=order, label=label, title=field(f, 'title'), goals=goals(f), formulas=formulas, mistakes=mistakes)
        )
    return sorted(out, key=lambda x: x['order'])


def sheet(n, d, name, ls, order):
    lines = [
        '---',
        f'title: "Шпаргалка: глава {n}. {name}"',
        f'description: "Все формулы главы {n}, что нужно уметь после каждого урока и типичные ошибки — на одной странице."',
        'sidebar:',
        f'  label: "Шпаргалка: глава {n}"',
        f'  order: {order}',
        '---',
        '',
        "import Formula from '../../../components/lesson/Formula.astro';",
        "import PrintButton from '../../../components/interactive/PrintButton.astro';",
        '',
        f'Вся глава {n} в сжатом виде: формулы, навыки и грабли. Перед контрольной пробеги глазами; если строчка непонятна — открой урок по ссылке.',
        '',
        '<PrintButton />',
        '',
    ]
    for l in ls:
        if not (l['formulas'] or l['goals'] or l['mistakes']):
            continue
        lines.append(f"## [{l['label']}](../../{d}/{l['slug']}/)")
        lines.append('')
        for tex, lab in l['formulas']:
            lines.append(f'<Formula tex="{tex}"' + (f' label="{lab}"' if lab else '') + ' />')
            lines.append('')
        if l['goals']:
            lines.append('**Уметь:** ' + '; '.join(mdx_safe(g) for g in l['goals']) + '.')
            lines.append('')
        for prob, why, fix in l['mistakes'][:2]:
            lines.append(f'- ⚠ **{mdx_safe(prob)}** → {mdx_safe(fix)}')
        if l['mistakes']:
            lines.append('')
    return '\n'.join(lines).rstrip() + '\n'


def split_parts(tex):
    return [p.strip() for p in tex.split(r'\qquad') if p.strip()]


def formula_cards(n, d, ls):
    cards = []
    for l in ls:
        for tex, lab in l['formulas']:
            for part in split_parts(tex):
                # левая часть до первого «=» на верхнем уровне
                depth = 0
                cut = -1
                for i, ch in enumerate(part):
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                    elif ch == '=' and depth == 0:
                        cut = i
                        break
                if cut <= 0:
                    continue
                lhs = part[:cut].strip()
                rhs = part[cut + 1 :].strip()
                if len(lhs) > 45 or not re.search(r'[A-Za-zА-Яа-я\\]', rhs) or re.fullmatch(r'[\d\s.,{}\\]+', rhs):
                    continue
                cards.append(
                    dict(
                        id=f'f-{d}-{l["slug"]}-{len(cards)}',
                        deck=f'f{n}',
                        front=lhs + ' = \\;?',
                        back=part,
                        hint=f'{l["label"]}' + (f' — {lab}' if lab else ''),
                        href=f'{d}/{l["slug"]}',
                    )
                )
    return cards


def term_cards():
    src = (ROOT / 'scripts/gen_glossary.py').read_text(encoding='utf8')
    tuples = re.findall(r'^\("([^"]+)","([^"]+)","([^"]+)"\)', src, re.M)
    return [dict(id=f't-{i}', deck='terms', front=ru, back=defn, en=en) for i, (ru, en, defn) in enumerate(tuples)]


def main():
    allcards = term_cards()
    for i, (n, d, name) in enumerate(CHAPTERS):
        ls = lessons(d)
        out = DOCS / 'lab' / f'{10 + n}-sheet-ch{n}.mdx'
        out.write_text(sheet(n, d, name, ls, 10 + n), encoding='utf8')
        allcards += formula_cards(n, d, ls)
        print('шпаргалка', out.name, sum(len(l['formulas']) for l in ls), 'формул')
    data = ROOT / 'src/data/flashcards.json'
    data.write_text(json.dumps(allcards, ensure_ascii=False, indent=0), encoding='utf8')
    print('карточек', len(allcards), '(терминов', sum(c['deck'] == 'terms' for c in allcards), ')')


if __name__ == '__main__':
    main()
