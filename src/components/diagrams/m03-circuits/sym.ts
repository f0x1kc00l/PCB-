/**
 * Помощники для схем модуля 3: возвращают фрагменты SVG (строки) в стиле ГОСТ.
 * Классы линий (ln, ln-acc, fill-cur…) заданы в ../Figure.astro.
 * Вставлять так: <g set:html={npn(150, 200)} />
 */

/** Резистор вертикальный: верхний вывод (x, y1), нижний (x, y2), корпус 12×34 по центру. */
export function resV(x: number, y1: number, y2: number, cls = 'ln'): string {
	const mid = (y1 + y2) / 2;
	return (
		`<path class="${cls}" d="M${x} ${y1} V${mid - 17} M${x} ${mid + 17} V${y2}"/>` +
		`<rect class="${cls}" x="${x - 6}" y="${mid - 17}" width="12" height="34"/>`
	);
}

/** Резистор горизонтальный: левый вывод x1, правый x2 на высоте y. */
export function resH(x1: number, x2: number, y: number, cls = 'ln'): string {
	const mid = (x1 + x2) / 2;
	return (
		`<path class="${cls}" d="M${x1} ${y} H${mid - 17} M${mid + 17} ${y} H${x2}"/>` +
		`<rect class="${cls}" x="${mid - 17}" y="${y - 6}" width="34" height="12"/>`
	);
}

/** Конденсатор горизонтальный (обкладки вертикальные) между x1 и x2 на высоте y. */
export function capH(x1: number, x2: number, y: number, cls = 'ln'): string {
	const mid = (x1 + x2) / 2;
	return (
		`<path class="${cls}" d="M${x1} ${y} H${mid - 4} M${mid + 4} ${y} H${x2}"/>` +
		`<path class="${cls}" d="M${mid - 4} ${y - 11} V${y + 11} M${mid + 4} ${y - 11} V${y + 11}" stroke-width="2.6"/>`
	);
}

/** Конденсатор вертикальный (обкладки горизонтальные) между y1 и y2 на x. */
export function capV(x: number, y1: number, y2: number, cls = 'ln'): string {
	const mid = (y1 + y2) / 2;
	return (
		`<path class="${cls}" d="M${x} ${y1} V${mid - 4} M${x} ${mid + 4} V${y2}"/>` +
		`<path class="${cls}" d="M${x - 11} ${mid - 4} H${x + 11} M${x - 11} ${mid + 4} H${x + 11}" stroke-width="2.6"/>`
	);
}

/** Земля: вывод сверху в точке (x, y). */
export function gnd(x: number, y: number, cls = 'ln'): string {
	return `<path class="${cls}" d="M${x} ${y} V${y + 10} M${x - 12} ${y + 10} H${x + 12} M${x - 7} ${y + 15} H${x + 7} M${x - 3} ${y + 20} H${x + 3}"/>`;
}

/**
 * NPN-транзистор (ГОСТ 2.730, с окружностью-корпусом). Центр (cx, cy).
 * Выводы: база (cx∓30, cy), коллектор (cx±6, cy−26), эмиттер (cx±6, cy+26).
 * mirror = true — база справа (зеркальный, как Q2 в руководстве Altium).
 */
export function npn(cx: number, cy: number, mirror = false, cls = 'ln'): string {
	const s = mirror ? -1 : 1;
	const X = (dx: number) => cx + s * dx;
	const fill = cls === 'ln-acc' ? 'var(--sl-color-accent)' : 'currentColor';
	return (
		`<circle class="${cls}" cx="${cx}" cy="${cy}" r="17"/>` +
		`<path class="${cls}" d="M${X(-30)} ${cy} H${X(-8)}"/>` +
		`<path class="${cls}" d="M${X(-8)} ${cy - 10} V${cy + 10}" stroke-width="3"/>` +
		`<path class="${cls}" d="M${X(-8)} ${cy - 5} L${X(6)} ${cy - 13} V${cy - 26}"/>` +
		`<path class="${cls}" d="M${X(-8)} ${cy + 5} L${X(6)} ${cy + 13} V${cy + 26}"/>` +
		`<polygon points="${X(4)},${cy + 11.9} ${X(-2.7)},${cy + 11.5} ${X(0.3)},${cy + 6.3}" fill="${fill}"/>`
	);
}

/**
 * Диод вертикальный: анод внизу (x, yA), катод вверху (x, yK), yK < yA.
 * led = true — добавить стрелки излучения.
 */
export function diodeUp(x: number, yK: number, yA: number, led = false, cls = 'ln'): string {
	const mid = (yK + yA) / 2;
	const top = mid - 8;
	const bot = mid + 8;
	let s =
		`<path class="${cls}" d="M${x} ${yK} V${top} M${x} ${bot} V${yA}"/>` +
		`<polygon class="${cls}" points="${x - 9},${bot} ${x + 9},${bot} ${x},${top}"/>` +
		`<path class="${cls}" d="M${x - 9} ${top} H${x + 9}"/>`;
	if (led) {
		s +=
			`<path class="${cls}" d="M${x + 11} ${mid - 2} L${x + 19} ${mid - 10} M${x + 15} ${mid - 10} H${x + 19} V${mid - 6}"/>` +
			`<path class="${cls}" d="M${x + 11} ${mid + 5} L${x + 19} ${mid - 3} M${x + 15} ${mid - 3} H${x + 19} V${mid + 1}"/>`;
	}
	return s;
}

/** Диод вертикальный: анод вверху (x, yA), катод внизу (x, yK), yA < yK. Ток течёт сверху вниз. */
export function diodeDown(x: number, yA: number, yK: number, led = false, cls = 'ln'): string {
	const mid = (yA + yK) / 2;
	const top = mid - 8;
	const bot = mid + 8;
	let s =
		`<path class="${cls}" d="M${x} ${yA} V${top} M${x} ${bot} V${yK}"/>` +
		`<polygon class="${cls}" points="${x - 9},${top} ${x + 9},${top} ${x},${bot}"/>` +
		`<path class="${cls}" d="M${x - 9} ${bot} H${x + 9}"/>`;
	if (led) {
		s +=
			`<path class="${cls}" d="M${x + 11} ${mid - 2} L${x + 19} ${mid - 10} M${x + 15} ${mid - 10} H${x + 19} V${mid - 6}"/>` +
			`<path class="${cls}" d="M${x + 11} ${mid + 5} L${x + 19} ${mid - 3} M${x + 15} ${mid - 3} H${x + 19} V${mid + 1}"/>`;
	}
	return s;
}

/** Стабилитрон вертикальный (катод вверху), «флажок» на черте по ГОСТ. */
export function zenerUp(x: number, yK: number, yA: number, cls = 'ln'): string {
	const mid = (yK + yA) / 2;
	return diodeUp(x, yK, yA, false, cls) + `<path class="${cls}" d="M${x - 9} ${mid - 8} V${mid - 3}"/>`;
}

/** Точка соединения. */
export function dot(x: number, y: number, acc = false): string {
	return `<circle cx="${x}" cy="${y}" r="3.5" class="${acc ? 'fill-acc' : 'fill-cur'}"/>`;
}

/** Текст. */
export function txt(x: number, y: number, s: string, cls = 't', anchor = 'start'): string {
	return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${s}</text>`;
}
