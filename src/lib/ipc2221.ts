/**
 * Расчёт ширины печатного проводника по току — IPC-2221B, п. 6.2.
 *
 * Эмпирическая формула, аппроксимирующая графики стандарта:
 *     I = k · ΔT^0.44 · A^0.725
 * где I — ток, А; ΔT — допустимый перегрев над окружающей средой, °C;
 *     A — площадь сечения проводника, mil² (1 mil = 0,0254 мм);
 *     k = 0,048 для внешних слоёв, 0,024 для внутренних.
 *
 * Область применимости графиков (по IPC-2221): ток до ~35 А, ширина до ~400 mil,
 * перегрев 10–100 °C, толщина меди 0,5–3 oz. Вне этих пределов результат — грубая оценка.
 *
 * Более новый стандарт IPC-2152 (2009) даёт более точные значения
 * и для внутренних слоёв обычно допускает более узкие проводники.
 * Окончательные значения всегда сверяются с технологическими нормами производителя.
 */

export type LayerKind = 'external' | 'internal';

/** Толщина меди: 1 oz/ft² ≈ 34,8 мкм ≈ 1,378 mil (часто округляют до 35 мкм). */
export const MIL_PER_OZ = 1.378;
export const UM_PER_MIL = 25.4;

export interface TraceInput {
	current: number; // А
	copperOz: number; // oz/ft²
	layer: LayerKind;
	deltaT: number; // °C
	lengthMm?: number; // длина проводника, мм (для расчёта сопротивления)
	ambient?: number; // температура окружающей среды, °C
}

export interface TraceResult {
	areaMil2: number;
	widthMil: number;
	widthMm: number;
	thicknessUm: number;
	resistance?: number; // Ом
	voltageDrop?: number; // В
	powerLoss?: number; // Вт
	warnings: string[];
}

const RHO_CU_20C = 1.72e-8; // удельное сопротивление меди при 20 °C, Ом·м
const ALPHA_CU = 0.00393; // температурный коэффициент сопротивления меди, 1/°C

export function traceWidth(input: TraceInput): TraceResult {
	const { current, copperOz, layer, deltaT, lengthMm, ambient = 25 } = input;
	const k = layer === 'external' ? 0.048 : 0.024;
	const areaMil2 = Math.pow(current / (k * Math.pow(deltaT, 0.44)), 1 / 0.725);
	const thicknessMil = copperOz * MIL_PER_OZ;
	const widthMil = areaMil2 / thicknessMil;
	const widthMm = (widthMil * UM_PER_MIL) / 1000;
	const thicknessUm = thicknessMil * UM_PER_MIL;

	const warnings: string[] = [];
	if (current > 35) warnings.push('Ток больше 35 А — за пределами графиков IPC-2221.');
	if (deltaT < 10 || deltaT > 100) warnings.push('Перегрев вне диапазона 10–100 °C, на котором построены графики.');
	if (widthMil > 400) warnings.push('Ширина больше 400 mil — за пределами графиков; рассмотрите полигон или более толстую медь.');
	if (widthMm < 0.1) warnings.push('Ширина меньше 0,1 мм — упирается в технологические нормы большинства производителей.');

	const result: TraceResult = { areaMil2, widthMil, widthMm, thicknessUm, warnings };

	if (lengthMm && lengthMm > 0) {
		// Сопротивление считаем при рабочей температуре (окружающая + перегрев).
		const rho = RHO_CU_20C * (1 + ALPHA_CU * (ambient + deltaT - 20));
		const areaM2 = (widthMm / 1000) * (thicknessUm / 1e6);
		result.resistance = (rho * (lengthMm / 1000)) / areaM2;
		result.voltageDrop = result.resistance * current;
		result.powerLoss = result.resistance * current * current;
	}
	return result;
}
