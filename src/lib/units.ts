/**
 * Ввод и вывод величин в инженерной записи.
 *
 * parseValue("4,7к") → 4700, parseValue("100n") → 1e-7, parseValue("2.2 мк") → 2.2e-6
 * formatValue(0.0047, "А") → "4,7 мА"
 *
 * Принимаются и латинские, и русские приставки. Регистр важен:
 * m/м — милли, M/М — мега (как на схемах).
 */

/** Приставка → множитель. Длинные варианты идут первыми, чтобы «мк» не распознавалось как «м». */
const PREFIXES: [string, number][] = [
	['мк', 1e-6],
	['p', 1e-12],
	['п', 1e-12],
	['n', 1e-9],
	['н', 1e-9],
	['u', 1e-6],
	['µ', 1e-6],
	['μ', 1e-6],
	['m', 1e-3],
	['м', 1e-3],
	['k', 1e3],
	['K', 1e3],
	['к', 1e3],
	['К', 1e3],
	['M', 1e6],
	['М', 1e6],
	['G', 1e9],
	['Г', 1e9],
];

/**
 * Разбирает строку с числом и необязательной приставкой.
 * Единицы измерения после приставки игнорируются: "10 кОм", "10k", "10kΩ" → 10000.
 * Поддерживается запись «4k7» (как в маркировке резисторов).
 * Возвращает NaN, если строку разобрать не удалось.
 */
export function parseValue(input: string): number {
	let s = input.trim().replace(/\s+/g, '').replace(',', '.').replace(/−/g, '-');
	if (s === '') return NaN;

	// Запись вида 4k7 / 4к7 / 2R2 (R — десятичная точка без множителя).
	const rkm = s.match(/^(\d+)([pnuµμmkKMGRrпнмкКМГ]|мк)(\d+)/);
	if (rkm) {
		const mult = rkm[2] === 'R' || rkm[2] === 'r' ? 1 : prefixMultiplier(rkm[2]);
		return Number(`${rkm[1]}.${rkm[3]}`) * mult;
	}

	const m = s.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)(.*)$/i);
	if (!m) return NaN;
	const num = Number(m[1]);
	const rest = m[2];
	// Единица «Гц» начинается с «Г», но это не гига-приставка.
	if (/^(Гц|Hz)/.test(rest)) return num;
	for (const [p, mult] of PREFIXES) {
		if (rest.startsWith(p)) return num * mult;
	}
	return num;
}

function prefixMultiplier(p: string): number {
	return PREFIXES.find(([k]) => k === p)?.[1] ?? 1;
}

/** Приставки для вывода (русские, как в учебниках и ГОСТ 8.417). */
const OUT_PREFIXES: [number, string][] = [
	[1e9, 'Г'],
	[1e6, 'М'],
	[1e3, 'к'],
	[1, ''],
	[1e-3, 'м'],
	[1e-6, 'мк'],
	[1e-9, 'н'],
	[1e-12, 'п'],
];

/**
 * Форматирует число с приставкой и единицей: 4700, "Ом" → "4,7 кОм".
 * digits — число значащих цифр.
 */
export function formatValue(value: number, unit = '', digits = 3): string {
	if (!Number.isFinite(value)) return '—';
	if (value === 0) return `0 ${unit}`.trim();
	const abs = Math.abs(value);
	const [mult, prefix] = OUT_PREFIXES.find(([m]) => abs >= m * 0.9995) ?? OUT_PREFIXES[OUT_PREFIXES.length - 1];
	const scaled = value / mult;
	const text = Number(scaled.toPrecision(digits)).toLocaleString('ru-RU', { maximumFractionDigits: 6 });
	return `${text.replace('-', '−')} ${prefix}${unit}`.trim();
}

/** Простое число с запятой: 1.2345 → "1,23". */
export function formatNumber(value: number, digits = 3): string {
	if (!Number.isFinite(value)) return '—';
	return Number(value.toPrecision(digits)).toLocaleString('ru-RU', { maximumFractionDigits: 6 }).replace('-', '−');
}

/** Стандартные ряды номиналов (IEC 60063). */
export const E24 = [
	1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8,
	7.5, 8.2, 9.1,
];

/** Ближайший номинал ряда E24 к заданному значению. */
export function nearestE24(value: number): number {
	if (!(value > 0)) return NaN;
	const decade = Math.pow(10, Math.floor(Math.log10(value)));
	const candidates = [...E24.map((v) => v * decade), 10 * decade, E24[E24.length - 1] * decade / 10];
	return candidates.reduce((best, c) => (Math.abs(c - value) < Math.abs(best - value) ? c : best));
}

/** Ряды номиналов IEC 60063 (мантиссы в декаде 1…10). */
const E96_RAW = [
	100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154, 158, 162, 165, 169,
	174, 178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287, 294,
	301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412, 422, 432, 442, 453, 464, 475, 487, 499, 511,
	523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887,
	909, 931, 953, 976,
];
export const SERIES: Record<string, { values: number[]; tol: string }> = {
	E6: { values: [1.0, 1.5, 2.2, 3.3, 4.7, 6.8], tol: '±20 %' },
	E12: { values: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2], tol: '±10 %' },
	E24: { values: E24, tol: '±5 %' },
	E48: { values: E96_RAW.filter((_, i) => i % 2 === 0).map((v) => v / 100), tol: '±2 %' },
	E96: { values: E96_RAW.map((v) => v / 100), tol: '±1 %' },
};
/** Мантиссы E96 по порядку — нужны для кодов EIA-96 (01 → 100, 02 → 102 …). */
export const E96 = E96_RAW;

/** Ближайшие номиналы ряда снизу и сверху (и сам номинал, если попали точно). */
export function seriesNeighbors(value: number, series: number[]): { below: number; above: number; nearest: number } {
	const decade = Math.pow(10, Math.floor(Math.log10(value)));
	const all = [...series.map((v) => v * decade / 10), ...series.map((v) => v * decade), ...series.map((v) => v * decade * 10)];
	all.sort((a, b) => a - b);
	let below = all[0],
		above = all[all.length - 1];
	for (const v of all) {
		if (v <= value * (1 + 1e-9)) below = v;
		if (v >= value * (1 - 1e-9)) {
			above = v;
			break;
		}
	}
	const nearest = Math.abs(below - value) <= Math.abs(above - value) ? below : above;
	return { below, above, nearest };
}

/** Все номиналы ряда в диапазоне [lo, hi]. */
export function seriesRange(series: number[], lo: number, hi: number): number[] {
	const out: number[] = [];
	for (let d = Math.floor(Math.log10(lo)) - 1; d <= Math.ceil(Math.log10(hi)); d++) {
		for (const m of series) {
			const v = Number((m * 10 ** d).toPrecision(6));
			if (v >= lo && v <= hi) out.push(v);
		}
	}
	return out;
}
