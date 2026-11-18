/**
 * Маленький решатель электрических цепей постоянного тока для «живых схем».
 *
 * Метод узловых потенциалов (MNA): неизвестные — потенциалы узлов и токи через источники
 * напряжения. Для нелинейных элементов (диоды, транзисторы, насыщение ОУ) — итерации Ньютона
 * с численным якобианом и ограничением шага, чтобы экспоненты не «взрывались».
 *
 * Узел «0» — земля. Модели упрощённые, но физичные:
 *  - диод: уравнение Шокли I = Is·(e^(U/(n·Ut)) − 1); стабилитрон — плюс экспоненциальный пробой при Uст;
 *  - NPN-транзистор: модель Эберса — Молла (транспортная), поэтому есть и активный режим, и насыщение;
 *  - ОУ: усиление 10⁵ с плавным насыщением у шин (tanh).
 */

export const UT = 0.02585; // тепловой потенциал kT/q при ~27 °C

export type El =
	| { t: 'R'; a: string; b: string; r: number }
	| { t: 'V'; p: string; n: string; v: number } // источник напряжения, «+» в узле p
	| { t: 'I'; a: string; b: string; i: number } // ток i течёт через источник от a к b
	| { t: 'D'; a: string; k: string; is: number; n: number; bv?: number; ibv?: number; nbv?: number }
	| { t: 'Q'; c: string; b: string; e: string; bf: number; br?: number; is?: number }
	| { t: 'OA'; out: string; p: string; m: string; vhi: number; vlo: number; a?: number };

/** Экспонента с линейным продолжением — защита от переполнения. */
function lexp(x: number): number {
	const X = 40;
	return x < X ? Math.exp(x) : Math.exp(X) * (1 + x - X);
}

/** Параметры диода по прямому напряжению uf при токе i0 и коэффициенте n. */
export function diodeFrom(uf: number, i0 = 10e-3, n = 2): { is: number; n: number } {
	return { is: i0 / Math.exp(uf / (n * UT)), n };
}

export interface Solution {
	v: Record<string, number>; // потенциалы узлов
	ok: boolean;
	/** Ток элемента по его индексу: R, D — от a к b/k; V — из «+» наружу; Q — {c, b, e} втекающие. */
	cur: (i: number) => number | { c: number; b: number; e: number };
}

/**
 * Решает цепь. guess — предыдущее решение (тёплый старт при перетаскивании ползунка).
 */
export function solve(els: El[], guess?: Record<string, number>): Solution {
	const nodes: string[] = [];
	const add = (n: string) => {
		if (n !== '0' && !nodes.includes(n)) nodes.push(n);
	};
	for (const e of els) {
		if (e.t === 'R' || e.t === 'I') (add(e.a), add(e.b));
		else if (e.t === 'V') (add(e.p), add(e.n));
		else if (e.t === 'D') (add(e.a), add(e.k));
		else if (e.t === 'Q') (add(e.c), add(e.b), add(e.e));
		else (add(e.out), add(e.p), add(e.m));
	}
	const extra: number[] = []; // индексы элементов с током-неизвестной (V, OA)
	els.forEach((e, i) => (e.t === 'V' || e.t === 'OA') && extra.push(i));
	const N = nodes.length;
	const M = N + extra.length;
	const idx = (n: string) => (n === '0' ? -1 : nodes.indexOf(n));
	const x = new Float64Array(M);
	if (guess) nodes.forEach((n, i) => (x[i] = guess[n] ?? 0));

	const V = (xx: Float64Array, n: string) => (n === '0' ? 0 : xx[idx(n)]);
	const qCur = (xx: Float64Array, e: Extract<El, { t: 'Q' }>) => {
		const is = e.is ?? 1e-14,
			br = e.br ?? 1;
		const vbe = V(xx, e.b) - V(xx, e.e),
			vbc = V(xx, e.b) - V(xx, e.c);
		const ef = lexp(vbe / UT) - 1,
			er = lexp(vbc / UT) - 1;
		const ic = is * (ef - er) - (is / br) * er;
		const ib = (is / e.bf) * ef + (is / br) * er;
		return { c: ic, b: ib, e: -(ic + ib) };
	};
	const dCur = (xx: Float64Array, e: Extract<El, { t: 'D' }>) => {
		const vd = V(xx, e.a) - V(xx, e.k);
		let i = e.is * (lexp(vd / (e.n * UT)) - 1);
		if (e.bv) i -= (e.ibv ?? 5e-3) * lexp((-vd - e.bv) / ((e.nbv ?? 2) * UT));
		return i;
	};
	const sat = (u: number, hi: number, lo: number) => {
		const mid = (hi + lo) / 2,
			half = (hi - lo) / 2;
		return mid + half * Math.tanh((u - mid) / half);
	};

	const F = (xx: Float64Array): Float64Array => {
		const r = new Float64Array(M);
		const leave = (n: string, i: number) => {
			const k = idx(n);
			if (k >= 0) r[k] += i;
		};
		for (let k = 0; k < N; k++) r[k] += 1e-9 * xx[k]; // gmin — чтобы висящие узлы не ломали систему
		els.forEach((e, i) => {
			if (e.t === 'R') {
				const c = (V(xx, e.a) - V(xx, e.b)) / e.r;
				leave(e.a, c);
				leave(e.b, -c);
			} else if (e.t === 'I') {
				leave(e.a, e.i);
				leave(e.b, -e.i);
			} else if (e.t === 'D') {
				const c = dCur(xx, e);
				leave(e.a, c);
				leave(e.k, -c);
			} else if (e.t === 'Q') {
				const q = qCur(xx, e);
				leave(e.c, q.c);
				leave(e.b, q.b);
				leave(e.e, q.e);
			} else if (e.t === 'V') {
				const j = xx[N + extra.indexOf(i)];
				leave(e.p, -j);
				leave(e.n, j);
				r[N + extra.indexOf(i)] = V(xx, e.p) - V(xx, e.n) - e.v;
			} else {
				const j = xx[N + extra.indexOf(i)];
				leave(e.out, -j);
				r[N + extra.indexOf(i)] = V(xx, e.out) - sat((e.a ?? 1e5) * (V(xx, e.p) - V(xx, e.m)), e.vhi, e.vlo);
			}
		});
		return r;
	};

	let ok = false;
	for (let it = 0; it < 300; it++) {
		const f0 = F(x);
		let norm = 0;
		for (const v of f0) norm = Math.max(norm, Math.abs(v));
		if (norm < 1e-12) {
			ok = true;
			break;
		}
		// численный якобиан
		const J: number[][] = Array.from({ length: M }, () => new Array(M).fill(0));
		for (let c = 0; c < M; c++) {
			const h = 1e-7 * Math.max(1, Math.abs(x[c]));
			const old = x[c];
			x[c] = old + h;
			const f1 = F(x);
			x[c] = old;
			for (let rr = 0; rr < M; rr++) J[rr][c] = (f1[rr] - f0[rr]) / h;
		}
		const dx = gauss(J, Array.from(f0, (v) => -v));
		if (!dx) break;
		// ограничение шага по потенциалам узлов (не больше 0,3 В за итерацию)
		let s = 1;
		for (let k = 0; k < N; k++) if (Math.abs(dx[k]) * s > 0.3) s = 0.3 / Math.abs(dx[k]);
		let small = true;
		for (let k = 0; k < M; k++) {
			const step = k < N ? dx[k] * s : dx[k];
			x[k] += step;
			if (Math.abs(step) > 1e-9 * Math.max(1, Math.abs(x[k]))) small = false;
		}
		if (small && s === 1) {
			ok = true;
			break;
		}
	}
	const v: Record<string, number> = { '0': 0 };
	nodes.forEach((n, i) => (v[n] = x[i]));
	return {
		v,
		ok,
		cur: (i: number) => {
			const e = els[i];
			if (e.t === 'R') return (v[e.a] - v[e.b]) / e.r;
			if (e.t === 'I') return e.i;
			if (e.t === 'D') return dCur(x, e);
			if (e.t === 'Q') return qCur(x, e);
			return x[N + extra.indexOf(i)];
		},
	};
}

/** Метод Гаусса с выбором главного элемента. */
function gauss(A: number[][], b: number[]): number[] | null {
	const n = b.length;
	for (let c = 0; c < n; c++) {
		let p = c;
		for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
		if (Math.abs(A[p][c]) < 1e-300) return null;
		[A[c], A[p]] = [A[p], A[c]];
		[b[c], b[p]] = [b[p], b[c]];
		for (let r = c + 1; r < n; r++) {
			const k = A[r][c] / A[c][c];
			if (!k) continue;
			for (let cc = c; cc < n; cc++) A[r][cc] -= k * A[c][cc];
			b[r] -= k * b[c];
		}
	}
	const xx = new Array(n).fill(0);
	for (let r = n - 1; r >= 0; r--) {
		let s = b[r];
		for (let c = r + 1; c < n; c++) s -= A[r][c] * xx[c];
		xx[r] = s / A[r][r];
	}
	return xx;
}
