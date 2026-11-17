/**
 * Генераторы SVG-фрагментов для схем модуля 11 (условные обозначения в духе ГОСТ).
 * Каждая функция возвращает строку SVG, её вставляют через <g set:html={...} />.
 * Классы линий и текста (ln, ln-acc, t, t-s …) описаны в ../Figure.astro.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const text = (x: number, y: number, s: string, cls = 't t-s', anchor = 'start') =>
	`<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(s)}</text>`;

/** Ломаная линия-проводник по точкам [[x,y],…]. */
export const wire = (pts: number[][], cls = 'ln') =>
	`<polyline class="${cls}" points="${pts.map((p) => p.join(',')).join(' ')}" />`;

export const dot = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="3.5" class="fill-cur" />`;

/** «Земля» (ГОСТ 2.721): вертикальный вывод и три уменьшающиеся черты. */
export const gnd = (x: number, y: number) =>
	`<path class="ln" d="M${x} ${y} V${y + 10} M${x - 12} ${y + 10} H${x + 12} M${x - 8} ${y + 15} H${x + 8} M${x - 4} ${y + 20} H${x + 4}" />`;

/** Резистор вертикальный (ГОСТ 2.728: прямоугольник 14×36), между y1 и y2. */
export const resV = (x: number, y1: number, y2: number, ref: string, val: string, side: 'L' | 'R' = 'L') => {
	const m = (y1 + y2) / 2;
	const tx = side === 'L' ? x - 11 : x + 11;
	const an = side === 'L' ? 'end' : 'start';
	return (
		`<path class="ln" d="M${x} ${y1} V${m - 18} M${x} ${m + 18} V${y2}" />` +
		`<rect class="ln" x="${x - 7}" y="${m - 18}" width="14" height="36" />` +
		text(tx, m - 2, ref, 't t-s', an) +
		text(tx, m + 12, val, 't t-s t-mut', an)
	);
};

/** Резистор горизонтальный между x1 и x2. */
export const resH = (x1: number, x2: number, y: number, ref: string, val: string) => {
	const m = (x1 + x2) / 2;
	return (
		`<path class="ln" d="M${x1} ${y} H${m - 18} M${m + 18} ${y} H${x2}" />` +
		`<rect class="ln" x="${m - 18}" y="${y - 7}" width="36" height="14" />` +
		text(m, y - 12, ref, 't t-s', 'middle') +
		text(m, y + 22, val, 't t-s t-mut', 'middle')
	);
};

/** Конденсатор вертикальный; polar — со знаком «+» у верхней обкладки. */
export const capV = (x: number, y1: number, y2: number, ref: string, val: string, polar = false, side: 'L' | 'R' = 'R') => {
	const m = (y1 + y2) / 2;
	const tx = side === 'L' ? x - 16 : x + 16;
	const an = side === 'L' ? 'end' : 'start';
	return (
		`<path class="ln" d="M${x} ${y1} V${m - 4} M${x} ${m + 4} V${y2}" />` +
		`<path d="M${x - 12} ${m - 4} H${x + 12} M${x - 12} ${m + 4} H${x + 12}" stroke="currentColor" stroke-width="2.5" />` +
		(polar ? text(x - 18, m - 6, '+', 't t-s') : '') +
		text(tx, m - 2, ref, 't t-s', an) +
		text(tx, m + 12, val, 't t-s t-mut', an)
	);
};

/** Светодиод вертикальный, анод сверху (ток вниз). */
export const ledV = (x: number, y1: number, y2: number, ref: string, side: 'L' | 'R' = 'R') => {
	const m = (y1 + y2) / 2;
	const tx = side === 'L' ? x - 14 : x + 22;
	const an = side === 'L' ? 'end' : 'start';
	return (
		`<path class="ln" d="M${x} ${y1} V${m + 7} M${x - 9} ${m + 7} H${x + 9} M${x} ${m + 7} V${y2}" />` +
		`<polygon class="ln" points="${x - 9},${m - 8} ${x + 9},${m - 8} ${x},${m + 7}" />` +
		`<path class="ln-thin" style="opacity:1" d="M${x + 11} ${m - 6} l7 -7 M${x + 14} ${m + 0} l7 -7" />` +
		text(tx, m + 4, ref, 't t-s', an)
	);
};

/** Диод вертикальный: катод сверху, если up=true (ток снизу вверх). */
export const diodeV = (x: number, y1: number, y2: number, ref: string, up = true, side: 'L' | 'R' = 'R') => {
	const m = (y1 + y2) / 2;
	const tx = side === 'L' ? x - 14 : x + 14;
	const an = side === 'L' ? 'end' : 'start';
	const tri = up
		? `${x - 9},${m + 8} ${x + 9},${m + 8} ${x},${m - 7}`
		: `${x - 9},${m - 8} ${x + 9},${m - 8} ${x},${m + 7}`;
	const bar = up ? m - 7 : m + 7;
	return (
		`<path class="ln" d="M${x} ${y1} V${y2} M${x - 9} ${bar} H${x + 9}" />` +
		`<polygon class="ln" points="${tri}" />` +
		text(tx, m + 4, ref, 't t-s', an)
	);
};

/** Контрольная точка — маленькое кольцо с подписью. */
export const tp = (x: number, y: number, ref: string) =>
	`<circle class="ln" cx="${x}" cy="${y}" r="5" />` + text(x, y - 10, ref, 't t-s t-acc', 'middle');

/** Кварцевый резонатор горизонтальный между x1 и x2. */
export const xtalH = (x1: number, x2: number, y: number, ref: string, val: string) => {
	const m = (x1 + x2) / 2;
	return (
		`<path class="ln" d="M${x1} ${y} H${m - 12} M${m + 12} ${y} H${x2} M${m - 12} ${y - 12} V${y + 12} M${m + 12} ${y - 12} V${y + 12}" />` +
		`<rect class="ln" x="${m - 7}" y="${y - 15}" width="14" height="30" />` +
		text(m, y - 22, ref, 't t-s', 'middle') +
		text(m, y + 30, val, 't t-s t-mut', 'middle')
	);
};

/** Кнопка (нормально разомкнутая) вертикальная. */
export const buttonV = (x: number, y1: number, y2: number, ref: string, side: 'L' | 'R' = 'R') => {
	const m = (y1 + y2) / 2;
	const tx = side === 'L' ? x - 16 : x + 16;
	const an = side === 'L' ? 'end' : 'start';
	return (
		`<path class="ln" d="M${x} ${y1} V${m - 10} M${x} ${m + 10} V${y2} M${x} ${m + 10} L${x - 12} ${m - 8} M${x - 18} ${m - 4} H${x - 6} M${x - 12} ${m - 4} V${m - 12}" />` +
		text(tx, m + 4, ref, 't t-s', an)
	);
};

export interface Pin {
	side: 'L' | 'R' | 'T' | 'B';
	at: number; // смещение вдоль стороны от левого/верхнего угла, px
	num: string;
	name: string;
}

/**
 * Микросхема или разъём: прямоугольник, выводы длиной 16 px, номер — снаружи, имя — внутри.
 * Возвращает разметку и функцию p(num) → координаты конца вывода для проводников.
 */
export const box = (
	x: number,
	y: number,
	w: number,
	h: number,
	ref: string,
	part: string,
	pins: Pin[],
	label?: { x: number; y: number; anchor?: string },
) => {
	const L = 16;
	let s = `<rect class="ln" x="${x}" y="${y}" width="${w}" height="${h}" />`;
	const lx = label ? label.x : x + w / 2;
	const ly = label ? label.y : y - 22;
	const an = label?.anchor ?? 'middle';
	s += text(lx, ly, ref, 't t-s t-acc', an) + text(lx, ly + 14, part, 't t-s', an);
	const ends: Record<string, [number, number]> = {};
	for (const p of pins) {
		let x1 = 0, y1 = 0, x2 = 0, y2 = 0, nx = 0, ny = 0, ix = 0, iy = 0;
		let nan = 'middle', ian = 'middle';
		if (p.side === 'L') {
			x1 = x; y1 = y + p.at; x2 = x - L; y2 = y1;
			nx = x - 4; ny = y1 - 4; nan = 'end'; ix = x + 4; iy = y1 + 4; ian = 'start';
		} else if (p.side === 'R') {
			x1 = x + w; y1 = y + p.at; x2 = x + w + L; y2 = y1;
			nx = x + w + 4; ny = y1 - 4; nan = 'start'; ix = x + w - 4; iy = y1 + 4; ian = 'end';
		} else if (p.side === 'T') {
			x1 = x + p.at; y1 = y; x2 = x1; y2 = y - L;
			nx = x1 + 4; ny = y - 6; nan = 'start'; ix = x1; iy = y + 13; ian = 'middle';
		} else {
			x1 = x + p.at; y1 = y + h; x2 = x1; y2 = y + h + L;
			nx = x1 + 4; ny = y + h + 12; nan = 'start'; ix = x1; iy = y + h - 5; ian = 'middle';
		}
		s += `<path class="ln" d="M${x1} ${y1} L${x2} ${y2}" />`;
		s += text(nx, ny, p.num, 't t-mono t-mut', nan).replace('class="t t-mono t-mut"', 'class="t t-mono t-mut" font-size="9"');
		s += text(ix, iy, p.name, 't t-mono', ian).replace('class="t t-mono"', 'class="t t-mono" font-size="10"');
		ends[p.num] = [x2, y2];
	}
	return { svg: s, p: (num: string) => ends[num] };
};

/** Кварцевый резонатор вертикальный между y1 и y2. */
export const xtalV = (x: number, y1: number, y2: number, ref: string, val: string, side: 'L' | 'R' = 'L') => {
	const m = (y1 + y2) / 2;
	const tx = side === 'L' ? x - 20 : x + 20;
	const an = side === 'L' ? 'end' : 'start';
	return (
		`<path class="ln" d="M${x} ${y1} V${m - 12} M${x} ${m + 12} V${y2} M${x - 12} ${m - 12} H${x + 12} M${x - 12} ${m + 12} H${x + 12}" />` +
		`<rect class="ln" x="${x - 15}" y="${m - 7}" width="30" height="14" />` +
		text(tx, m - 2, ref, 't t-s', an) +
		text(tx, m + 12, val, 't t-s t-mut', an)
	);
};
