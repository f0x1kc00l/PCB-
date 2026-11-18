# Схемотехника с нуля

**Учебник электроники для начинающих** — по плану первого тома «Искусства схемотехники» П. Хоровица и У. Хилла.
Сайт и Android-приложение, работает офлайн, удобен с телефона.

Astro 7 · Starlight · KaTeX · Pagefind · Capacitor

---

## Что внутри

| | |
|---|---|
| **Курс** | Главы 1–6 = главы 1–6 книги: основы, транзисторы, ПТ, ОУ, фильтры и генераторы, источники питания. Плюс модули 7–11: практикум и печатные платы (до ВЧ/СВЧ). 109 уроков. |
| **Задачи** | 41 задача с проверкой ответа (понимает «4,7к», «20м»), подсказки по шагам, решения. В уроках ответы спрятаны под кнопку. |
| **Калькуляторы** | 14 штук отдельным разделом: Ом, делитель, ряды E6–E96, маркировка, светодиод, стабилитрон, LM317, радиатор, 555, мультивибратор, ширина дорожки, микрополоска, стек слоёв, УГО. |
| **Лаборатория** | Живые схемы с настоящим расчётом цепи, интерактивная АЧХ, тренажёр «Найди косяк», карточки (285), шпаргалки глав, 4 лабы на Arduino/ESP32. |
| **Водяные аналогии** | 11 анимаций с ползунками; у каждого опыта — полный экран, ссылка на состояние и «Сброс». |
| **Схемы** | Генерируются кодом; стиль обозначений переключается: как в книге / ГОСТ / IEC / ANSI. |
| **Офлайн и печать** | Кнопка «Сохранить курс на устройство» (service worker). Шпаргалки и главы целиком — в PDF. |
| **Прогресс** | Пройденные уроки, решённые задачи и выученные карточки — в браузере, без регистрации. |

## Быстрый старт

Нужен **Node.js 22.23+**.

```bash
npm install
npm run dev        # http://localhost:4321
```

| Команда | Что делает |
|---|---|
| `npm run build` | Сборка в `dist/` + постобработка (офлайн-список, печатные главы) |
| `npm run preview` | Посмотреть собранный сайт |
| `npm run check` | Сборка, проверка всех внутренних ссылок, тесты расчётов |
| `npm run check:ui` | В браузере: вёрстка на 360/768/1024/1440, ошибки JS, ключевые виджеты ¹ |
| `npm run sheets` | Пересобрать шпаргалки и карточки из уроков (после правки формул) |
| `npm run build:android` | Сборка для приложения и копирование в `android/` |

¹ Один раз: `npx playwright install chromium` — или укажи свой браузер: `CHROME_PATH=/usr/bin/google-chrome`.

## Структура

```
src/
├── content/docs/
│   ├── m00-intro … m06-power/     главы 0–6
│   ├── m07-practice … m11-rf/     дополнительные модули
│   ├── calc/                      калькуляторы
│   ├── lab/                       лаборатория, шпаргалки, лабы на железе
│   └── appendix/                  глоссарий, ошибки, стандарты, карта книги
├── components/
│   ├── lesson/        Formula, M, Callout, Mistakes, Check, Reveal
│   ├── diagrams/      sch.ts (символы), circuits.ts (схемы), live.ts (живые схемы), bugs.ts
│   ├── interactive/   калькуляторы, LiveCircuit, BodePlot, FindBug, Flashcards, Quiz
│   ├── water/         водяные аналогии
│   └── home/, overrides/
├── lib/               mna.ts (решатель цепей), units.ts, water.ts, reset.ts, sym.ts, progress.ts
├── pages/print/       глава целиком для печати
└── data/              modules.mjs (список модулей), flashcards.json
scripts/               postbuild, генераторы приложений и шпаргалок, проверки (check/)
public/                sw.js (офлайн), spravka/ (карманная справка)
android/               проект Capacitor
```

## Как написать урок

```yaml
---
title: Инвертирующий усилитель
description: Одна строка для поиска
sidebar: { label: "4.1 Основные схемы включения ОУ", order: 1 }
duration: 35
status: ready                       # draft — плашка «в разработке»
goals: [вывести усиление из золотых правил]
prerequisites: [m04-opamps/00-intro]
book: [{ ch: 4, sec: "4.04", page: 184 }]
---
```

| Компонент | Пример |
|---|---|
| Формула | `<Formula tex="K = -\frac{R_2}{R_1}" label="инвертирующий" />` |
| Формула в строке | `<M t="r_e = 25\,\text{мВ}/I_К" />` |
| Схема | `<Circuit id="oa-inverting" n="4.1" caption="…" />` |
| Живая схема | `<LiveCircuit id="divider" />` |
| Задача с проверкой | `<Check a={[{ label: "Uвых", unit: "В", value: "3,33" }]} hint="…" />` |
| Спрятанный ответ | `Вопрос? <Reveal>ответ</Reveal>` |
| Врезка | `<Callout type="tip">`, `"warning"`, `"book" where="гл. 4, с. 184"` |

Ссылки между уроками — относительные: `[1.2](../../m01-basics/02-ohms-law/)`.
После правки формул — `npm run sheets`; глоссарий и сводные приложения — `scripts/gen_glossary.py`, `scripts/gen_appendix.py`.

## Публикация

**GitHub Pages.** Settings › Pages › Source: *GitHub Actions*. Workflow `.github/workflows/deploy.yml` собирает сайт при пуше в `main` и сам подставляет адрес.

**Netlify.** Import an existing project — настройки возьмутся из `netlify.toml`.

Сборка под подпапку вручную: `SITE_URL=https://user.github.io BASE_PATH=/pcb-course npm run build`.

## Android

WebView с копией сайта внутри (Capacitor) — работает полностью офлайн.

- **Без Android Studio:** workflow `.github/workflows/android.yml` собирает APK при пуше — Actions › Build Android APK › Artifacts.
- **Локально** (JDK 21 + Android SDK 36):

  ```bash
  npm run build:android
  npm run open:android      # или: cd android && ./gradlew assembleDebug
  ```

После правки уроков снова `npm run build:android` — приложение возит копию сайта с собой.

| Настройка | Где |
|---|---|
| Имя и `appId` | `capacitor.config.ts`, `android/app/build.gradle` |
| Версия | `android/app/build.gradle` (`versionCode`, `versionName`) |
| Иконка и сплэш | `assets/` → `npx @capacitor/assets generate --android` |
| Ссылки на уроки внутри приложения | `src/lib/app-links.js` |
| «Поделиться» из приложения | собирать с `SITE_URL=<адрес сайта>` |

Для Google Play: свой `appId` до первой публикации, подписанный `.aab` (Build › Generate Signed App Bundle), ключ хранить.

## Источники

- П. Хоровиц, У. Хилл. *Искусство схемотехники*, т. 1. — М.: Мир, 1993 — главы 1–6.
- Л. Г. Малорацкий. *Микроминиатюризация элементов и устройств СВЧ*. — М.: Сов. радио, 1976 — модуль 11.
- Даташиты производителей; IPC-2221B, IPC-2152, IPC-7351B, IPC-A-600/610; ЕСКД (ГОСТ 2.7xx).
