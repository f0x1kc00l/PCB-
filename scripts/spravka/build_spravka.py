"""
Сборка карманной справки public/spravka/index.html — одна страница без зависимостей.

Порядок:
  npm run build                         # чтобы появились dist/ и скрипты виджетов
  python3 scripts/spravka/build_spravka.py
  npm run build                         # чтобы справка попала в dist/

Тексты карточек — в scripts/spravka/cards.py. Анимации берутся из собранной
страницы приложения «I. Водяные аналогии» (dist/appendix/09-water-analogies/).
"""
import json, re, glob, os, html as H, sys
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
sys.path.insert(0,os.path.dirname(__file__))
from cards import SECTIONS, PREFIXES, TEX, MAIN_TEX
import subprocess
DIST=os.path.join(ROOT,'dist')
page_html=open(os.path.join(DIST,'appendix/09-water-analogies/index.html')).read()
W={}
for m in re.finditer(r'<(water-[a-z]+)\b.*?</\1>',page_html,re.S):
    W.setdefault(m.group(1),m.group(0))
A=os.path.join(DIST,'_astro')
w=open(glob.glob(os.path.join(A,'water.*.js'))[0]).read()
m=re.search(r'export\{([^}]*)\}',w)
pairs=[]
for p in m.group(1).split(','):
    p=p.strip(); a,b=p.split(' as ') if ' as ' in p else (p,p)
    pairs.append(f'{b}:{a}')
w=w[:m.start()]+'window.__W={'+','.join(pairs)+'};'+w[m.end():]
out=['{'+w+'}']
for f in sorted(glob.glob(os.path.join(A,'Water*.astro_astro_type_script*.js'))):
    s=open(f).read()
    im=re.match(r'import\{([^}]*)\}from"[^"]+";',s)
    d=','.join(f"{x.split(' as ')[0].strip()}:{x.split(' as ')[1].strip()}" if ' as ' in x else x for x in im.group(1).split(','))
    out.append('{const{'+d+'}=window.__W;'+s[im.end():]+'}')
js='\n'.join(out)
css=open(os.path.join(ROOT,'src/styles/custom.css')).read()
# TeX → HTML заранее (KaTeX, шрифты встроены), чтобы справка работала офлайн
_all=list(dict.fromkeys([t for v in TEX.values() for t,_ in v]+MAIN_TEX))
_r=json.loads(subprocess.run(['node',os.path.join(os.path.dirname(__file__),'tex2html.mjs')],input=json.dumps(_all),capture_output=True,text=True,check=True,cwd=ROOT).stdout)
SVG=dict(zip(_all,_r['html']))
KATEX_CSS=_r['css']
def mathf(tex,note=''):
    nn=re.sub(r'([A-Za-zА-Яа-я])_([A-Za-zА-Яа-я0-9]+)',r'\1<sub>\2</sub>',H.escape(note))
    n=f'<small>{nn}</small>' if note else ''
    return f'<span class="mf"><span class="tex" role="math" aria-label="{H.escape(tex)}">{SVG[tex]}</span>{n}</span>'
wcss=css[css.index('/* ===================================================================\n * Водяные аналогии'):]
wcss=re.sub(r":root \{\n\t--water-hi.*?\n\}\n:root\[data-theme='light'\] \{.*?\n\}\n","",wcss,flags=re.S)
pw=css[css.index('/* Общая основа интерактивных виджетов. */'):css.index('/* Поля ввода калькуляторов. */')]
titles={c['id']:c['t'] for _,_,cs in SECTIONS for c in cs}
e=H.escape
def card(c):
    f=''.join(mathf(t,n) for t,n in TEX[c['id']]) if c['id'] in TEX else ''.join(f'<code>{e(x)}</code>' for x in c['f'])
    m=''.join(f'<li>{e(x)}</li>' for x in c['m'])
    anim=''
    if 'wi' in c:
        anim=f'<details class="anim"><summary>Смотреть анимацию</summary>{W[c["wi"]]}</details>'
    elif 'see' in c:
        anim=f'<p class="see">Анимация — в карточке <a href="#{c["see"]}">«{e(titles[c["see"]])}»</a></p>'
    s=f'<span class="sym">{e(c["s"])}</span>' if c['s'] else ''
    return f'''<article class="card" id="{c['id']}">
<h3>{e(c['t'])}</h3>{s}
<p class="def">{e(c['d'])}</p>
<div class="an"><span class="tag">Как вода</span><p>{e(c['w'])}</p></div>
<div class="fs">{f}</div>
<ul class="mem">{m}</ul>
<p class="book">Хоровиц, Хилл. Искусство схемотехники, т. 1 — {e(c['b'])}</p>
{anim}
</article>'''
secs=''
toc=''
for sid,name,cs in SECTIONS:
    secs+=f'<section class="sec" id="{sid}"><h2>{e(name)}</h2>'+''.join(card(c) for c in cs)+'</section>\n'
    toc+=f'<div class="tg"><b>{e(name)}</b>'+''.join(f'<a href="#{c["id"]}">{e(c["t"].split(" (")[0])}</a>' for c in cs)+'</div>'
pref=''.join(f'<tr><td><b>{a}</b></td><td>{b}</td><td class="n">{c}</td><td>{d}</td></tr>' for a,b,c,d in PREFIXES)
page=f'''<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Карманная справка: электричество как вода</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;800&display=swap" rel="stylesheet">
<style>
/* VOICE: карманный справочник — коротко, просто, без воды (кроме аналогий)
   IDEA: заламинированная шпаргалка из ящика с инструментами: карточка на термин
   PICTURE: живые водяные модели, раскрываются в карточке по нажатию
   COLOUR and TYPE: глубокая вода #0e3a63 + медь #e08a45; Manrope
   LAYOUT: липкий поиск сверху, оглавление, колонка карточек до 760px */
:root{{color-scheme:light dark;
--bg:light-dark(#eef2f6,#0b1118);--ink:light-dark(#101820,#e8eef5);--card:light-dark(#ffffff,#111a24);
--line:light-dark(#d7dee6,#25303c);--soft:light-dark(#e6eef7,#16273a);
--sl-color-white:var(--ink);--sl-color-black:var(--bg);--sl-color-bg:light-dark(#ffffff,#0f1720);
--sl-color-gray-2:light-dark(#3a4654,#b9c4d0);--sl-color-gray-3:light-dark(#5d6a79,#8d99a6);
--sl-color-gray-5:light-dark(#c9d1da,#3a4552);--sl-color-gray-6:light-dark(#e6ebf0,#1d2732);
--sl-color-gray-7:light-dark(#f8fafc,#0e161f);--sl-color-hairline-light:var(--line);
--sl-color-accent:light-dark(#b0581a,#e08a45);--sl-color-accent-low:light-dark(#f8e4d3,#3a2414);
--pcb-ok:light-dark(#19784a,#4cbf86);--pcb-radius:.6rem;--pcb-mono:ui-monospace,'SF Mono',Consolas,monospace;
--sl-text-xs:.8125rem;--sl-text-sm:.875rem;--sl-text-base:1rem;
--water-hi:light-dark(#185fa5,#5aa2f0);--water-lo:light-dark(#b8d6f5,#1c3552);
--water-dot:light-dark(#0b2440,#e8f2ff);--elec-hi:light-dark(#c8481e,#f0997b);
--elec-lo:light-dark(#f5c9b6,#5a2617);--water-wall:light-dark(#5f6b7a,#8a96a6);
--water-danger:light-dark(#d02b22,#ff5a4f);--deep:#0e3a63}}
:root[data-theme=light]{{color-scheme:light}}:root[data-theme=dark]{{color-scheme:dark}}
*{{box-sizing:border-box;min-width:0}}
html{{scroll-padding-top:76px}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 Manrope,system-ui,sans-serif;overflow-x:clip}}
.wrap{{max-width:760px;margin:0 auto;padding:0 max(4vw,12px)}}
header{{background:var(--deep);color:#eaf3ff;padding:28px 0 22px}}
h1{{font-weight:800;font-size:clamp(30px,6vw,46px);line-height:1.05;margin:0 0 10px;text-wrap:balance}}
.lead{{margin:0;color:#bcd3ec;font-size:16px;max-width:60ch}}
.legend{{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:14px;color:#bcd3ec;margin:14px 0 0}}
.legend i{{display:inline-block;width:24px;height:8px;border-radius:4px;vertical-align:middle;margin-right:6px}}
.bar{{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}}
.bar .wrap{{display:flex;gap:8px;padding-block:10px}}
#q{{flex:1;font:inherit;font-size:16px;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);min-height:44px}}
#q:focus-visible,.bar button:focus-visible{{outline:2px solid var(--sl-color-accent);outline-offset:1px}}
.bar button{{font:inherit;font-size:14px;font-weight:600;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);min-height:44px;cursor:pointer}}
.toc{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:10px 18px;margin:20px 0 6px}}
.tg b{{display:block;font-size:13px;color:var(--sl-color-gray-3);font-weight:600;margin-bottom:2px}}
.tg a{{display:inline-block;margin:0 10px 4px 0;color:var(--ink);text-decoration:none;border-bottom:1px solid var(--sl-color-accent);font-size:15px}}
.sec h2{{font-size:24px;font-weight:800;margin:34px 0 12px;padding-top:12px;border-top:2px solid var(--sl-color-accent)}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 18px 14px;margin:0 0 14px}}
.card h3{{margin:0;font-size:21px;font-weight:800;line-height:1.2}}
.sym{{display:inline-block;margin-top:4px;font-size:14px;font-weight:600;color:var(--sl-color-accent)}}
.def{{font-size:17px;margin:10px 0 12px}}
.an{{background:var(--soft);border-left:4px solid var(--water-hi);border-radius:8px;padding:10px 12px;margin:0 0 12px}}
.an p{{margin:2px 0 0}}
.tag{{font-size:13px;font-weight:800;color:var(--water-hi)}}
.fs{{display:flex;flex-wrap:wrap;gap:6px}}
.mf{{display:inline-flex;flex-direction:column;gap:2px;background:var(--sl-color-gray-6);border-radius:8px;padding:8px 12px;max-width:100%}}.mf .tex{{font-size:clamp(14px,3.9vw,16px);overflow-x:auto;overflow-y:hidden;max-width:100%;padding:2px 0}}.mf .tex .katex{{white-space:nowrap}}.mf small{{font-size:12.5px;color:var(--sl-color-gray-3);line-height:1.3}}
.fs{{gap:8px}}.fs code{{font:600 15px/1.3 Manrope,system-ui,sans-serif;font-variant-numeric:tabular-nums;background:var(--sl-color-gray-6);border-radius:7px;padding:6px 10px;overflow-wrap:anywhere}}
.mem{{margin:12px 0 8px;padding-left:20px}}.mem li{{margin:4px 0}}
.book{{margin:6px 0 0;font-size:13px;color:var(--sl-color-gray-3)}}
.see{{margin:8px 0 0;font-size:14px}}.see a,footer a{{color:var(--sl-color-accent)}}
.anim{{margin-top:10px}}
.anim summary{{cursor:pointer;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:10px;background:var(--deep);color:#eaf3ff;font-weight:600;font-size:15px;list-style:none}}
.anim summary::-webkit-details-marker{{display:none}}
.anim summary::before{{content:'';border:6px solid transparent;border-left:9px solid #e08a45;border-right:0}}
.anim[open] summary::before{{transform:rotate(90deg)}}
.anim .pcb-widget{{margin:12px 0 0}}
table{{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden;border:1px solid var(--line)}}
td,th{{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;font-size:15px}}td.n{{white-space:nowrap}}
#none{{display:none;margin:20px 0;color:var(--sl-color-gray-3)}}
footer{{padding:26px 0 40px;font-size:14px;color:var(--sl-color-gray-2)}}footer li{{margin:5px 0}}
.hide{{display:none!important}}
{pw}
{KATEX_CSS}
{wcss}
@media(max-width:600px){{.card{{padding:14px 13px 12px}}.water__row{{flex-wrap:wrap;gap:.2rem .6rem}}.water__row>span:first-child{{flex-basis:100%;min-width:0}}.pcb-widget__title{{display:block}}.pcb-widget{{padding:.8rem .6rem}}.bar button{{padding:0 10px}}}}
</style></head><body>
<header><div class="wrap">
<h1>Электричество как вода</h1>
<p class="lead">Карманная справка к курсу «PCB с нуля». Каждый термин — простыми словами, с водяной аналогией, формулами и ссылкой на «Искусство схемотехники» Хоровица и Хилла. Нажми «Смотреть анимацию», чтобы увидеть модель в движении.</p>
<p class="legend"><span><i style="background:#5aa2f0"></i>высокое давление = высокий потенциал</span><span><i style="background:#1c3552;outline:1px solid #3b6a96"></i>низкое</span><span><i style="background:#e8f2ff;width:8px"></i>капля = заряд, её скорость = ток</span></p>
</div></header>
<div class="bar"><div class="wrap"><input id="q" type="search" placeholder="Найти: ток, конденсатор, Ом…" aria-label="Поиск по справке" autocomplete="off"><button type="button" id="all" aria-pressed="false">Все анимации</button></div></div>
<main class="wrap">
<nav class="toc" aria-label="Оглавление">{toc}<div class="tg"><b>Шпаргалки</b><a href="#pref">Приставки</a><a href="#main3">Главные формулы</a></div></nav>
<p id="none">Ничего не нашлось. Попробуй другое слово — например, «вольт», «клапан» или «фильтр».</p>
<section class="sec" id="main3"><h2>Главные формулы</h2>
<article class="card" id="main3c"><h3>Если запомнить только это</h3>
<div class="fs" style="margin-top:10px">{"".join(mathf(t) for t in MAIN_TEX)}</div>
<ul class="mem"><li>Напряжение — между двумя точками. Ток — через деталь.</li><li>Ток в узле не теряется, напряжение по контуру в сумме ноль.</li><li>Конденсатор не даёт прыгнуть напряжению, катушка — току.</li></ul>
</article></section>
{secs}
<section class="sec" id="pref"><h2>Приставки</h2>
<table><thead><tr><th>Знак</th><th>Название</th><th>Множитель</th><th>Пример</th></tr></thead><tbody>{pref}</tbody></table>
<p class="book">Регистр важен: «м» — милли, «М» — мега. 4k7 = 4,7 кОм, 100n = 100 нФ.</p>
</section>
</main>
<footer><div class="wrap">
<p><b>Источники.</b> Хоровиц П., Хилл У. Искусство схемотехники. Т. 1. — М.: Мир, 1993 (страницы указаны в каждой карточке). Лекции Г. Сугяна по ТОЭ — переменный ток и мощность. Почему давление нарисовано цветом и где аналогия врёт:</p>
<ul>
<li><a href="https://groups.psych.northwestern.edu/gentner/papers/GentnerGentner83.pdf">Gentner &amp; Gentner, 1983 — Flowing waters or teeming crowds</a></li>
<li><a href="https://doi.org/10.1119/1.13226">Cohen, Eylon, Ganiel, 1983 — Am. J. Phys. 51, 407</a></li>
<li><a href="https://doi.org/10.1119/1.1614813">Engelhardt &amp; Beichner, 2004 — Am. J. Phys. 72, 98</a></li>
<li><a href="https://doi.org/10.1007/978-3-030-51182-1_10">Burde &amp; Wilhelm, 2020 — Springer</a></li>
</ul>
<p>Где вода врёт: у заряда нет веса; сигнал в проводе быстрее любой воды; магнитные эффекты (трансформатор, помехи, излучение) водой не объяснить.</p>
</div></footer>
<script>
{{
const q=document.getElementById('q'),none=document.getElementById('none');
const cards=[...document.querySelectorAll('.card')];
const norm=s=>s.toLowerCase().replace(/ё/g,'е');
const txt=cards.map(c=>norm([...c.querySelectorAll('h3,.sym,.def,.an,.fs,.mem')].map(x=>x.textContent).join(' ')));
q.addEventListener('input',()=>{{const v=norm(q.value.trim());let n=0;
cards.forEach((c,i)=>{{const ok=!v||txt[i].includes(v);c.classList.toggle('hide',!ok);if(ok)n++}});
document.querySelectorAll('.sec').forEach(s=>s.classList.toggle('hide',!s.querySelector('.card:not(.hide)')));
document.querySelector('.toc').classList.toggle('hide',!!v);none.style.display=n?'none':'block'}});
const all=document.getElementById('all');
all.addEventListener('click',()=>{{const on=all.getAttribute('aria-pressed')!=='true';all.setAttribute('aria-pressed',on);all.textContent=on?'Свернуть анимации':'Все анимации';document.querySelectorAll('details.anim').forEach(d=>d.open=on)}});
}}
try{{
{js}
}}catch(e){{console.error(e)}}
</script>
</body></html>'''
os.makedirs(os.path.join(ROOT,'public/spravka'),exist_ok=True)
open(os.path.join(ROOT,'public/spravka/index.html'),'w').write(page)
print(len(page))
