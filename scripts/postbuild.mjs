#!/usr/bin/env node
/**
 * Шаги после `astro build`:
 *  1. Страницы «глава целиком» (dist/print/<глава>/): относительные ссылки уроков («../02-ohms-law/»,
 *     «../../m03-fet/…») написаны для адреса урока — переписываем их на абсолютные.
 *  2. Список файлов для офлайна (dist/offline-files.json) — его скачивает service worker
 *     по кнопке «Сохранить курс на устройство».
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const BASE = (process.env.CAPACITOR === '1' ? '/' : (process.env.BASE_PATH ?? '/')).replace(/\/?$/, '/');

// 1. печатные страницы
const printDir = join(DIST, 'print');
if (existsSync(printDir)) {
	for (const ch of readdirSync(printDir)) {
		const f = join(printDir, ch, 'index.html');
		if (!existsSync(f)) continue;
		let html = readFileSync(f, 'utf8');
		html = html.replace(/href="(\.\.\/(?:\.\.\/)?)([^"#]*)(#[^"]*)?"/g, (_, up, path, hash = '') => {
			const abs = up === '../../' ? `${BASE}${path}` : `${BASE}${ch}/${path}`;
			return `href="${abs}${hash}"`;
		});
		writeFileSync(f, html);
	}
}

// 2. список файлов для офлайна
const files = [];
let bytes = 0;
(function walk(d) {
	for (const n of readdirSync(d)) {
		const p = join(d, n);
		const st = statSync(p);
		if (st.isDirectory()) walk(p);
		else {
			const rel = relative(DIST, p).split(sep).join('/');
			if (/(^|\/)(sw\.js|offline-files\.json)$|\.map$|^_redirects$|^\.nojekyll$|^print\/|\.(woff|ttf)$/.test(rel)) continue; // печатные главы дублируют уроки; браузерам хватает .woff2
			bytes += st.size;
			// страницы кладём под адресом папки — так их запрашивает браузер
			files.push(rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel);
		}
	}
})(DIST);
files.sort((a, b) => (a.endsWith('/') || a === '' ? 0 : 1) - (b.endsWith('/') || b === '' ? 0 : 1));
writeFileSync(join(DIST, 'offline-files.json'), JSON.stringify({ built: new Date().toISOString(), bytes, files }));
console.log(`postbuild: офлайн-список ${files.length} файлов, ${(bytes / 1048576).toFixed(1)} МБ`);
