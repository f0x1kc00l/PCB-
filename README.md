# Схемотехника с нуля — сайт-учебник

Курс электроники для начинающих по плану первого тома «Искусства схемотехники» П. Хоровица и У. Хилла:
главы 1–6 курса = главы 1–6 книги (основы, транзисторы, ПТ, ОУ, фильтры и генераторы, источники питания),
плюс дополнительные модули: практикум и печатные платы (устройство, проектирование, производство, ВЧ/СВЧ).
Статический сайт на [Astro](https://astro.build) + [Starlight](https://starlight.astro.build), адаптивный — от телефона до широкого монитора.

## Быстрый старт

Нужен **Node.js 22.23 или новее**. Проверка: `node -v`.

```bash
npm install      # один раз
npm run dev      # локальный сервер: http://localhost:4321
npm run build    # сборка в dist/ (вместе с поиском Pagefind)
npm run preview  # посмотреть собранную версию
```

## Структура

```
src/
├── content/docs/                 ← ВСЕ УРОКИ
│   ├── index.mdx                 главная
│   ├── m00-intro/                как устроен курс
│   ├── m01-basics/ … m06-power/  главы 1–6 (по книге)
│   ├── m07-practice/             практикум: схемы, корпуса, даташиты, макетка
│   ├── m08-pcb-basics/ … m11-rf/ печатные платы (доп. модули)
│   └── appendix/                 приложения A–I
├── components/
│   ├── lesson/        врезки, формулы (Formula, M), ошибки, задание, ссылки
│   ├── diagrams/      схемы: sch.ts (условные обозначения), circuits.ts (реестр схем), Circuit.astro
│   ├── interactive/   квиз, калькуляторы, стек слоёв, таблица УГО, «урок пройден»
│   ├── water/         водяные аналогии
│   ├── home/          блоки главной
│   └── overrides/     переопределённые части Starlight
├── data/modules.mjs   список модулей (меню + карта на главной)
├── lib/               прогресс, единицы, формулы IPC и микрополоска
└── styles/custom.css  тема, адаптивная вёрстка
public/spravka/        карманная справка (отдельная страница)
```

## Как написать урок

Frontmatter (паспорт урока):

```yaml
---
title: Инвертирующий усилитель
description: Одна строка для поиска
sidebar:
  label: "4.1 Основные схемы включения ОУ"   # номер = глава.урок
  order: 1
duration: 35
status: ready                 # draft — плашка «в разработке»
goals:
  - вывести усиление из золотых правил
prerequisites:
  - m04-opamps/00-intro       # id урока = путь без расширения
book:                         # Хоровиц, Хилл, т. 1 (по умолчанию)
  - { ch: 4, sec: "4.04", page: 184, note: "инвертирующий усилитель" }
  - { book: maloratsky, ch: 1, sec: "1.2", page: 18 }
sources:
  - title: Даташит LM358
    url: https://www.ti.com/product/LM358
---
```

Компоненты (импорт от `src/content/docs/<модуль>/`):

| Что | Пример |
|---|---|
| Формула (KaTeX, LaTeX) | `<Formula tex="K = -\frac{R_2}{R_1}" label="инвертирующий" />` — части через `\qquad` переносятся на телефоне |
| Формула в строке | `<M t="r_e = 25\,\text{мВ}/I_К" />` |
| Схема из реестра | `<Circuit id="oa-inverting" n="4.1" caption="…" />` (новые схемы — в `circuits.ts`) |
| Врезки | `<Callout type="tip">`, `type="warning"`, `type="book" where="гл. 4, §4.04, с. 184"` |
| Ошибки, квиз, задание | `<Mistakes items={[…]} />`, `<Quiz questions={[…]} />`, `<Assignment time={30}>…</Assignment>` |
| Калькуляторы | `<OhmCalc />`, `<DividerCalc />`, `<TraceWidthCalc />`, `<MultivibratorCalc />`, `<MicrostripCalc />` |

Ссылки между уроками — **относительные**: `[урок 1.2](../../m01-basics/02-ohms-law/)`, в том же модуле — `[2.3](../03-basic-circuits/)`.

Сводные приложения пересобираются скриптами:

```bash
python3 scripts/gen_appendix.py .                                        # D. Типичные ошибки, F. Карта учебника
python3 scripts/gen_glossary.py src/content/docs/appendix/01-glossary.mdx  # A. Глоссарий
```

## Публикация

### GitHub Pages

1. Создай репозиторий на GitHub и запушь проект.
2. **Settings › Pages › Build and deployment › Source: GitHub Actions.**
3. Workflow `.github/workflows/deploy.yml` уже лежит в проекте и запускается при каждом пуше в `main`.
   Он сам подставляет адрес `https://<user>.github.io/<repo>/`.
   Если репозиторий называется `<user>.github.io`, сайт будет в корне — workflow это учитывает.

Ручная сборка под подпапку: `SITE_URL=https://user.github.io BASE_PATH=/pcb-course npm run build`.

### Netlify

1. **Add new site › Import an existing project**, выбери репозиторий.
2. Настройки сборки подтянутся из `netlify.toml` (команда `npm run build`, папка `dist`, Node 22).
3. По желанию задай переменную окружения `SITE_URL` с адресом сайта (нужна для sitemap).

## Android-приложение

Сайт упакован в приложение через [Capacitor](https://capacitorjs.com): WebView, внутри которого лежит собранный сайт.
Работает **полностью офлайн**: уроки, калькуляторы, поиск и прогресс — всё внутри APK.

### Вариант 1. APK на GitHub (без установки Android Studio)

Workflow `.github/workflows/android.yml` собирает APK при каждом пуше в `main`.
Открой **Actions › Build Android APK ›** последний запуск **› Artifacts › pcb-course-apk**, скачай архив, внутри `app-debug.apk`.
Кинь на телефон и установи (разреши установку из неизвестных источников).

### Вариант 2. Локально

Нужны Node 22.23+, **JDK 21** и Android Studio (или Android SDK с platform 36).

```bash
npm run build:android    # собрать сайт в режиме приложения и скопировать в android/
npm run open:android     # открыть проект в Android Studio → Run или Build › Build APK(s)
```

Или из консоли: `cd android && ./gradlew assembleDebug` (в Windows `gradlew.bat assembleDebug`).
APK появится в `android/app/build/outputs/apk/debug/app-debug.apk`.

**После любой правки уроков** снова запусти `npm run build:android`: приложение не подтягивает сайт из интернета, оно возит его копию с собой.

### Что настроено и где

| Что | Где |
|---|---|
| Имя приложения, идентификатор пакета | `capacitor.config.ts` (`appName`, `appId`) |
| Иконка и сплэш-экран | исходники в `assets/`, перегенерация: `npx @capacitor/assets generate --android` |
| Цвет фона окна (светлая/тёмная тема) | `android/app/src/main/res/values*/app_colors.xml` |
| Кнопка «Назад» листает историю страниц | `android/app/src/main/java/com/pcbcourse/app/MainActivity.java` |
| Исправление ссылок на уроки внутри приложения | `src/lib/app-links.js` |
| Номер версии | `android/app/build.gradle` (`versionCode`, `versionName`) |

Почему нужен `app-links.js`: встроенный сервер Capacitor на любой адрес без расширения отдаёт корневой `index.html`
(так удобно одностраничным приложениям). У нас каждый урок — отдельная страница, поэтому скрипт превращает
`/m01-basics/02-ohms-law/` в `/m01-basics/02-ohms-law/index.html`. Скрипт попадает только в сборку приложения.

### Google Play

Debug-APK годится для своего телефона и раздачи знакомым. Для Google Play:
1. Придумай свой идентификатор пакета (перевёрнутый домен, например `am.example.pcbcourse`) и пропиши его в `capacitor.config.ts` (`appId`) и в `android/app/build.gradle` (`applicationId`). Java-пакет `com.pcbcourse.app` переименовывать не обязательно. После публикации идентификатор менять нельзя.
2. В Android Studio: **Build › Generate Signed App Bundle / APK › Android App Bundle**, создай ключ (keystore) и **сохрани его** — без него обновления не выпустить.
3. Загрузи `.aab` в Google Play Console.

## Прогресс ученика

Хранится в `localStorage` под ключами `pcb-course:progress:v1` и `pcb-course:last:v1` (имена ключей оставлены прежними).
Уроком считается страница из папки `mNN-…`.

## Источники

- П. Хоровиц, У. Хилл. Искусство схемотехники, т. 1. — М.: Мир, 1993 — главы 1–6.
- Л. Г. Малорацкий. Микроминиатюризация элементов и устройств СВЧ. — М.: Сов. радио, 1976 — модуль 11.
- Даташиты производителей; IPC-2221B, IPC-2152, IPC-7351B, IPC-A-600, IPC-A-610; ГОСТ 2.702, 2.710 и ГОСТ на УГО.

## Карманная справка

`public/spravka/index.html` (на сайте — `/spravka/`): термины простыми словами, водяные аналогии, формулы.
Тексты — `scripts/spravka/cards.py`, пересборка: `npm run build && python3 scripts/spravka/build_spravka.py && npm run build`.
