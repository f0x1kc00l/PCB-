#!/usr/bin/env node
/**
 * Проверка внутренних ссылок в собранном сайте (dist/), без браузера.
 *  - каждая ссылка href/src, ведущая внутрь сайта, должна указывать на существующий файл;
 *  - якорь (#id) должен существовать на целевой странице.
 * Учитывает <base href> и base-путь сайта (BASE_PATH).
 *
 *   node scripts/check/links.mjs [папка=dist]
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const BASE = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/');
const SKIP = /^(https?:|mailto:|tel:|javascript:|data:|blob:|\/\/)/i;

const pages = [];
(function walk(d) {
	for (const f of readdirSync(d)) {
		const p = join(d, f);
		if (statSync(p).isDirectory()) walk(p);
		else if (f.endsWith('.html')) pages.push(p);
	}
})(DIST);

const ids = new Map();
function idsOf(file) {
	if (!ids.has(file)) {
		const html = readFileSync(file, 'utf8');
		ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decodeURIComponent(m[1]))));
	}
	return ids.get(file);
}
function urlOf(file) {
	const rel = relative(DIST, file).split(sep).join('/');
	return BASE + rel.replace(/index\.html$/, '');
}
function fileOf(pathname) {
	if (!pathname.startsWith(BASE)) return null;
	let p = decodeURIComponent(pathname.slice(BASE.length));
	const cands = [join(DIST, p), join(DIST, p, 'index.html'), join(DIST, p + '.html')];
	return cands.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

let bad = 0,
	total = 0;
for (const page of pages) {
	const html = readFileSync(page, 'utf8');
	// <template> — заготовки виджетов, их ссылки дублируют живые
	const body = html.replace(/<template[\s\S]*?<\/template>/g, '');
	const base = html.match(/<base\s+href="([^"]+)"/)?.[1];
	const pageUrl = new URL(urlOf(page), 'http://x');
	const baseUrl = base ? new URL(base, pageUrl) : pageUrl;
	for (const m of body.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
		const raw = m[1].replace(/&amp;/g, '&');
		if (!raw || SKIP.test(raw)) continue;
		total++;
		// чистый якорь «#…» с <base> относится к base — так ведёт себя браузер
		const u = new URL(raw, baseUrl);
		const target = fileOf(u.pathname);
		let err = '';
		if (!target) err = 'нет страницы/файла';
		else if (u.hash && target.endsWith('.html') && u.hash.length > 1) {
			const id = decodeURIComponent(u.hash.slice(1));
			if (!idsOf(target).has(id)) err = `нет якоря ${u.hash}`;
		}
		if (err) {
			bad++;
			if (bad <= 50) console.log(`✗ ${urlOf(page)} → ${raw}  (${err})`);
		}
	}
}
console.log(`${pages.length} страниц, ${total} внутренних ссылок, битых: ${bad}`);
process.exit(bad ? 1 : 0);
