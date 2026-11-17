/**
 * Мини-движок для анимаций «водяная аналогия».
 *
 * Идея: труба — это ломаная из точек. По ней бегут «капли» (кружки SVG),
 * их скорость пропорциональна току (расходу). Давление (потенциал) показываем
 * цветом трубы — смесью --water-lo и --water-hi.
 *
 * Анимация ставится на паузу, когда виджет не виден на экране, и уважает
 * системную настройку «уменьшить движение» (prefers-reduced-motion).
 */

export const SVG_NS = 'http://www.w3.org/2000/svg';

export type Pt = [number, number];

/** Ломаная с параметризацией по длине: at(s) → точка на расстоянии s от начала. */
export class Path {
	readonly len: number;
	private segs: { x1: number; y1: number; dx: number; dy: number; l: number; s0: number }[] = [];
	constructor(pts: Pt[]) {
		let s = 0;
		for (let i = 0; i < pts.length - 1; i++) {
			const [x1, y1] = pts[i];
			const [x2, y2] = pts[i + 1];
			const l = Math.hypot(x2 - x1, y2 - y1);
			this.segs.push({ x1, y1, dx: x2 - x1, dy: y2 - y1, l, s0: s });
			s += l;
		}
		this.len = s;
	}
	at(s: number): Pt {
		for (const g of this.segs) {
			if (s <= g.s0 + g.l) {
				const t = g.l ? (s - g.s0) / g.l : 0;
				return [g.x1 + g.dx * t, g.y1 + g.dy * t];
			}
		}
		const g = this.segs[this.segs.length - 1];
		return [g.x1 + g.dx, g.y1 + g.dy];
	}
}

const mod = (x: number, m: number) => ((x % m) + m) % m;

/**
 * Капли на одной трубе. step(ds) сдвигает их на ds пикселей вдоль трубы
 * (отрицательный ds — течение назад). Плотность капель постоянна, поэтому
 * в узле скорости складываются так же, как токи (закон токов Кирхгофа).
 */
export class Drops {
	private dots: SVGCircleElement[] = [];
	private off = 0;
	constructor(
		group: Element,
		readonly path: Path,
		spacing = 16,
		r = 2.4,
		cls = 'dot',
		readonly dx = 0,
	) {
		const n = Math.max(1, Math.round(path.len / spacing));
		for (let i = 0; i < n; i++) {
			const c = document.createElementNS(SVG_NS, 'circle');
			c.setAttribute('r', String(r));
			c.setAttribute('class', cls);
			group.appendChild(c);
			this.dots.push(c);
		}
		this.step(0);
	}
	/** Сдвинуть на ds пикселей. */
	step(ds: number) {
		this.off += ds;
		this.place();
	}
	/** Поставить капли со смещением (для колебаний «туда-обратно»). */
	set(offset: number) {
		this.off = offset;
		this.place();
	}
	private place() {
		const n = this.dots.length;
		const sp = this.path.len / n;
		for (let i = 0; i < n; i++) {
			const [x, y] = this.path.at(mod(this.off + i * sp, this.path.len));
			this.dots[i].setAttribute('cx', (x + this.dx).toFixed(1));
			this.dots[i].setAttribute('cy', y.toFixed(1));
		}
	}
	hide(h: boolean) {
		for (const d of this.dots) d.style.display = h ? 'none' : '';
	}
}

/** Цвет давления: p от 0 (низкое) до 1 (высокое). kind: вода или «электричество». */
export function pressure(p: number, kind: 'water' | 'elec' = 'water'): string {
	const k = Math.round(Math.max(0, Math.min(1, p)) * 100);
	return `color-mix(in srgb, var(--${kind}-hi) ${k}%, var(--${kind}-lo))`;
}

/** Покрасить элементы по давлению. */
export function paint(els: (Element | null)[], p: number, kind: 'water' | 'elec' = 'water') {
	const c = pressure(p, kind);
	for (const e of els) if (e) (e as SVGElement).style.stroke = c;
}

/** Запуск кадров: fn(dt) каждый кадр, пока виджет на экране. dt в секундах (не больше 0,05). */
export function animate(root: HTMLElement, fn: (dt: number, t: number) => void) {
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let visible = true;
	let last = performance.now();
	let t = 0;
	const io = new IntersectionObserver((es) => {
		visible = es.some((e) => e.isIntersecting);
		last = performance.now();
		if (visible) requestAnimationFrame(frame);
	});
	io.observe(root);
	function frame(now: number) {
		if (!visible) return;
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		t += dt;
		fn(reduce ? 0 : dt, t);
		requestAnimationFrame(frame);
	}
	fn(0, 0);
	return { reduce };
}

/** Число по-русски: запятая вместо точки, d знаков после запятой (лишние нули убираем). */
export function fm(x: number, d = 2): string {
	if (!Number.isFinite(x)) return '—';
	return String(Number(x.toFixed(d))).replace('.', ',').replace('-', '−');
}

/** Значение с приставкой: 0,0123 А → «12,3 мА». */
export function si(x: number, unit: string, d = 3): string {
	if (!Number.isFinite(x)) return '—';
	const a = Math.abs(x);
	const P: [number, string][] = [
		[1e3, 'к'],
		[1, ''],
		[1e-3, 'м'],
		[1e-6, 'мк'],
		[1e-9, 'н'],
	];
	if (a === 0) return `0 ${unit}`;
	for (const [m, p] of P) {
		if (a >= m * 0.9995) return `${fm(x / m, Math.max(0, d - String(Math.floor(a / m)).length))} ${p}${unit}`;
	}
	return `${fm(x / 1e-12, 1)} п${unit}`;
}

/** Осциллограф: кольцевой буфер значений и отрисовка в <polyline>. */
export class Scope {
	private buf: number[][];
	private i = 0;
	private n = 0;
	constructor(
		readonly lines: (SVGPolylineElement | null)[],
		readonly box: { x: number; y: number; w: number; h: number },
		readonly size = 240,
	) {
		this.buf = lines.map(() => new Array(size).fill(0));
	}
	push(vals: number[]) {
		vals.forEach((v, k) => (this.buf[k][this.i] = v));
		this.i = (this.i + 1) % this.size;
		this.n = Math.min(this.size, this.n + 1);
	}
	clear() {
		this.n = 0;
		this.i = 0;
	}
	/** Нарисовать: значения ожидаются в диапазоне [-1, 1] (0 — середина) или [0,1] при half=true. */
	draw(half: boolean[] = []) {
		const { x, y, w, h } = this.box;
		this.lines.forEach((pl, k) => {
			if (!pl) return;
			const pts: string[] = [];
			for (let j = 0; j < this.n; j++) {
				const idx = (this.i - this.n + j + this.size) % this.size;
				const v = Math.max(-1.05, Math.min(1.05, this.buf[k][idx]));
				const px = x + (w * (j + this.size - this.n)) / (this.size - 1);
				const py = half[k] ? y + h - v * h : y + h / 2 - (v * h) / 2;
				pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
			}
			pl.setAttribute('points', pts.join(' '));
		});
	}
}

export const $ = <T extends Element = SVGElement>(root: ParentNode, sel: string) =>
	root.querySelector(sel) as T;
