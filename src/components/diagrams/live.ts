/**
 * «Живые схемы»: рисунок из библиотеки sch.ts + список элементов для решателя src/lib/mna.ts.
 * Ползунки меняют номиналы, решатель пересчитывает цепь, на схеме и в табло — напряжения и токи.
 *
 * В SVG текст с атрибутом data-x="ключ" заполняется результатом run(); группа data-show="ключ"
 * показывается, только когда включён одноимённый переключатель; data-glow — яркость свечения.
 */
import { w, res, diode, gnd, rail, dot, term, tx, vsrc, bjt, opamp } from './sch';
import { solve, diodeFrom, type El } from '../../lib/mna';
import { formatValue as fv } from '../../lib/units';

export interface Param {
	k: string;
	label: string;
	unit: string;
	min: number;
	max: number;
	value: number;
	step?: number;
	/** логарифмический ползунок с округлением до ряда E24 (для резисторов) */
	log?: boolean;
}
export interface Toggle {
	k: string;
	label: string;
	value: boolean;
}
export interface Result {
	texts: Record<string, string>;
	lines: string[];
	warn?: string[];
	glow?: number;
	state?: Record<string, number>;
}
export interface LiveDef {
	title: string;
	w: number;
	h: number;
	alt: string;
	svg: () => string;
	params: Param[];
	toggles?: Toggle[];
	run: (p: Record<string, number>, t: Record<string, boolean>, prev?: Record<string, number>) => Result;
}

/** Текст-заготовка, который заполняет скрипт. */
const val = (x: number, y: number, k: string, anchor: 'start' | 'middle' | 'end' = 'start', cls = 't t-s t-acc') =>
	`<text class="${cls}" data-x="${k}" x="${x}" y="${y}" text-anchor="${anchor}">—</text>`;
const V = (u: number) => fv(Math.abs(u) < 5e-4 ? 0 : u, 'В', 3);
const A = (i: number) => fv(Math.abs(i) < 1e-9 ? 0 : i, 'А', 3);
const W = (p: number) => fv(Math.abs(p) < 1e-7 ? 0 : p, 'Вт', 2);
const R = (r: number) => fv(r, 'Ом', 2);
const cur = (s: ReturnType<typeof solve>, i: number) => s.cur(i) as number;

export const LIVE: Record<string, LiveDef> = {
	divider: {
		title: 'Делитель напряжения под нагрузкой',
		w: 330,
		h: 235,
		alt: 'Источник U, сверху резистор R1, снизу R2; со средней точки снимается Uвых, параллельно R2 можно подключить нагрузку Rн.',
		svg: () =>
			vsrc(50, 50, 190) +
			w([50, 50], [160, 50]) +
			res(160, 50, 160, 118) +
			dot(160, 118) +
			res(160, 118, 160, 190) +
			w([50, 190], [160, 190]) +
			gnd(105, 190) +
			`<g data-show="load">` +
			w([160, 118], [262, 118]) +
			res(262, 118, 262, 190) +
			w([160, 190], [262, 190]) +
			dot(160, 190) +
			tx(278, 150, 'Rн', 'start', 't t-s') +
			val(278, 165, 'RL', 'start', 't t-s t-mut') +
			`</g>` +
			tx(30, 116, 'U', 'end', 't t-s') +
			val(30, 131, 'U', 'end', 't t-s t-mut') +
			tx(176, 80, 'R1', 'start', 't t-s') +
			val(176, 95, 'R1', 'start', 't t-s t-mut') +
			tx(176, 150, 'R2', 'start', 't t-s') +
			val(176, 165, 'R2', 'start', 't t-s t-mut') +
			val(105, 40, 'i', 'middle') +
			val(148, 112, 'out', 'end'),
		params: [
			{ k: 'U', label: 'Источник U', unit: 'В', min: 1, max: 24, value: 12, step: 0.5 },
			{ k: 'R1', label: 'R1', unit: 'Ом', min: 100, max: 100e3, value: 10e3, log: true },
			{ k: 'R2', label: 'R2', unit: 'Ом', min: 100, max: 100e3, value: 10e3, log: true },
			{ k: 'RL', label: 'Нагрузка Rн', unit: 'Ом', min: 100, max: 1e6, value: 10e3, log: true },
		],
		toggles: [{ k: 'load', label: 'подключить нагрузку', value: false }],
		run: (p, t) => {
			const els: El[] = [
				{ t: 'V', p: 'top', n: '0', v: p.U },
				{ t: 'R', a: 'top', b: 'out', r: p.R1 },
				{ t: 'R', a: 'out', b: '0', r: p.R2 },
			];
			if (t.load) els.push({ t: 'R', a: 'out', b: '0', r: p.RL });
			const s = solve(els);
			const u = s.v.out;
			const i1 = cur(s, 1);
			const u0 = (p.U * p.R2) / (p.R1 + p.R2);
			const rth = (p.R1 * p.R2) / (p.R1 + p.R2);
			const warn: string[] = [];
			if (t.load && (u0 - u) / u0 > 0.1)
				warn.push(`Нагрузка просадила выход на ${Math.round(((u0 - u) / u0) * 100)} %. Правило: Rн хотя бы в 10 раз больше Rэ = R1‖R2 = ${R(rth)}.`);
			return {
				texts: { U: V(p.U), R1: R(p.R1), R2: R(p.R2), RL: R(p.RL), i: `I = ${A(i1)}`, out: `Uвых = ${V(u)}` },
				lines: [
					`<b>Uвых = ${V(u)}</b> (без нагрузки было бы ${V(u0)})`,
					`ток через R1: ${A(i1)}${t.load ? `, в нагрузку: ${A(u / p.RL)}` : ''}`,
					`выходное сопротивление делителя Rэ = R1‖R2 = ${R(rth)}`,
					`мощность на R1: ${W(i1 * i1 * p.R1)}`,
				],
				warn,
			};
		},
	},

	led: {
		title: 'Светодиод с резистором',
		w: 300,
		h: 215,
		alt: 'Источник U, резистор R и светодиод последовательно.',
		svg: () =>
			vsrc(50, 40, 170) +
			w([50, 40], [200, 40]) +
			res(200, 40, 200, 100) +
			`<circle data-glow cx="200" cy="130" r="18" fill="#ff5a3c" opacity="0"/>` +
			diode(200, 100, 200, 160, 'led') +
			w([200, 160], [200, 170], [50, 170]) +
			gnd(125, 170) +
			tx(30, 101, 'U', 'end', 't t-s') +
			val(30, 116, 'U', 'end', 't t-s t-mut') +
			tx(216, 66, 'R', 'start', 't t-s') +
			val(216, 81, 'R', 'start', 't t-s t-mut') +
			val(226, 134, 'uf') +
			val(125, 30, 'i', 'middle'),
		params: [
			{ k: 'U', label: 'Питание U', unit: 'В', min: 1, max: 15, value: 5, step: 0.1 },
			{ k: 'R', label: 'Резистор R', unit: 'Ом', min: 10, max: 10e3, value: 300, log: true },
			{ k: 'UF', label: 'Uпр светодиода (при 10 мА)', unit: 'В', min: 1.6, max: 3.4, value: 2, step: 0.05 },
		],
		run: (p) => {
			const s = solve([
				{ t: 'V', p: 'top', n: '0', v: p.U },
				{ t: 'R', a: 'top', b: 'a', r: p.R },
				{ t: 'D', a: 'a', k: '0', ...diodeFrom(p.UF) },
			]);
			const i = cur(s, 1);
			const uf = s.v.a;
			const warn: string[] = [];
			if (i > 0.03) warn.push('Больше 30 мА — индикаторный светодиод перегревается и быстро деградирует. Увеличь R.');
			if (i < 0.2e-3) warn.push('Ток меньше 0,2 мА — светодиод почти не светится: напряжения не хватает, чтобы его открыть.');
			return {
				texts: { U: V(p.U), R: R(p.R), uf: V(uf), i: `I = ${A(i)}` },
				lines: [
					`<b>I = ${A(i)}</b>`,
					`на светодиоде: ${V(uf)}, на резисторе: ${V(p.U - uf)}`,
					`мощность: резистор ${W(i * (p.U - uf))}, светодиод ${W(i * uf)}`,
					`расчёт «на бумаге»: I = (U − Uпр)/R = ${A(Math.max(0, (p.U - p.UF) / p.R))}`,
				],
				warn,
				glow: Math.min(1, i / 0.015),
			};
		},
	},

	zener: {
		title: 'Стабилизатор на стабилитроне',
		w: 340,
		h: 225,
		alt: 'Источник Uвх, последовательный резистор R, стабилитрон на землю, параллельно — нагрузка Rн.',
		svg: () =>
			vsrc(50, 50, 180) +
			w([50, 50], [90, 50]) +
			res(90, 50, 170, 50) +
			w([170, 50], [200, 50]) +
			dot(200, 50) +
			diode(200, 180, 200, 50, 'zener') +
			w([50, 180], [200, 180]) +
			gnd(125, 180) +
			`<g data-show="load">` +
			w([200, 50], [290, 50]) +
			res(290, 50, 290, 180) +
			w([200, 180], [290, 180]) +
			dot(200, 180) +
			tx(306, 110, 'Rн', 'start', 't t-s') +
			val(306, 125, 'RL', 'start', 't t-s t-mut') +
			`</g>` +
			tx(30, 111, 'Uвх', 'end', 't t-s') +
			val(30, 126, 'U', 'end', 't t-s t-mut') +
			tx(130, 36, 'R', 'middle', 't t-s') +
			val(130, 74, 'R', 'middle', 't t-s t-mut') +
			tx(216, 110, 'VD', 'start', 't t-s') +
			val(216, 125, 'uz', 'start', 't t-s t-mut') +
			val(245, 38, 'out', 'middle'),
		params: [
			{ k: 'U', label: 'Uвх', unit: 'В', min: 0, max: 20, value: 12, step: 0.1 },
			{ k: 'R', label: 'Резистор R', unit: 'Ом', min: 47, max: 4.7e3, value: 330, log: true },
			{ k: 'UZ', label: 'Uст стабилитрона', unit: 'В', min: 2.7, max: 12, value: 5.1, step: 0.1 },
			{ k: 'RL', label: 'Нагрузка Rн', unit: 'Ом', min: 100, max: 10e3, value: 1e3, log: true },
		],
		toggles: [{ k: 'load', label: 'подключить нагрузку', value: true }],
		run: (p, t) => {
			const els: El[] = [
				{ t: 'V', p: 'in', n: '0', v: p.U },
				{ t: 'R', a: 'in', b: 'out', r: p.R },
				{ t: 'D', a: '0', k: 'out', is: 1e-14, n: 1, bv: p.UZ, ibv: 5e-3, nbv: 2 },
			];
			if (t.load) els.push({ t: 'R', a: 'out', b: '0', r: p.RL });
			const s = solve(els);
			const u = s.v.out;
			const ir = cur(s, 1);
			const iz = -cur(s, 2);
			const il = t.load ? u / p.RL : 0;
			const warn: string[] = [];
			if (iz < 1e-3 && p.U > 0.5)
				warn.push('Через стабилитрон почти не идёт ток — он «выключился», и выход теперь просто делитель R и Rн. Уменьши R или подними Uвх.');
			if (iz * u > 0.5) warn.push(`На стабилитроне ${W(iz * u)} — маленький (0,5 Вт) сгорит.`);
			return {
				texts: { U: V(p.U), R: R(p.R), RL: R(p.RL), uz: `${V(p.UZ)}`, out: `Uвых = ${V(u)}` },
				lines: [
					`<b>Uвых = ${V(u)}</b>`,
					`ток через R: ${A(ir)} = стабилитрон ${A(iz)} + нагрузка ${A(il)}`,
					`мощность: стабилитрон ${W(iz * u)}, резистор ${W(ir * (p.U - u))}`,
				],
				warn,
			};
		},
	},

	switch: {
		title: 'Транзисторный ключ',
		w: 360,
		h: 240,
		alt: 'Вход через резистор Rб на базу NPN-транзистора, в коллекторе нагрузка Rк к плюсу питания, эмиттер на земле.',
		svg: () =>
			rail(230, 26, '+Uпит') +
			w([230, 26], [230, 46]) +
			res(230, 46, 230, 110) +
			w([230, 110], [230, 122]) +
			bjt(222, 150) +
			w([230, 178], [230, 196]) +
			gnd(230, 196) +
			term(40, 150) +
			w([44, 150], [70, 150]) +
			res(70, 150, 150, 150) +
			w([150, 150], [194, 150]) +
			tx(40, 136, 'Uвх', 'middle', 't t-s') +
			val(40, 176, 'U', 'middle', 't t-s t-mut') +
			tx(110, 138, 'Rб', 'middle', 't t-s') +
			val(110, 174, 'RB', 'middle', 't t-s t-mut') +
			tx(246, 74, 'Rк', 'start', 't t-s') +
			val(246, 89, 'RC', 'start', 't t-s t-mut') +
			val(248, 154, 'vce') +
			val(282, 26, 'vcc', 'start', 't t-s t-mut') +
			val(246, 112, 'ic'),
		params: [
			{ k: 'U', label: 'Uвх (вывод МК)', unit: 'В', min: 0, max: 5, value: 3.3, step: 0.05 },
			{ k: 'RB', label: 'Rб', unit: 'Ом', min: 100, max: 220e3, value: 1e3, log: true },
			{ k: 'RC', label: 'Нагрузка Rк', unit: 'Ом', min: 10, max: 10e3, value: 220, log: true },
			{ k: 'B', label: 'β транзистора', unit: '', min: 20, max: 500, value: 100, step: 10 },
			{ k: 'VCC', label: 'Uпит', unit: 'В', min: 3, max: 24, value: 12, step: 0.5 },
		],
		run: (p) => {
			const s = solve([
				{ t: 'V', p: 'in', n: '0', v: p.U },
				{ t: 'R', a: 'in', b: 'b', r: p.RB },
				{ t: 'Q', c: 'c', b: 'b', e: '0', bf: p.B },
				{ t: 'V', p: 'vcc', n: '0', v: p.VCC },
				{ t: 'R', a: 'vcc', b: 'c', r: p.RC },
			]);
			const ib = cur(s, 1),
				ic = cur(s, 4);
			const vce = s.v.c;
			const imax = p.VCC / p.RC;
			const mode = ic < 1e-6 ? 'отсечка (закрыт)' : vce < 0.3 ? 'насыщение (ключ замкнут)' : 'активный режим (ключ НЕ замкнут)';
			const warn: string[] = [];
			if (vce >= 0.3 && ic > 1e-6)
				warn.push(`Транзистор не насыщен: на нём ${V(vce)} и ${W(vce * ic)} тепла. Для ключа β·Iб должно быть в 5–10 раз больше тока нагрузки ${A(imax)} — уменьши Rб.`);
			return {
				texts: { U: V(p.U), RB: R(p.RB), RC: R(p.RC), vce: `Uкэ = ${V(vce)}`, vcc: V(p.VCC), ic: `Iк = ${A(ic)}` },
				lines: [
					`<b>${mode}</b>`,
					`Iб = ${A(ib)}, β·Iб = ${A(p.B * ib)}, Iк = ${A(ic)} (максимум, который даст нагрузка: ${A(imax)})`,
					`Uкэ = ${V(vce)}, мощность на транзисторе ${W(vce * ic)}`,
					`запас по насыщению: β·Iб / Iк.макс = ${(Math.max(0, (p.B * ib) / imax)).toFixed(1).replace('.', ',')}`,
				],
				warn,
			};
		},
	},

	follower: {
		title: 'Эмиттерный повторитель',
		w: 330,
		h: 240,
		alt: 'Сигнал через сопротивление источника на базу NPN-транзистора, коллектор к плюсу, эмиттер через Rэ на землю, выход с эмиттера.',
		svg: () =>
			rail(220, 26, '+Uпит') +
			w([220, 26], [220, 62]) +
			bjt(212, 90) +
			w([220, 118], [220, 140]) +
			res(220, 140, 220, 200) +
			gnd(220, 200) +
			dot(220, 130) +
			w([220, 130], [290, 130]) +
			term(294, 130) +
			term(36, 90) +
			w([40, 90], [60, 90]) +
			res(60, 90, 140, 90) +
			w([140, 90], [184, 90]) +
			tx(36, 76, 'Uвх', 'middle', 't t-s') +
			val(36, 114, 'U', 'middle', 't t-s t-mut') +
			tx(100, 78, 'Rист', 'middle', 't t-s') +
			val(100, 114, 'RS', 'middle', 't t-s t-mut') +
			tx(236, 170, 'Rэ', 'start', 't t-s') +
			val(236, 185, 'RE', 'start', 't t-s t-mut') +
			val(294, 118, 'out', 'middle') +
			val(272, 26, 'vcc', 'start', 't t-s t-mut'),
		params: [
			{ k: 'U', label: 'Uвх', unit: 'В', min: 0, max: 12, value: 5, step: 0.05 },
			{ k: 'RE', label: 'Rэ', unit: 'Ом', min: 47, max: 10e3, value: 1e3, log: true },
			{ k: 'RS', label: 'Сопротивление источника', unit: 'Ом', min: 10, max: 100e3, value: 1e3, log: true },
			{ k: 'B', label: 'β транзистора', unit: '', min: 20, max: 500, value: 100, step: 10 },
			{ k: 'VCC', label: 'Uпит', unit: 'В', min: 5, max: 24, value: 12, step: 0.5 },
		],
		run: (p) => {
			const s = solve([
				{ t: 'V', p: 'in', n: '0', v: p.U },
				{ t: 'R', a: 'in', b: 'b', r: p.RS },
				{ t: 'Q', c: 'vcc', b: 'b', e: 'e', bf: p.B },
				{ t: 'V', p: 'vcc', n: '0', v: p.VCC },
				{ t: 'R', a: 'e', b: '0', r: p.RE },
			]);
			const ue = s.v.e;
			const ie = ue / p.RE;
			const ib = cur(s, 1);
			const warn: string[] = [];
			if (p.U > p.VCC - 0.3) warn.push('Вход почти у плюса питания — транзистор уходит в насыщение, выход дальше не растёт.');
			if (ie > 0.1) warn.push(`Ток эмиттера ${A(ie)}, на транзисторе ${W((p.VCC - ue) * ie)} — маленький транзистор нагреется.`);
			return {
				texts: { U: V(p.U), RE: R(p.RE), RS: R(p.RS), out: V(ue), vcc: V(p.VCC) },
				lines: [
					`<b>Uвых = ${V(ue)}</b>, разница Uвх − Uвых = ${V(p.U - ue)} (≈ 0,6–0,7 В на переходе плюс Iб·Rист)`,
					`Iэ = ${A(ie)}, Iб = ${A(ib)} — источнику нужно отдать в β + 1 раз меньше`,
					`входное сопротивление ≈ (β + 1)·Rэ = ${R((p.B + 1) * p.RE)}`,
				],
				warn,
			};
		},
	},

	'ce-bias': {
		title: 'Рабочая точка каскада с общим эмиттером',
		w: 360,
		h: 260,
		alt: 'Делитель R1–R2 задаёт напряжение базы NPN-транзистора, в коллекторе Rк к плюсу, в эмиттере Rэ на землю; выход с коллектора.',
		svg: () =>
			rail(110, 26, '+Uпит') +
			rail(230, 26, '+Uпит') +
			w([110, 26], [110, 40]) +
			res(110, 40, 110, 116) +
			w([110, 116], [110, 150]) +
			dot(110, 135) +
			res(110, 150, 110, 220) +
			gnd(110, 220) +
			w([110, 135], [194, 135]) +
			w([230, 26], [230, 40]) +
			res(230, 40, 230, 100) +
			w([230, 100], [230, 107]) +
			bjt(222, 135) +
			w([230, 163], [230, 172]) +
			res(230, 172, 230, 226) +
			gnd(230, 226) +
			dot(230, 104) +
			w([230, 104], [300, 104]) +
			term(304, 104) +
			tx(94, 74, 'R1', 'end', 't t-s') +
			val(94, 89, 'R1', 'end', 't t-s t-mut') +
			tx(94, 182, 'R2', 'end', 't t-s') +
			val(94, 197, 'R2', 'end', 't t-s t-mut') +
			tx(246, 66, 'Rк', 'start', 't t-s') +
			val(246, 81, 'RC', 'start', 't t-s t-mut') +
			tx(246, 196, 'Rэ', 'start', 't t-s') +
			val(246, 211, 'RE', 'start', 't t-s t-mut') +
			val(150, 127, 'ub', 'middle') +
			val(304, 92, 'uc', 'middle') +
			val(246, 166, 'ue') +
			val(282, 26, 'vcc', 'start', 't t-s t-mut'),
		params: [
			{ k: 'VCC', label: 'Uпит', unit: 'В', min: 5, max: 24, value: 15, step: 0.5 },
			{ k: 'R1', label: 'R1 (верх делителя)', unit: 'Ом', min: 1e3, max: 1e6, value: 82e3, log: true },
			{ k: 'R2', label: 'R2 (низ делителя)', unit: 'Ом', min: 1e3, max: 1e6, value: 10e3, log: true },
			{ k: 'RC', label: 'Rк', unit: 'Ом', min: 100, max: 100e3, value: 10e3, log: true },
			{ k: 'RE', label: 'Rэ', unit: 'Ом', min: 100, max: 10e3, value: 1e3, log: true },
			{ k: 'B', label: 'β транзистора', unit: '', min: 20, max: 500, value: 100, step: 10 },
		],
		run: (p) => {
			const s = solve([
				{ t: 'V', p: 'vcc', n: '0', v: p.VCC },
				{ t: 'R', a: 'vcc', b: 'b', r: p.R1 },
				{ t: 'R', a: 'b', b: '0', r: p.R2 },
				{ t: 'R', a: 'vcc', b: 'c', r: p.RC },
				{ t: 'R', a: 'e', b: '0', r: p.RE },
				{ t: 'Q', c: 'c', b: 'b', e: 'e', bf: p.B },
			]);
			const ub = s.v.b,
				ue = s.v.e,
				uc = s.v.c;
			const ic = (p.VCC - uc) / p.RC;
			const vce = uc - ue;
			const re = ic > 1e-9 ? 0.025 / ic : Infinity;
			const k = p.RC / (p.RE + re);
			const warn: string[] = [];
			if (vce < 0.3 && ic > 1e-6) warn.push('Транзистор в насыщении: коллектор «лёг» на эмиттер, усиления нет. Уменьши ток (меньше Uб или больше Rэ) или Rк.');
			else if (ic < 1e-6) warn.push('Транзистор закрыт: Uб меньше ≈ 0,6 В.');
			else if (Math.abs(uc - (p.VCC + ue) / 2) > 0.25 * (p.VCC - ue))
				warn.push('Коллектор далеко от середины между Uэ и Uпит — сигнал будет ограничиваться с одной стороны раньше.');
			return {
				texts: { R1: R(p.R1), R2: R(p.R2), RC: R(p.RC), RE: R(p.RE), ub: `Uб = ${V(ub)}`, ue: `Uэ = ${V(ue)}`, uc: `Uк = ${V(uc)}`, vcc: V(p.VCC) },
				lines: [
					`<b>Iк = ${A(ic)}, Uкэ = ${V(vce)}</b>`,
					`Uб = ${V(ub)} → Uэ = Uб − 0,6…0,7 В = ${V(ue)} → Iэ = Uэ/Rэ`,
					`усиление по переменному току без шунтирования Rэ: K ≈ −Rк/(Rэ + rэ) = −${k.toFixed(1).replace('.', ',')} (rэ = 25 мВ/Iк = ${R(re)})`,
				],
				warn,
			};
		},
	},

	'oa-inv': {
		title: 'Инвертирующий усилитель на ОУ',
		w: 300,
		h: 180,
		alt: 'Вход через R1 на инвертирующий вход ОУ, R2 из выхода на инвертирующий вход, неинвертирующий вход на земле.',
		svg: () =>
			term(24, 86) +
			res(28, 86, 104, 86) +
			w([104, 86], [130, 86]) +
			dot(118, 86) +
			w([118, 86], [118, 40], [135, 40]) +
			res(135, 40, 200, 40) +
			w([200, 40], [215, 40], [215, 100]) +
			opamp(130, 100) +
			w([130, 114], [118, 114], [118, 124]) +
			gnd(118, 124) +
			w([200, 100], [246, 100]) +
			dot(215, 100) +
			term(250, 100) +
			tx(24, 72, 'Uвх', 'middle', 't t-s') +
			val(24, 110, 'U', 'middle', 't t-s t-mut') +
			tx(66, 76, 'R1', 'middle', 't t-s') +
			val(66, 106, 'R1', 'middle', 't t-s t-mut') +
			tx(167, 28, 'R2', 'middle', 't t-s') +
			val(167, 60, 'R2', 'middle', 't t-s t-mut') +
			val(250, 88, 'out', 'middle') +
			val(118, 164, 'um', 'middle', 't t-s t-mut'),
		params: [
			{ k: 'U', label: 'Uвх', unit: 'В', min: -5, max: 5, value: 1, step: 0.05 },
			{ k: 'R1', label: 'R1', unit: 'Ом', min: 1e3, max: 100e3, value: 10e3, log: true },
			{ k: 'R2', label: 'R2', unit: 'Ом', min: 1e3, max: 1e6, value: 47e3, log: true },
			{ k: 'VS', label: 'Питание ОУ ±', unit: 'В', min: 5, max: 15, value: 12, step: 0.5 },
		],
		run: (p) => {
			const sw = p.VS - 1.5;
			const s = solve([
				{ t: 'V', p: 'in', n: '0', v: p.U },
				{ t: 'R', a: 'in', b: 'm', r: p.R1 },
				{ t: 'R', a: 'm', b: 'out', r: p.R2 },
				{ t: 'OA', out: 'out', p: '0', m: 'm', vhi: sw, vlo: -sw },
			]);
			const out = s.v.out;
			const ideal = (-p.R2 / p.R1) * p.U;
			const warn: string[] = [];
			if (Math.abs(ideal) > sw)
				warn.push(`Насыщение: по формуле нужно ${V(ideal)}, а выход ОУ не выходит за ±${V(sw)} (типичный ОУ не доходит до шин питания примерно на 1,5 В). Виртуальной земли больше нет — на «−» уже ${V(s.v.m)}.`);
			return {
				texts: { U: V(p.U), R1: R(p.R1), R2: R(p.R2), out: `${V(out)}`, um: `U− = ${V(s.v.m)}` },
				lines: [
					`<b>Uвых = ${V(out)}</b>`,
					`K = −R2/R1 = −${(p.R2 / p.R1).toFixed(2).replace('.', ',')} → по формуле ${V(ideal)}`,
					`входное сопротивление схемы = R1 = ${R(p.R1)} (вход «−» — виртуальная земля)`,
				],
				warn,
			};
		},
	},

	'oa-noninv': {
		title: 'Неинвертирующий усилитель на ОУ',
		w: 300,
		h: 240,
		alt: 'Сигнал на неинвертирующий вход ОУ, делитель R2–R1 из выхода на инвертирующий вход.',
		svg: () =>
			term(36, 86) +
			w([40, 86], [130, 86]) +
			opamp(130, 100, { plusTop: true }) +
			w([130, 114], [115, 114], [115, 150]) +
			dot(115, 150) +
			w([115, 150], [140, 150]) +
			res(140, 150, 210, 150) +
			w([210, 150], [225, 150], [225, 100]) +
			res(115, 150, 115, 206) +
			gnd(115, 206) +
			w([200, 100], [256, 100]) +
			dot(225, 100) +
			term(260, 100) +
			tx(36, 72, 'Uвх', 'middle', 't t-s') +
			val(36, 110, 'U', 'middle', 't t-s t-mut') +
			tx(175, 138, 'R2', 'middle', 't t-s') +
			val(175, 172, 'R2', 'middle', 't t-s t-mut') +
			tx(131, 176, 'R1', 'start', 't t-s') +
			val(131, 191, 'R1', 'start', 't t-s t-mut') +
			val(260, 88, 'out', 'middle') +
			val(60, 150, 'um', 'start', 't t-s t-mut'),
		params: [
			{ k: 'U', label: 'Uвх', unit: 'В', min: -5, max: 5, value: 1, step: 0.05 },
			{ k: 'R2', label: 'R2 (выход → «−»)', unit: 'Ом', min: 1e3, max: 1e6, value: 47e3, log: true },
			{ k: 'R1', label: 'R1 («−» → земля)', unit: 'Ом', min: 1e3, max: 100e3, value: 10e3, log: true },
			{ k: 'VS', label: 'Питание ОУ ±', unit: 'В', min: 5, max: 15, value: 12, step: 0.5 },
		],
		run: (p) => {
			const sw = p.VS - 1.5;
			const s = solve([
				{ t: 'V', p: 'in', n: '0', v: p.U },
				{ t: 'R', a: 'out', b: 'm', r: p.R2 },
				{ t: 'R', a: 'm', b: '0', r: p.R1 },
				{ t: 'OA', out: 'out', p: 'in', m: 'm', vhi: sw, vlo: -sw },
			]);
			const out = s.v.out;
			const k = 1 + p.R2 / p.R1;
			const warn: string[] = [];
			if (Math.abs(k * p.U) > sw) warn.push(`Насыщение: по формуле нужно ${V(k * p.U)}, а выход ограничен ±${V(sw)}.`);
			return {
				texts: { U: V(p.U), R1: R(p.R1), R2: R(p.R2), out: `${V(out)}`, um: `U− = ${V(s.v.m)}` },
				lines: [
					`<b>Uвых = ${V(out)}</b>`,
					`K = 1 + R2/R1 = ${k.toFixed(2).replace('.', ',')}; на «−» то же, что на «+»: ${V(s.v.m)}`,
					`вход схемы — сразу вход ОУ: сопротивление огромное, источник не нагружается`,
				],
				warn,
			};
		},
	},
};
