// Рендер TeX → SVG через MathJax (без браузера). stdin: JSON-массив строк TeX, stdout: JSON-массив SVG.
// Нужен пакет mathjax-full@3: npm i --no-save mathjax-full@3
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
const adaptor = liteAdaptor({ unknownCharWidth: 0.5 }); // средняя ширина кириллической буквы в em — меньше лишних зазоров
RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', {
	InputJax: new TeX({ packages: AllPackages }),
	OutputJax: new SVG({ fontCache: 'none' }),
});
let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
	const out = JSON.parse(input).map((tex) => {
		const node = doc.convert(tex, { display: false });
		return adaptor.innerHTML(node);
	});
	process.stdout.write(JSON.stringify(out));
});
