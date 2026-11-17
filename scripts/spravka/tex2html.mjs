// TeX → HTML через KaTeX (без браузера). stdin: JSON-массив строк TeX, stdout: JSON {html: [...], css: "..."}.
// CSS KaTeX возвращается вместе со шрифтами woff2, встроенными как data:-URI, — справка работает офлайн.
import katex from 'katex';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const dist = join(dirname(require.resolve('katex/package.json')), 'dist');
let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
	const html = JSON.parse(input).map((tex) =>
		katex.renderToString("\\displaystyle " + tex, { output: 'html', throwOnError: true, strict: false }),
	);
	let css = readFileSync(join(dist, 'katex.min.css'), 'utf8');
	// оставляем только woff2 и встраиваем его
	css = css.replace(/src:url\(fonts\/([^)]+?\.woff2)\) format\("woff2"\)[^;}]*/g, (_, f) => {
		const b64 = readFileSync(join(dist, 'fonts', f)).toString('base64');
		return `src:url(data:font/woff2;base64,${b64}) format("woff2")`;
	});
	process.stdout.write(JSON.stringify({ html, css }));
});
