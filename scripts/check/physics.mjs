#!/usr/bin/env node
/**
 * Тесты «физики»: решатель живых схем (src/lib/mna.ts) и разбор/вывод величин (src/lib/units.ts)
 * сверяются с ручным расчётом. Запуск: node scripts/check/physics.mjs (Node 22.18+ понимает .ts сам).
 */
import { solve, diodeFrom } from '../../src/lib/mna.ts';
import { parseValue, formatValue, nearestE24, seriesNeighbors, SERIES } from '../../src/lib/units.ts';

let fail = 0,
	n = 0;
function near(name, got, want, tol = 0.02) {
	n++;
	const ok = Math.abs(got - want) <= Math.abs(want) * tol + 1e-12;
	if (!ok) fail++;
	console.log(`${ok ? '✓' : '✗'} ${name}: ${+got.toPrecision(5)} (ожидалось ${want}${tol ? ` ±${tol * 100}%` : ''})`);
}
function eq(name, got, want) {
	n++;
	const ok = got === want;
	if (!ok) fail++;
	console.log(`${ok ? '✓' : '✗'} ${name}: «${got}»${ok ? '' : ` (ожидалось «${want}»)`}`);
}
function between(name, got, lo, hi) {
	n++;
	const ok = got >= lo && got <= hi;
	if (!ok) fail++;
	console.log(`${ok ? '✓' : '✗'} ${name}: ${+got.toPrecision(4)} (в пределах ${lo}…${hi})`);
}

console.log('— Решатель цепей —');
let s = solve([
	{ t: 'V', p: '1', n: '0', v: 12 },
	{ t: 'R', a: '1', b: '2', r: 10e3 },
	{ t: 'R', a: '2', b: '0', r: 10e3 },
	{ t: 'R', a: '2', b: '0', r: 10e3 },
]);
near('делитель 12 В, 10к/(10к‖10к)', s.v['2'], 4);

s = solve([
	{ t: 'V', p: '1', n: '0', v: 5 },
	{ t: 'R', a: '1', b: '2', r: 300 },
	{ t: 'D', a: '2', k: '0', ...diodeFrom(2.0) },
]);
near('светодиод: ток при 5 В / 300 Ом / Uпр 2 В', s.cur(1), 0.01, 0.01);

s = solve([
	{ t: 'V', p: '1', n: '0', v: 1 },
	{ t: 'R', a: '1', b: '2', r: 1e3 },
	{ t: 'D', a: '2', k: '0', is: 1e-14, n: 1 },
]);
between('кремниевый диод: Uпр при ~0,3 мА', s.v['2'], 0.55, 0.7);

s = solve([
	{ t: 'V', p: 'in', n: '0', v: 3.3 },
	{ t: 'R', a: 'in', b: 'b', r: 1e3 },
	{ t: 'Q', c: 'c', b: 'b', e: '0', bf: 100 },
	{ t: 'V', p: 'vcc', n: '0', v: 12 },
	{ t: 'R', a: 'vcc', b: 'c', r: 220 },
]);
between('ключ в насыщении: Uкэ', s.v['c'], 0.02, 0.2);

s = solve([
	{ t: 'V', p: 'in', n: '0', v: 3.3 },
	{ t: 'R', a: 'in', b: 'b', r: 100e3 },
	{ t: 'Q', c: 'c', b: 'b', e: '0', bf: 100 },
	{ t: 'V', p: 'vcc', n: '0', v: 12 },
	{ t: 'R', a: 'vcc', b: 'c', r: 220 },
]);
near('ключ в активном режиме: Iк ≈ β·(3,3 − Uбэ)/100к', s.cur(4), (100 * (3.3 - 0.67)) / 100e3, 0.05);

s = solve([
	{ t: 'V', p: 'in', n: '0', v: 1 },
	{ t: 'R', a: 'in', b: 'm', r: 10e3 },
	{ t: 'R', a: 'm', b: 'out', r: 47e3 },
	{ t: 'OA', out: 'out', p: '0', m: 'm', vhi: 10.5, vlo: -10.5 },
]);
near('инвертирующий усилитель K = −4,7', s.v.out, -4.7, 0.005);
near('виртуальная земля на «−»', Math.abs(s.v.m) < 1e-3 ? 0 : s.v.m, 0, 0);

s = solve([
	{ t: 'V', p: 'in', n: '0', v: 3 },
	{ t: 'R', a: 'in', b: 'm', r: 10e3 },
	{ t: 'R', a: 'm', b: 'out', r: 47e3 },
	{ t: 'OA', out: 'out', p: '0', m: 'm', vhi: 10.5, vlo: -10.5 },
]);
near('ОУ упирается в шину −10,5 В', s.v.out, -10.5, 0.01);

s = solve([
	{ t: 'V', p: '1', n: '0', v: 12 },
	{ t: 'R', a: '1', b: '2', r: 470 },
	{ t: 'D', a: '0', k: '2', is: 1e-14, n: 1, bv: 5.1, ibv: 5e-3, nbv: 2 },
]);
between('стабилитрон 5,1 В держит выход', s.v['2'], 5.05, 5.25);

console.log('— Величины —');
near('parseValue("4,7к")', parseValue('4,7к'), 4700, 0);
near('parseValue("4k7")', parseValue('4k7'), 4700, 0);
near('parseValue("100n")', parseValue('100n'), 1e-7, 1e-9);
near('parseValue("10мк")', parseValue('10мк'), 1e-5, 1e-9);
near('parseValue("−84м")', parseValue('−84м'), -0.084, 1e-9);
near('parseValue("50 Гц") — «Г» не гига', parseValue('50 Гц'), 50, 0);
eq('formatValue(0.0047, "А")', formatValue(0.0047, 'А'), '4,7 мА');
eq('formatValue(-4.7, "В") — настоящий минус', formatValue(-4.7, 'В'), '−4,7 В');
near('nearestE24(713)', nearestE24(713), 680, 0);
near('E96: ближайший к 5,1к', seriesNeighbors(5100, SERIES.E96.values).nearest, 5110, 0);
near('E12 снизу от 5,1к', seriesNeighbors(5100, SERIES.E12.values).below, 4700, 0);

console.log(`\n${n - fail} из ${n} тестов прошли${fail ? `, провалено: ${fail}` : ''}.`);
process.exit(fail ? 1 : 0);
