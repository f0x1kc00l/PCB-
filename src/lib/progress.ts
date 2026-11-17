/**
 * Прогресс прохождения курса в localStorage браузера.
 *
 * Хранится объект { "<путь урока>": <время отметки, мс> }.
 * Путь урока — pathname страницы без завершающего слэша, например
 * "/m01-electricity/02-ohms-law" (вместе с base, если сайт лежит в подпапке).
 *
 * localStorage может быть недоступен (приватный режим, запрет cookies,
 * встроенный браузер), поэтому каждое обращение обёрнуто в try/catch:
 * сайт продолжает работать, просто без запоминания прогресса.
 */

const KEY = 'pcb-course:progress:v1';
const LAST_KEY = 'pcb-course:last:v1';
/** Событие, по которому все виджеты на странице перерисовывают прогресс. */
export const PROGRESS_EVENT = 'pcb-progress-change';

export type ProgressMap = Record<string, number>;

/**
 * Ключ страницы для хранения прогресса.
 *
 * Для урока это «/<модуль>/<урок>» независимо от того, где лежит сайт:
 *   /m01-electricity/02-ohms-law/                    (обычный сайт)
 *   /pcb-course/m01-electricity/02-ohms-law/         (GitHub Pages в подпапке)
 *   /m01-electricity/02-ohms-law/index.html          (Android-приложение)
 * → везде «/m01-electricity/02-ohms-law». Поэтому прогресс не теряется при переезде сайта.
 * Прочие пути просто очищаются от index.html и завершающего слэша.
 */
export function normalizePath(path: string): string {
	const clean = path.replace(/index\.html$/, '').replace(/\/+$/, '');
	const lesson = clean.match(/\/(m\d\d-[^/]+\/[^/]+)$/);
	if (lesson) return `/${lesson[1]}`;
	return clean === '' ? '/' : clean;
}

/** Похоже ли значение на путь урока (а не главной или приложения). */
export function isLessonPath(path: string): boolean {
	return /\/m\d\d-[^/]+\/[^/]+$/.test(normalizePath(path));
}

function read<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* хранилище недоступно или переполнено — молча продолжаем */
	}
}

export function getProgress(): ProgressMap {
	return read<ProgressMap>(KEY, {});
}

export function isDone(path: string): boolean {
	return Boolean(getProgress()[normalizePath(path)]);
}

export function setDone(path: string, done: boolean): void {
	const map = getProgress();
	const key = normalizePath(path);
	if (done) map[key] = Date.now();
	else delete map[key];
	write(KEY, map);
	window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

export function resetProgress(): void {
	write(KEY, {});
	window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
}

/** Последний открытый урок — для кнопки «Продолжить» на главной. */
export interface LastVisited {
	path: string;
	title: string;
}

export function setLastVisited(item: LastVisited): void {
	write(LAST_KEY, { ...item, path: normalizePath(item.path) });
}

export function getLastVisited(): LastVisited | null {
	return read<LastVisited | null>(LAST_KEY, null);
}

/**
 * Подписка на изменения прогресса: в этой вкладке (наше событие)
 * и в других вкладках (стандартное событие storage).
 */
export function onProgressChange(cb: () => void): void {
	window.addEventListener(PROGRESS_EVENT, cb);
	window.addEventListener('storage', (e) => {
		if (e.key === KEY) cb();
	});
}
