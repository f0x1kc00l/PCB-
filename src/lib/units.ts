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
	let s = input.trim().replace(/\s+/g, '').replace(',', '.');
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
	return `${text} ${prefix}${unit}`.trim();
}

/** Простое число с запятой: 1.2345 → "1,23". */
export function formatNumber(value: number, digits = 3): string {
	if (!Number.isFinite(value)) return '—';
	return Number(value.toPrecision(digits)).toLocaleString('ru-RU', { maximumFractionDigits: 6 });
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
