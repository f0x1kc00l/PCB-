// @ts-check
/**
 * Конфигурация сайта-учебника «Печатные платы с нуля».
 *
 * Адрес публикации задаётся переменными окружения, чтобы один и тот же код
 * собирался и для GitHub Pages (сайт в подпапке /repo-name), и для Netlify (корень домена):
 *   SITE_URL  — полный адрес сайта, например https://username.github.io
 *   BASE_PATH — подпапка, например /pcb-course (для Netlify не задаётся)
 */
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
// Список модулей — в src/data/modules.mjs (его же использует карта курса на главной).
// Уроки внутри модуля подхватываются автоматически из папки src/content/docs/<dir>/
// и сортируются по полю sidebar.order во frontmatter урока.
import { modules } from './src/data/modules.mjs';

const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';
const BASE_PATH = process.env.BASE_PATH || '/';

// Сборка для Android-приложения (npm run build:android выставляет CAPACITOR=1).
// В приложении сайт всегда лежит в корне, а ссылки на уроки нужно чинить скриптом —
// подробности в src/lib/app-links.js.
const IS_APP = process.env.CAPACITOR === '1';
const appHead = IS_APP
	? [{ tag: 'script', content: readFileSync(new URL('./src/lib/app-links.js', import.meta.url), 'utf8') }]
	: [];

export default defineConfig({
	site: SITE_URL,
	base: IS_APP ? '/' : BASE_PATH,
	integrations: [
		starlight({
			title: 'PCB с нуля',
			description:
				'Учебник: от закона Ома до собственной двухслойной печатной платы в Altium Designer.',
			// Единственный язык сайта — русский, поэтому делаем его корневой локалью:
			// адреса без префикса /ru/, интерфейс Starlight переведён автоматически.
			defaultLocale: 'root',
			locales: { root: { label: 'Русский', lang: 'ru' } },
			logo: { src: './src/assets/logo.svg', replacesTitle: false },
			favicon: '/favicon.svg',
			customCss: ['./src/styles/custom.css'],
			head: appHead,
			// Последнее обновление страницы берём из git (работает после первого коммита).
			lastUpdated: true,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			// Переопределённые компоненты Starlight (см. src/components/overrides):
			components: {
				PageTitle: './src/components/overrides/PageTitle.astro', // хлебные крошки + паспорт урока
				Sidebar: './src/components/overrides/Sidebar.astro', // прогресс курса + галочки
				Footer: './src/components/overrides/Footer.astro', // ссылки, «урок пройден», назад/далее
			},
			sidebar: [
				{ label: 'Главная', link: '/' },
				// Группа на каждый модуль; уроки внутри подхватываются из папки автоматически.
				...modules.map((m) => ({
					label: `${m.n}. ${m.label}`,
					collapsed: true, // текущий модуль Starlight раскрывает сам
					items: [{ autogenerate: { directory: m.dir } }],
				})),
				{ label: 'Приложения', collapsed: true, items: [{ autogenerate: { directory: 'appendix' } }] },
			],
		}),
	],
});
