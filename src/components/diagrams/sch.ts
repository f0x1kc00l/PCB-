/**
 * Библиотека условных обозначений для схем глав 1–6.
 * Каждая функция возвращает фрагмент SVG (строку). Классы линий и текста (ln, ln-acc, t, t-s…) заданы в Figure.astro.
 *
 * Двухполюсники (резистор, конденсатор, диод, катушка, кварц) рисуются вдоль отрезка (x1,y1)→(x2,y2)
 * под любым углом: корпус по центру, выводы до концов отрезка.
 * По умолчанию — «как в книге»: резистор прямоугольником (ГОСТ 2.728), транзистор в окружности,
 * операционный усилитель треугольником (как в русском издании Хоровица).
 * Варианты для переключателя обозначений лежат в группах .sym-std / .sym-ansi / .sym-tri / .sym-gost / .sym-iec,
 * какая видна — решает атрибут <html data-sym="gost|iec|ansi"> (стили — custom.css, скрипт — src/lib/sym.ts).
 */

type P = [number, number];
const f = (n: number) => +n.toFixed(2);

/** Ломаная линия-проводник. */
export function w(...pts: P[]): string {
	return `<path class="ln" d="M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L')}"/>`;
}
/** То же, акцентным цветом (выделенная цепь, обратная связь). */
export function wa(...pts: P[]): string {
	return `<path class="ln-acc" d="M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L')}"/>`;
}

/** Двухполюсник вдоль отрезка: body — SVG, нарисованный вдоль оси x, центр в (0,0), полудлина корпуса half. */
function two(x1: number, y1: number, x2: number, y2: number, half: number, body: string, cls = 'ln'): string {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const len = Math.hypot(dx, dy);
	const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
	const cx = (x1 + x2) / 2;
	const cy = (y1 + y2) / 2;
	const lead = Math.max(0, len / 2 - half);
	return (
		`<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(ang)})">` +
		`<path class="${cls}" d="M${f(-len / 2)} 0 H${f(-len / 2 + lead)} M${f(len / 2 - lead)} 0 H${f(len / 2)}"/>` +
		body +
		`</g>`
	);
}

/** Резистор (прямоугольник 30×10 по ГОСТ). */
/** Зигзаг резистора по ANSI (полудлина 15). */
const ZIG = 'M-15 0 L-12.5 -6 L-7.5 6 L-2.5 -6 L2.5 6 L7.5 -6 L12.5 6 L15 0';
export function res(x1: number, y1: number, x2: number, y2: number, cls = 'ln'): string {
	return two(
		x1,
		y1,
		x2,
		y2,
		15,
		`<g class="sym-std"><rect class="${cls}" x="-15" y="-5" width="30" height="10"/></g><g class="sym-ansi"><path class="${cls}" d="${ZIG}"/></g>`,
		cls,
	);
}
/** Переменный резистор/потенциометр: резистор + стрелка. */
export function pot(x1: number, y1: number, x2: number, y2: number): string {
	return two(
		x1,
		y1,
		x2,
		y2,
		15,
		`<g class="sym-std"><rect class="ln" x="-15" y="-5" width="30" height="10"/></g><g class="sym-ansi"><path class="ln" d="${ZIG}"/></g><path class="ln" d="M-12 12 L12 -12 M5 -12 H12 V-5"/>`,
	);
}
/** Конденсатор неполярный. */
export function cap(x1: number, y1: number, x2: number, y2: number, cls = 'ln'): string {
	return two(x1, y1, x2, y2, 4, `<path class="${cls}" d="M-4 -11 V11 M4 -11 V11" stroke-width="2.6"/>`, cls);
}
/** Конденсатор полярный (электролит): «+» у первого вывода (x1,y1). */
export function capPol(x1: number, y1: number, x2: number, y2: number): string {
	const ang = Math.atan2(y2 - y1, x2 - x1);
	// знак «+» ставим в обычной (неповёрнутой) системе, рядом с положительной обкладкой
	const px = (x1 + x2) / 2 - Math.cos(ang) * 12 - Math.sin(ang) * 12;
	const py = (y1 + y2) / 2 - Math.sin(ang) * 12 + Math.cos(ang) * 12;
	return (
		two(
			x1,
			y1,
			x2,
			y2,
			4,
			`<path class="ln" d="M-4 -11 V11" stroke-width="2.6"/><g class="sym-std"><rect class="ln" x="2" y="-11" width="4" height="22"/></g><g class="sym-ansi"><path class="ln" d="M7 -11 Q1 0 7 11" stroke-width="2.6"/></g>`,
		) +
		`<text class="t t-s" x="${f(px)}" y="${f(py + 4)}" text-anchor="middle">+</text>`
	);
}
/** Диод: анод (x1,y1) → катод (x2,y2). kind: zener — стабилитрон, led — светодиод, schottky — диод Шоттки. */
export function diode(x1: number, y1: number, x2: number, y2: number, kind: '' | 'zener' | 'led' | 'schottky' = '', cls = 'ln'): string {
	let b =
		`<g class="sym-std"><path class="${cls}" d="M-8 -9 L8 0 L-8 9 Z" fill="none"/></g>` +
		`<g class="sym-ansi"><path class="${cls}" d="M-8 -9 L8 0 L-8 9 Z" fill="currentColor"/></g>` +
		`<path class="${cls}" d="M8 -9 V9"/>`;
	if (kind === 'zener') b += `<path class="${cls}" d="M8 -9 H3"/>`;
	if (kind === 'schottky') b += `<path class="${cls}" d="M8 -9 H4 V-5 M8 9 H12 V5"/>`;
	if (kind === 'led')
		b += `<path class="${cls}" d="M-2 -12 L6 -20 M2 -20 H6 V-16 M5 -10 L13 -18 M9 -18 H13 V-14"/>`;
	return two(x1, y1, x2, y2, 9, b, cls);
}
/** Катушка индуктивности (четыре полуокружности). */
export function ind(x1: number, y1: number, x2: number, y2: number): string {
	const arcs = [-16, -8, 0, 8].map((x) => `M${x} 0 a4 4 0 0 1 8 0`).join(' ');
	return two(x1, y1, x2, y2, 16, `<path class="ln" d="${arcs}"/>`);
}
/** Кварцевый резонатор. */
export function xtal(x1: number, y1: number, x2: number, y2: number): string {
	return two(
		x1,
		y1,
		x2,
		y2,
		10,
		`<path class="ln" d="M-10 -10 V10 M10 -10 V10" stroke-width="2.4"/><rect class="ln" x="-5" y="-12" width="10" height="24"/>`,
	);
}

/** Земля: вывод сверху в точке (x, y). */
export function gnd(x: number, y: number): string {
	return `<path class="ln" d="M${x} ${y} V${y + 8} M${x - 11} ${y + 8} H${x + 11} M${x - 6.5} ${y + 12.5} H${x + 6.5} M${x - 2.5} ${y + 17} H${x + 2.5}"/>`;
}
/** Шина питания: короткая черта с подписью над точкой (x, y), провод уходит вниз. */
export function rail(x: number, y: number, label: string): string {
	return (
		`<path class="ln" d="M${x - 9} ${y} H${x + 9}"/>` +
		`<text class="t t-s t-acc" x="${x}" y="${y - 5}" text-anchor="middle">${label}</text>`
	);
}
/** Шина питания снизу (отрицательная): черта и подпись под ней, провод приходит сверху. */
export function railDown(x: number, y: number, label: string): string {
	return (
		`<path class="ln" d="M${x - 9} ${y} H${x + 9}"/>` +
		`<text class="t t-s t-acc" x="${x}" y="${y + 15}" text-anchor="middle">${label}</text>`
	);
}
/** Точка соединения. */
export function dot(x: number, y: number): string {
	return `<circle cx="${x}" cy="${y}" r="3.2" class="fill-cur"/>`;
}
/** Вход/выход схемы — кружок-клемма. */
export function term(x: number, y: number): string {
	return `<circle cx="${x}" cy="${y}" r="3.6" class="ln" fill="var(--sl-color-bg, #fff)"/>`;
}
/** Текст. cls: 't' (13 px), 't t-s' (11 px), 't t-acc', 't t-mut'. */
export function tx(x: number, y: number, s: string, anchor: 'start' | 'middle' | 'end' = 'start', cls = 't'): string {
	return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${s}</text>`;
}
/** Стрелка (например, направление тока). */
export function arrow(x1: number, y1: number, x2: number, y2: number, cls = 'ln-acc'): string {
	const a = Math.atan2(y2 - y1, x2 - x1);
	const h = 7;
	const p1: P = [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)];
	const p2: P = [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)];
	return `<path class="${cls}" d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} M${f(p1[0])} ${f(p1[1])} L${f(x2)} ${f(y2)} L${f(p2[0])} ${f(p2[1])}"/>`;
}
/** Источник напряжения: окружность между (x, y1) сверху «+» и (x, y2) снизу. ac — синусоидальный. */
export function vsrc(x: number, y1: number, y2: number, ac = false): string {
	const m = (y1 + y2) / 2;
	const inner = ac
		? `<path class="ln" d="M${x - 8} ${m} q4 -8 8 0 t8 0"/>`
		: `<text class="t t-s" x="${x}" y="${m - 3}" text-anchor="middle">+</text><text class="t t-s" x="${x}" y="${m + 11}" text-anchor="middle">−</text>`;
	return `<path class="ln" d="M${x} ${y1} V${m - 14} M${x} ${m + 14} V${y2}"/><circle class="ln" cx="${x}" cy="${m}" r="14"/>${inner}`;
}
/** Источник тока: окружность со стрелкой вверх, между (x, y1) сверху и (x, y2) снизу. */
export function isrc(x: number, y1: number, y2: number): string {
	const m = (y1 + y2) / 2;
	return `<path class="ln" d="M${x} ${y1} V${m - 14} M${x} ${m + 14} V${y2}"/><circle class="ln" cx="${x}" cy="${m}" r="14"/>${arrow(x, m + 8, x, m - 8, 'ln')}`;
}

/**
 * Биполярный транзистор в окружности. Центр (cx, cy).
 * NPN: база (cx−28, cy), коллектор (cx+8, cy−28), эмиттер (cx+8, cy+28).
 * mirror — база справа: (cx+28, cy), коллектор/эмиттер на x = cx−8.
 * pnp — стрелка эмиттера внутрь; up — у PNP эмиттер сверху (cx+8, cy−28), коллектор снизу.
 */
export function bjt(cx: number, cy: number, o: { pnp?: boolean; mirror?: boolean; cls?: string } = {}): string {
	const s = o.mirror ? -1 : 1;
	const cls = o.cls ?? 'ln';
	const X = (dx: number) => f(cx + s * dx);
	// для PNP эмиттер сверху: отражаем по вертикали
	const v = o.pnp ? -1 : 1;
	const Y = (dy: number) => f(cy + v * dy);
	// эмиттерная стрелка на наклонном отрезке от черты базы к выводу эмиттера:
	// у NPN — ближе к выводу и наружу, у PNP — ближе к базе и внутрь
	const b0: P = [cx + s * -7, cy + v * 6];
	const e1: P = [cx + s * 8, cy + v * 15];
	const a = Math.atan2(e1[1] - b0[1], e1[0] - b0[0]);
	const k = o.pnp ? 0.32 : 0.82;
	const tip: P = [b0[0] + k * (e1[0] - b0[0]), b0[1] + k * (e1[1] - b0[1])];
	const dir = o.pnp ? a + Math.PI : a;
	const h = 7;
	const p1: P = [tip[0] - h * Math.cos(dir - 0.4), tip[1] - h * Math.sin(dir - 0.4)];
	const p2: P = [tip[0] - h * Math.cos(dir + 0.4), tip[1] - h * Math.sin(dir + 0.4)];
	const fill = cls === 'ln-acc' ? 'var(--sl-color-accent)' : 'currentColor';
	return (
		`<circle class="${cls}" cx="${cx}" cy="${cy}" r="17"/>` +
		`<path class="${cls}" d="M${X(-28)} ${cy} H${X(-7)}"/>` +
		`<path class="${cls}" d="M${X(-7)} ${cy - 11} V${cy + 11}" stroke-width="3"/>` +
		`<path class="${cls}" d="M${X(-7)} ${Y(-6)} L${X(8)} ${Y(-15)} V${Y(-28)}"/>` +
		`<path class="${cls}" d="M${X(-7)} ${Y(6)} L${X(8)} ${Y(15)} V${Y(28)}"/>` +
		`<polygon points="${f(tip[0])},${f(tip[1])} ${f(p1[0])},${f(p1[1])} ${f(p2[0])},${f(p2[1])}" fill="${fill}"/>`
	);
}

/**
 * МОП-транзистор с индуцированным каналом (обогащённый) или JFET. Центр (cx, cy).
 * Затвор (cx−28, cy), сток (cx+8, cy−28), исток (cx+8, cy+28). mirror — затвор справа.
 * p — p-канал (у p-канального MOSFET исток рисуем сверху: up).
 */
export function fet(
	cx: number,
	cy: number,
	o: { kind?: 'nmos' | 'pmos' | 'njfet' | 'pjfet'; mirror?: boolean } = {},
): string {
	const kind = o.kind ?? 'nmos';
	const s = o.mirror ? -1 : 1;
	const X = (dx: number) => f(cx + s * dx);
	const up = kind === 'pmos' ? -1 : 1; // pmos: исток сверху
	const Y = (dy: number) => f(cy + up * dy);
	let g = `<circle class="ln" cx="${cx}" cy="${cy}" r="17"/>`;
	if (kind === 'nmos' || kind === 'pmos') {
		g +=
			`<path class="ln" d="M${X(-28)} ${cy} H${X(-10)} M${X(-10)} ${cy - 11} V${cy + 11}"/>` +
			`<path class="ln" d="M${X(-5)} ${cy - 12} V${cy - 6} M${X(-5)} ${cy - 3} V${cy + 3} M${X(-5)} ${cy + 6} V${cy + 12}" stroke-width="2.6"/>` +
			`<path class="ln" d="M${X(-5)} ${Y(-9)} H${X(8)} V${Y(-28)}"/>` +
			`<path class="ln" d="M${X(-5)} ${Y(9)} H${X(8)} V${Y(28)}"/>` +
			`<path class="ln" d="M${X(-5)} ${cy} H${X(8)} V${Y(9)}"/>`;
		// стрелка подложки: n-канал — к каналу, p-канал — от канала
		const tipX = kind === 'nmos' ? cx + s * -4 : cx + s * 6;
		const back = kind === 'nmos' ? 7 : -7;
		g += `<polygon points="${f(tipX)},${cy} ${f(tipX + s * back)},${cy - 4} ${f(tipX + s * back)},${cy + 4}" fill="currentColor"/>`;
	} else {
		// JFET: канал сплошной, стрелка на затворе
		g +=
			`<path class="ln" d="M${X(-5)} ${cy - 12} V${cy + 12}" stroke-width="2.6"/>` +
			`<path class="ln" d="M${X(-5)} ${cy - 8} H${X(8)} V${cy - 28} M${X(-5)} ${cy + 8} H${X(8)} V${cy + 28}"/>` +
			`<path class="ln" d="M${X(-28)} ${cy + 8} H${X(-5)}"/>`;
		const tipX = kind === 'njfet' ? cx + s * -6 : cx + s * -18;
		const back = kind === 'njfet' ? -7 : 7;
		g += `<polygon points="${f(tipX)},${cy + 8} ${f(tipX + s * back)},${cy + 4} ${f(tipX + s * back)},${cy + 12}" fill="currentColor"/>`;
	}
	return g;
}

/**
 * Операционный усилитель (треугольник). Левый край — x, ось — y.
 * Входы: (x, y−14) и (x, y+14); выход (x+70, y).
 * По умолчанию инвертирующий вход сверху; plusTop — неинвертирующий сверху.
 */
export function opamp(x: number, y: number, o: { plusTop?: boolean; label?: string } = {}): string {
	const top = o.plusTop ? '+' : '−';
	const bot = o.plusTop ? '−' : '+';
	const yInv = o.plusTop ? y + 14 : y - 14; // инвертирующий вход
	const yNon = o.plusTop ? y - 14 : y + 14;
	const signs =
		`<text class="t" x="${x + 15}" y="${y - 9}" font-weight="700">${top}</text>` +
		`<text class="t" x="${x + 15}" y="${y + 19}" font-weight="700">${bot}</text>`;
	const rect = `<rect class="ln" x="${x + 10}" y="${y - 30}" width="50" height="60"/>`;
	const amp = `<text class="t t-s" x="${x + 42}" y="${y - 16}" text-anchor="middle">▷ ∞</text>`;
	return (
		`<path class="ln" d="M${x + 60} ${y} H${x + 70}"/>` +
		// «как в книге» и ANSI — треугольник со знаками входов
		`<g class="sym-tri"><path class="ln" d="M${x + 10} ${y - 30} L${x + 60} ${y} L${x + 10} ${y + 30} Z"/>` +
		`<path class="ln" d="M${x} ${y - 14} H${x + 10} M${x} ${y + 14} H${x + 10}"/>${signs}</g>` +
		// ГОСТ 2.759 — прямоугольник «▷ ∞», инвертирующий вход с кружком инверсии
		`<g class="sym-gost">${rect}${amp}<path class="ln" d="M${x} ${yNon} H${x + 10} M${x} ${yInv} H${x + 4}"/>` +
		`<circle class="ln" cx="${x + 7}" cy="${yInv}" r="3" fill="var(--sl-color-bg, #fff)"/></g>` +
		// IEC 60617 — прямоугольник «▷ ∞», входы подписаны «+» и «−»
		`<g class="sym-iec">${rect}${amp}<path class="ln" d="M${x} ${y - 14} H${x + 10} M${x} ${y + 14} H${x + 10}"/>${signs}</g>` +
		(o.label ? `<text class="t t-s t-mut" x="${x + 30}" y="${y + 4}" text-anchor="middle">${o.label}</text>` : '')
	);
}

/** Прямоугольник-блок с подписью (для структурных схем). */
export function box(x: number, y: number, wdt: number, h: number, label: string, sub = ''): string {
	return (
		`<rect class="ln" x="${x}" y="${y}" width="${wdt}" height="${h}" rx="4"/>` +
		`<text class="t" x="${x + wdt / 2}" y="${y + h / 2 + (sub ? -2 : 4)}" text-anchor="middle">${label}</text>` +
		(sub ? `<text class="t t-s t-mut" x="${x + wdt / 2}" y="${y + h / 2 + 13}" text-anchor="middle">${sub}</text>` : '')
	);
}

/** Трансформатор: первичная обмотка слева (x, y1–y2), вторичная справа (x+34). Выводы — концы обмоток. */
export function trafo(x: number, y1: number, y2: number): string {
	const n = 4;
	const step = (y2 - y1) / n;
	let l = `M${x} ${y1}`;
	let r = `M${x + 34} ${y1}`;
	for (let i = 0; i < n; i++) {
		l += ` a${step / 2} ${step / 2} 0 0 1 0 ${step}`;
		r += ` a${step / 2} ${step / 2} 0 0 0 0 ${step}`;
	}
	return (
		`<path class="ln" d="${l}"/><path class="ln" d="${r}"/>` +
		`<path class="ln" d="M${x + 14} ${y1} V${y2} M${x + 20} ${y1} V${y2}"/>`
	);
}
