/**
 * Схема frontmatter для страниц курса.
 *
 * Starlight уже знает title, description, sidebar и т.д.
 * Здесь мы добавляем поля «паспорта урока». Если в уроке опечатка в поле
 * (например, duration: "сорок"), сборка упадёт с понятной ошибкой.
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * Ссылка на учебник. По умолчанию — Хоровиц, Хилл «Искусство схемотехники», т. 1 (главы 1–6);
 * book: maloratsky — Малорацкий «Микроминиатюризация элементов и устройств СВЧ» (главы 1–2).
 */
const bookRef = z.object({
	book: z.enum(['horowitz', 'maloratsky']).default('horowitz'),
	ch: z.number().int().min(1).max(6),
	sec: z.string().optional(), // параграф, например "1.03"
	page: z.number().int().optional(), // страница книги (= страница PDF)
	note: z.string().optional(), // пояснение: «частично», «рис. 2.3» и т.п.
});

/** Внешняя ссылка: документация Altium, стандарт, даташит. */
const extLink = z.object({
	title: z.string(),
	url: z.url(),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				/** Время прохождения в минутах. */
				duration: z.number().int().positive().optional(),
				/** Цели урока: «после урока ты сможешь…». */
				goals: z.array(z.string()).optional(),
				/** Что нужно знать заранее: id других уроков, например "m01-electricity/02-ohms-law". */
				prerequisites: z.array(z.string()).optional(),
				/** Ссылки на главы учебника схемотехники. */
				book: z.array(bookRef).optional(),
				/** Страницы документации Altium. */
				altium: z.array(extLink).optional(),
				/** Прочие источники: стандарты IPC/ГОСТ, даташиты, статьи. */
				sources: z.array(extLink.or(z.object({ title: z.string() }))).optional(),
				/** draft — урок-заготовка (показывается плашка «в разработке»). */
				status: z.enum(['draft', 'ready']).default('draft'),
			}),
		}),
	}),
};
