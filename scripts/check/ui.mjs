#!/usr/bin/env node
/**
 * Проверки в настоящем браузере (Playwright + Chromium) по собранному сайту dist/:
 *  1. ни одна страница не уезжает вбок на ширинах 360, 768, 1024, 1440;
 *  2. на страницах нет ошибок JavaScript;
 *  3. работают ключевые виджеты: сброс водяного опыта, проверка ответа, живая схема, калькулятор.
 *
 * Один раз: npx playwright install chromium   (или укажи свой Chrome: CHROME_PATH=/usr/bin/google-chrome)
 * Запуск:   npm run check:ui
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';

let chromium;
try {
	({ chromium } = await import('playwright'));
} catch {
	console.error('Нет пакета playwright. Выполни: npm i && npx playwright install chromium');
	process.exit(2);
}

const DIST = 'dist';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const server = createServer((req, res) => {
	let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	let f = join(DIST, p);
	if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
	if (!existsSync(f)) {
		res.writeHead(404);
		return res.end('404');
	}
	res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' });
	res.end(readFileSync(f));
}).listen(0);
const B = `http://localhost:${server.address().port}`;

const pages = [];
(function walk(d) {
	for (const n of readdirSync(d)) {
		const p = join(d, n);
		if (statSync(p).isDirectory()) walk(p);
		else if (n === 'index.html') pages.push('/' + relative(DIST, d).split(sep).join('/') + (d === DIST ? '' : '/'));
	}
})(DIST);
pages.sort();

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
let problems = 0;
const say = (ok, msg) => {
	if (!ok) problems++;
	console.log(`${ok ? '✓' : '✗'} ${msg}`);
};

// 1–2. переполнение и ошибки JS
for (const width of [360, 768, 1024, 1440]) {
	const ctx = await browser.newContext({ viewport: { width, height: 900 } });
	const pg = await ctx.newPage();
	const errs = [];
	pg.on('pageerror', (e) => errs.push(`${pg.url()}: ${e.message}`));
	const over = [];
	for (const p of pages) {
		await pg.goto(B + p, { waitUntil: 'load' });
		const w = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		if (w > 1) over.push(`${p} (+${w}px)`);
	}
	say(over.length === 0, `${width}px: ${pages.length} страниц, уезжают вбок: ${over.length}${over.length ? ' — ' + over.slice(0, 5).join(', ') : ''}`);
	if (width === 360) say(errs.length === 0, `ошибок JavaScript: ${errs.length}${errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''}`);
	await ctx.close();
}

// 3. виджеты
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pg = await ctx.newPage();
await pg.goto(B + '/appendix/09-water-analogies/');
let w = pg.locator('water-circuit');
await w.locator('label:has-text("короткое замыкание")').click();
await pg.waitForTimeout(1600);
say((await w.locator('[data-st]').innerText()).includes('сгорел'), 'водяная цепь: при КЗ предохранитель сгорает');
await w.locator('[data-reset]').click();
await pg.waitForTimeout(200);
say((await pg.locator('water-circuit [data-st]').innerText()) === 'Цепь замкнута', 'водяная цепь: «Сброс» возвращает исходное состояние');

await pg.goto(B + '/m01-basics/19-exercises/');
const c = pg.locator('answer-check').first();
await c.locator('input').fill('3,33');
await c.locator('[data-go]').click();
say((await c.locator('[data-msg]').innerText()).includes('Верно'), 'задача с проверкой: правильный ответ принимается');

await pg.goto(B + '/lab/01-live-circuits/');
const lc = pg.locator('live-circuit').first();
say((await lc.locator('[data-lines]').innerText()).includes('6 В'), 'живая схема: делитель 12 В пополам = 6 В');

await pg.goto(B + '/calc/05-led/');
say((await pg.locator('led-calc [data-o="re"]').innerText()).includes('300'), 'калькулятор светодиода: 5 В, 2 В, 10 мА → 300 Ом');

await browser.close();
server.close();
console.log(problems ? `\nПроблем: ${problems}` : '\nВсё в порядке.');
process.exit(problems ? 1 : 0);
