# PCB с нуля — сайт-учебник

Курс для полного новичка: от закона Ома до собственной двухслойной печатной платы в Altium Designer.
Статический сайт на [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Быстрый старт

Нужен **Node.js 22.23 или новее** (Astro 7 ниже не запустится). Проверка: `node -v`.

```bash
npm install      # один раз — установить зависимости
npm run dev      # локальный сервер с автообновлением: http://localhost:4321
```

Поиск по сайту (Pagefind) строится только при сборке, поэтому в `npm run dev` он не работает. Чтобы проверить поиск:

```bash
npm run build    # собрать сайт в папку dist/
npm run preview  # открыть собранную версию: http://localhost:4321
```

## Структура

```
src/
├── content/docs/            ← ВСЕ УРОКИ ЗДЕСЬ
│   ├── index.mdx            главная
│   ├── m00-intro/ … m11-projects/   модули (папка = модуль)
│   └── appendix/            приложения
├── components/
│   ├── lesson/              врезки, скриншоты, пути меню, клавиши, ошибки, задание, ссылки
│   ├── interactive/         квиз, калькуляторы, стек слоёв, таблица УГО, кнопка «пройдено»
│   ├── home/                блоки главной страницы
│   └── overrides/           переопределённые части Starlight: крошки, прогресс, подвал
├── data/
│   ├── modules.mjs          список модулей (меню + карта на главной)
│   └── symbols.ts           таблица УГО ГОСТ ↔ IEC ↔ ANSI
├── lib/                     прогресс (localStorage), единицы, формула IPC-2221
└── styles/custom.css        цвета темы и общие стили виджетов
public/screenshots/          сюда кладёшь скриншоты Altium
android/                     проект Android-приложения (Capacitor)
assets/                      исходники иконки и сплэш-экрана приложения
scripts/build-android.mjs    сборка сайта для приложения
```

## Как написать урок

Заготовки всех уроков уже лежат в `src/content/docs/mNN-…/` как `.md` со `status: draft`.
Чтобы наполнить урок, переименуй файл в `.mdx` (нужно для компонентов) и пиши.

### Frontmatter (паспорт урока)

```yaml
---
title: Делитель напряжения               # заголовок H1
description: Одна строка для поиска и соцсетей
sidebar:
  label: 1.5 Делитель напряжения         # как урок называется в меню
  order: 5                               # порядок в модуле
duration: 40                             # минут
status: ready                            # draft — показывается плашка «в разработке»
goals:
  - рассчитать делитель под нужное напряжение
prerequisites:                           # id уроков = путь без расширения
  - m01-electricity/02-ohms-law
book:                                    # ссылки на учебники
  - { ch: 1, sec: "1.03", page: 14 }                     # Хоровиц, Хилл, т. 1 (по умолчанию)
  - { book: maloratsky, ch: 1, sec: "1.2", page: 18 }    # Малорацкий, СВЧ (страница книги)
altium:                                  # страницы документации Altium
  - title: Создание проекта
    url: https://www.altium.com/ru/documentation/altium-designer/tutorial/creating-project-schematic-document
sources:                                 # стандарты и прочее (url не обязателен)
  - title: IPC-2221B
---
```

Паспорт (время, цели, пререквизиты) выводится под заголовком автоматически, блок «Ссылки» — внизу урока. Руками писать их не нужно.

### Компоненты

Импорт в начале `.mdx` (путь от `src/content/docs/<модуль>/`):

```mdx
import Callout from '../../../components/lesson/Callout.astro';
import MenuPath from '../../../components/lesson/MenuPath.astro';
import Kbd from '../../../components/lesson/Kbd.astro';
import Screenshot from '../../../components/lesson/Screenshot.astro';
import Mistakes from '../../../components/lesson/Mistakes.astro';
import Assignment from '../../../components/lesson/Assignment.astro';
import Quiz from '../../../components/interactive/Quiz.astro';
```

| Что | Пример |
|---|---|
| Врезка «Совет» | `<Callout type="tip">…</Callout>` |
| Врезка «Внимание» | `<Callout type="warning">…</Callout>` |
| Врезка «Особенность Altium» | `<Callout type="altium">…</Callout>` |
| Врезка «Из учебника» | `<Callout type="book" where="гл. 1, §1.03, с. 14">…</Callout>` |
| Путь в меню | `<MenuPath path="Design » Update PCB Document" />`, непроверенный: `verify` |
| Горячие клавиши | `<Kbd keys="Ctrl+S" />`, по очереди: `<Kbd keys="P, W" />` |
| Скриншот | `<Screenshot src="screenshots/m07/l02-components.png" alt="панель Components, поиск 2N3904" />` |
| Типичные ошибки | `<Mistakes items={[{ problem: '…', why: '…', fix: '…' }]} />` |
| Квиз | `<Quiz questions={[{ q: '…', options: ['…','…'], answer: 0, explain: '…' }]} />` |
| Задание | `<Assignment time={30}>…</Assignment>` |
| Калькуляторы | `<OhmCalc />`, `<DividerCalc />`, `<TraceWidthCalc />`, `<MultivibratorCalc />`, `<MicrostripCalc />` |
| Стек слоёв | `<LayerStack preset="2" />` или `"4"` |
| Таблица УГО | `<SymbolTable />` или `<SymbolTable only={['resistor','cap']} />` |

Живой пример всех компонентов — урок `m00-intro/01-how-course-works.mdx`.

### Скриншоты

Пока файла нет, на странице видна рамка `[СКРИНШОТ: …]` с путём. Положи картинку в `public/<путь из src>` и пересобери сайт — рамка сменится картинкой.

### Ссылки между уроками

Пиши **относительные** ссылки — они работают и на GitHub Pages в подпапке:

```md
[урок 1.2](../../m01-electricity/02-ohms-law/)    из другого модуля
[урок 0.3](../03-install-altium/)                  из того же модуля
```

### Сводные приложения

Две страницы приложений собираются автоматически из уроков. Перезапусти скрипт после правок:

```bash
python3 scripts/gen_appendix.py .
```

- **D. Типичные ошибки** — все блоки `<Mistakes>` из уроков;
- **F. Карта учебника** — ссылки `book` из frontmatter: параграф Хоровица → уроки.

Глоссарий (A) генерируется из списка терминов в `scripts/gen_glossary.py`:
`python3 scripts/gen_glossary.py src/content/docs/appendix/01-glossary.mdx`.

### Метки [ПРОВЕРИТЬ]

Места, которые не удалось сверить с документацией Altium AD 26, помечены `[ПРОВЕРИТЬ]` или `<MenuPath … verify />`.
Список: `grep -rn "ПРОВЕРИТЬ\| verify" src/content/docs`. Проверил в своей версии — убери метку.

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
`/m01-electricity/02-ohms-law/` в `/m01-electricity/02-ohms-law/index.html`. Скрипт попадает только в сборку приложения.

### Google Play

Debug-APK годится для своего телефона и раздачи знакомым. Для Google Play:
1. Придумай свой идентификатор пакета (перевёрнутый домен, например `am.example.pcbcourse`) и пропиши его в `capacitor.config.ts` (`appId`) и в `android/app/build.gradle` (`applicationId`). Java-пакет `com.pcbcourse.app` переименовывать не обязательно. После публикации идентификатор менять нельзя.
2. В Android Studio: **Build › Generate Signed App Bundle / APK › Android App Bundle**, создай ключ (keystore) и **сохрани его** — без него обновления не выпустить.
3. Загрузи `.aab` в Google Play Console.

## Прогресс ученика

Хранится в `localStorage` браузера под ключами `pcb-course:progress:v1` и `pcb-course:last:v1`.
Урок считается уроком, если лежит в папке `mNN-…`; приложения и главная в прогресс не входят.

## Источники

- П. Хоровиц, У. Хилл. Искусство схемотехники, т. 1. — М.: Мир, 1993.
- Л. Г. Малорацкий. Микроминиатюризация элементов и устройств СВЧ. — М.: Сов. радио, 1976 (модуль 12).
- [Altium Designer Tutorial](https://www.altium.com/ru/documentation/altium-designer/tutorial)
- IPC-2221B, IPC-2152, IPC-7351B, IPC-A-600, IPC-A-610; ГОСТ 2.702, 2.710, 2.417 и ГОСТ на УГО (см. `src/data/symbols.ts`).
