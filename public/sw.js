/**
 * Service worker курса: чтобы сайт открывался без интернета.
 *  - страницы: сначала сеть (свежая версия), без сети — сохранённая копия;
 *  - скрипты, стили, картинки, шрифты: сначала кэш (у сборки Astro имена с хешем — они не устаревают);
 *  - по сообщению {type: 'cache-all'} скачивает весь сайт по списку offline-files.json.
 */
const CACHE = 'pcb-course-v1';
const SCOPE = self.registration.scope;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
	e.waitUntil(
		(async () => {
			for (const k of await caches.keys()) if (k.startsWith('pcb-course-') && k !== CACHE) await caches.delete(k);
			await self.clients.claim();
		})(),
	);
});

const OFFLINE_PAGE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Нет сети</title><body style="font:16px system-ui;padding:2rem;max-width:36rem;margin:auto">
<h1>Нет сети</h1><p>Эта страница ещё не сохранена на устройстве. Когда интернет появится, открой главную и нажми
«Сохранить курс на устройство» — тогда весь курс будет работать офлайн.</p><p><a href="${SCOPE}">На главную</a></p>`;

self.addEventListener('fetch', (e) => {
	const r = e.request;
	if (r.method !== 'GET') return;
	const u = new URL(r.url);
	if (u.origin !== location.origin || !r.url.startsWith(SCOPE)) return;
	if (u.pathname.endsWith('/offline-files.json')) return;
	if (r.mode === 'navigate') {
		e.respondWith(
			(async () => {
				try {
					const res = await fetch(r);
					if (res.ok) (await caches.open(CACHE)).put(u.origin + u.pathname, res.clone());
					return res;
				} catch {
					const c = await caches.open(CACHE);
					const hit = (await c.match(u.origin + u.pathname)) || (await c.match(u.origin + u.pathname + '/'));
					return hit || new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
				}
			})(),
		);
		return;
	}
	e.respondWith(
		(async () => {
			const c = await caches.open(CACHE);
			const hit = await c.match(r, { ignoreSearch: true });
			if (hit) return hit;
			const res = await fetch(r);
			if (res.ok && res.type === 'basic') c.put(r, res.clone());
			return res;
		})(),
	);
});

self.addEventListener('message', (e) => {
	if (e.data && e.data.type === 'cache-all') e.waitUntil(cacheAll(e.source));
});

async function cacheAll(client) {
	try {
		const list = await (await fetch(SCOPE + 'offline-files.json', { cache: 'no-store' })).json();
		const c = await caches.open(CACHE);
		const N = list.files.length;
		let done = 0,
			failed = 0;
		for (let i = 0; i < N; i += 8) {
			await Promise.all(
				list.files.slice(i, i + 8).map(async (f) => {
					const url = new URL(f, SCOPE).href;
					try {
						const res = await fetch(url, { cache: 'reload' });
						if (res.ok) await c.put(url, res);
						else failed++;
					} catch {
						failed++;
					}
					done++;
				}),
			);
			client && client.postMessage({ type: 'progress', done, total: N });
		}
		client && client.postMessage({ type: 'done', total: N, failed, bytes: list.bytes, built: list.built });
	} catch (err) {
		client && client.postMessage({ type: 'error', message: String(err) });
	}
}
