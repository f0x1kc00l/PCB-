/**
 * Исправление ссылок для Android-приложения (Capacitor). Подключается ТОЛЬКО в сборке
 * `npm run build:android` (см. astro.config.mjs), на обычном сайте этого скрипта нет.
 *
 * Зачем: встроенный сервер Capacitor рассчитан на одностраничные приложения и на любой
 * адрес без расширения (/m01-electricity/02-ohms-law/) отдаёт корневой index.html,
 * то есть вместо урока открылась бы главная. Наш сайт многостраничный: каждый урок —
 * отдельный файл …/index.html. Поэтому при клике превращаем ссылку
 *   /m01-electricity/02-ohms-law/  →  /m01-electricity/02-ohms-law/index.html
 *
 * Перехват идёт на уровне документа, так что исправляются все ссылки, включая
 * меню, «назад/далее», хлебные крошки и результаты поиска Pagefind.
 * Внешние ссылки не трогаем: Capacitor сам открывает их в браузере телефона.
 */
(() => {
	/** Возвращает исправленный адрес или null, если ссылку трогать не нужно. */
	const toFileUrl = (href) => {
		const url = new URL(href, location.href);
		if (url.origin !== location.origin) return null; // внешняя ссылка
		const last = url.pathname.split('/').pop() ?? '';
		if (last.includes('.')) return null; // уже файл: index.html, .png, .pdf…
		url.pathname = url.pathname.replace(/\/?$/, '/') + 'index.html';
		return url.href;
	};

	document.addEventListener(
		'click',
		(event) => {
			// Не мешаем открытию в новой вкладке и прочим особым кликам.
			if (event.defaultPrevented || event.button !== 0) return;
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

			const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
			if (!link || link.hasAttribute('download')) return;
			const raw = link.getAttribute('href') ?? '';
			if (raw === '' || raw.startsWith('#')) return; // якорь на этой же странице

			const fixed = toFileUrl(link.href);
			if (!fixed) return;
			event.preventDefault();
			location.href = fixed;
		},
		true, // фаза перехвата: срабатываем раньше любых других обработчиков
	);
})();
