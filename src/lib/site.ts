/**
 * Общие константы и помощники сайта.
 */

/** Учебник схемотехники — основной источник по теории. */
export const BOOK = {
	short: 'Хоровиц, Хилл. Искусство схемотехники, т. 1',
	full: 'Хоровиц П., Хилл У. Искусство схемотехники: в 3 т. Т. 1. — 4-е изд., перераб. и доп. — М.: Мир, 1993. — 413 с.',
	chapters: {
		1: 'Основы электроники',
		2: 'Транзисторы',
		3: 'Полевые транзисторы',
		4: 'Обратная связь и операционные усилители',
		5: 'Активные фильтры и генераторы',
		6: 'Стабилизаторы напряжения и источники питания',
	} as Record<number, string>,
};

/** Второй учебник — для модуля 12 (ВЧ и СВЧ). */
export const BOOK_MAL = {
	short: 'Малорацкий. Микроминиатюризация элементов и устройств СВЧ',
	full: 'Малорацкий Л. Г. Микроминиатюризация элементов и устройств СВЧ. — М.: Сов. радио, 1976. — 216 с. — (Библиотека радиоконструктора).',
	chapters: {
		1: 'Конструирование микроминиатюрных схем СВЧ',
		2: 'Микроминиатюрные устройства СВЧ',
	} as Record<number, string>,
};

/** Учебники по ключу из frontmatter (поле book в ссылке). */
export const BOOKS = { horowitz: BOOK, maloratsky: BOOK_MAL } as const;

/**
 * Добавляет base-путь сайта к внутренней ссылке.
 * withBase('/m01-electricity/02-ohms-law/') → '/pcb-course/m01-electricity/02-ohms-law/' на GitHub Pages.
 */
export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}/${path.replace(/^\//, '')}`;
}

/** Ссылка на урок по его id из коллекции ("m01-electricity/02-ohms-law"). */
export function lessonHref(id: string): string {
	return withBase(`${id}/`);
}

/** Урок ли это (а не главная/приложение): лежит в папке mNN-… */
export function isLessonId(id: string): boolean {
	return /^m\d\d-[^/]+\/[^/]+$/.test(id);
}
