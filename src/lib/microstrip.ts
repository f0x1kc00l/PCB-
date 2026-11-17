/**
 * Расчёт микрополосковой линии (microstrip) — формулы Хаммерстада и Йенсена:
 * E. Hammerstad, O. Jensen, «Accurate Models for Microstrip Computer-Aided Design»,
 * IEEE MTT-S Int. Microwave Symposium Digest, 1980.
 *
 * Модель: бесконечно тонкий проводник шириной W на диэлектрике толщиной h
 * с проницаемостью εr, снизу сплошная земля. Толщина меди не учитывается:
 * реальная медь 35 мкм немного снижает Z0 (обычно на 1–3 % для типичных плат).
 * Точность формул — около 1 % в диапазоне 0,01 ≤ W/h ≤ 100, εr ≤ 128.
 * Дисперсия (рост εэфф с частотой) не учитывается — для FR-4 до нескольких ГГц это допустимо
 * в учебных оценках. Окончательные размеры — по стеку производителя и его расчёту импеданса.
 */

const ETA0 = 376.73; // волновое сопротивление свободного пространства, Ом
const C0 = 299.792458; // скорость света, мм/нс (= м/мкс)

/** Эффективная диэлектрическая проницаемость εэфф. */
export function effPermittivity(u: number, er: number): number {
	const a =
		1 +
		(1 / 49) * Math.log((u ** 4 + (u / 52) ** 2) / (u ** 4 + 0.432)) +
		(1 / 18.7) * Math.log(1 + (u / 18.1) ** 3);
	const b = 0.564 * ((er - 0.9) / (er + 3)) ** 0.053;
	return (er + 1) / 2 + ((er - 1) / 2) * (1 + 10 / u) ** (-a * b);
}

/** Волновое сопротивление Z0, Ом, для отношения u = W/h. */
export function impedance(u: number, er: number): number {
	const F = 6 + (2 * Math.PI - 6) * Math.exp(-((30.666 / u) ** 0.7528));
	const z01 = (ETA0 / (2 * Math.PI)) * Math.log(F / u + Math.sqrt(1 + (2 / u) ** 2)); // в воздухе
	return z01 / Math.sqrt(effPermittivity(u, er));
}

/** Ширина W (в тех же единицах, что h) для заданного Z0 — подбором делением пополам. */
export function widthFor(z0: number, h: number, er: number): number {
	let lo = 0.01;
	let hi = 100; // по u = W/h; Z0 монотонно убывает с ростом u
	for (let i = 0; i < 80; i++) {
		const mid = Math.sqrt(lo * hi);
		if (impedance(mid, er) > z0) lo = mid;
		else hi = mid;
	}
	return Math.sqrt(lo * hi) * h;
}

export interface LineInfo {
	z0: number; // Ом
	eeff: number;
	lambda0: number; // длина волны в воздухе, мм
	lambdaG: number; // длина волны в линии, мм
	quarter: number; // λг/4, мм
	delay: number; // задержка, пс/мм
}

/** Все параметры линии: W и h в мм, f в МГц. */
export function lineInfo(w: number, h: number, er: number, fMHz: number): LineInfo {
	const u = w / h;
	const eeff = effPermittivity(u, er);
	const z0 = impedance(u, er);
	const lambda0 = (C0 * 1000) / fMHz; // мм: c [мм/нс] × период [нс] = 299,79 · 1000 / f[МГц]
	const lambdaG = lambda0 / Math.sqrt(eeff);
	return { z0, eeff, lambda0, lambdaG, quarter: lambdaG / 4, delay: (Math.sqrt(eeff) / C0) * 1000 };
}
