/**
 * Таблица соответствия условных графических обозначений (УГО): ГОСТ ↔ IEC ↔ ANSI.
 *
 * Каждый символ — фрагмент SVG в системе координат viewBox="0 0 80 40":
 * выводы подходят слева и справа на высоте y = 20. Цвет линий — currentColor,
 * поэтому символы сами подстраиваются под светлую и тёмную тему.
 *
 * Источники:
 *   ГОСТ 2.721-74 (общего применения), 2.723-68 (катушки), 2.727-68 (предохранители),
 *   2.728-74 (резисторы, конденсаторы), 2.730-73 (полупроводниковые приборы),
 *   2.743-91 (цифровая техника), 2.759-82 (аналоговая техника), 2.768-90 (химические источники),
 *   2.710-81 (буквенно-цифровые обозначения);
 *   IEC 60617 (графические символы для схем); IEEE 315-1975 / ANSI Y32.2 (американская практика).
 *
 * Размеры по ГОСТ условны: важна форма и пропорции (резистор 10×4 мм и т.п.).
 */

export interface SymbolRow {
	id: string;
	name: string;
	en: string;
	gost: string; // SVG
	iec: string;
	ansi: string;
	gostStd: string; // номер ГОСТ
	refGost: string; // позиционное обозначение по ГОСТ 2.710
	refIntl: string; // обычное в зарубежных схемах и в библиотеках Altium
	note?: string;
}

// ---- Повторно используемые фрагменты ----
const leadL = (to: number) => `<line x1="0" y1="20" x2="${to}" y2="20"/>`;
const leadR = (from: number) => `<line x1="${from}" y1="20" x2="80" y2="20"/>`;
const rect = `<rect x="20" y="13" width="40" height="14"/>`;
const zigzag = `<polyline points="0,20 20,20 23.3,12 30,28 36.7,12 43.3,28 50,12 56.7,28 60,20 80,20"/>`;
const wiperArrow = `<line x1="40" y1="40" x2="40" y2="33"/><polygon points="36,33 44,33 40,27" fill="currentColor"/>`;
const plates = `<line x1="36" y1="8" x2="36" y2="32" stroke-width="2.5"/><line x1="44" y1="8" x2="44" y2="32" stroke-width="2.5"/>`;
const plus = (x: number, y: number) => `<text x="${x}" y="${y}" font-size="11" fill="currentColor" stroke="none">+</text>`;
const humps = `<path d="M0 20 H20 A5 5 0 0 1 30 20 A5 5 0 0 1 40 20 A5 5 0 0 1 50 20 A5 5 0 0 1 60 20 H80"/>`;
const triOutline = `<polygon points="30,10 30,30 48,20"/>`;
const triFilled = `<polygon points="30,10 30,30 48,20" fill="currentColor"/>`;
const bar = `<line x1="48" y1="10" x2="48" y2="30"/>`;
const ledArrows = `<g><line x1="40" y1="10" x2="47" y2="3"/><polyline points="43,3 47,3 47,7"/><line x1="47" y1="13" x2="54" y2="6"/><polyline points="50,6 54,6 54,10"/></g>`;
const npnBody = (circle: boolean) =>
	`${circle ? '<circle cx="40" cy="20" r="16"/>' : ''}` +
	`<line x1="0" y1="20" x2="32" y2="20"/><line x1="32" y1="10" x2="32" y2="30" stroke-width="2.5"/>` +
	`<line x1="32" y1="15" x2="46" y2="7"/><line x1="46" y1="7" x2="46" y2="0"/>` +
	`<line x1="32" y1="25" x2="46" y2="33"/><line x1="46" y1="33" x2="46" y2="40"/>` +
	`<polygon points="43.9,31.8 37.2,31.4 40.2,26.2" fill="currentColor"/>`;
const inputs2 = `<line x1="0" y1="12" x2="22" y2="12"/><line x1="0" y1="28" x2="22" y2="28"/>`;
const label = (x: number, y: number, t: string, size = 9) =>
	`<text x="${x}" y="${y}" font-size="${size}" fill="currentColor" stroke="none" text-anchor="middle">${t}</text>`;
const groundBars = `<line x1="40" y1="0" x2="40" y2="22"/><line x1="26" y1="22" x2="54" y2="22"/><line x1="31" y1="28" x2="49" y2="28"/><line x1="36" y1="34" x2="44" y2="34"/>`;

export const symbols: SymbolRow[] = [
	{
		id: 'resistor',
		name: 'Резистор постоянный',
		en: 'Resistor',
		gost: leadL(20) + rect + leadR(60),
		iec: leadL(20) + rect + leadR(60),
		ansi: zigzag,
		gostStd: 'ГОСТ 2.728',
		refGost: 'R',
		refIntl: 'R',
		note: 'Главное отличие американских схем — «пила» вместо прямоугольника.',
	},
	{
		id: 'pot',
		name: 'Резистор переменный (потенциометр)',
		en: 'Potentiometer',
		gost: leadL(20) + rect + leadR(60) + wiperArrow,
		iec: leadL(20) + rect + leadR(60) + wiperArrow,
		ansi: zigzag + wiperArrow,
		gostStd: 'ГОСТ 2.728',
		refGost: 'R',
		refIntl: 'R, RV',
	},
	{
		id: 'cap',
		name: 'Конденсатор',
		en: 'Capacitor',
		gost: leadL(36) + plates + leadR(44),
		iec: leadL(36) + plates + leadR(44),
		ansi: leadL(36) + plates + leadR(44),
		gostStd: 'ГОСТ 2.728',
		refGost: 'C',
		refIntl: 'C',
	},
	{
		id: 'cap-pol',
		name: 'Конденсатор полярный (электролитический)',
		en: 'Polarized capacitor',
		gost: leadL(36) + plates + leadR(44) + plus(24, 12),
		iec: leadL(36) + plates + leadR(44) + plus(24, 12),
		ansi:
			leadL(36) +
			`<line x1="36" y1="8" x2="36" y2="32" stroke-width="2.5"/><path d="M48 8 Q42 20 48 32" stroke-width="2.5"/>` +
			`<line x1="45" y1="20" x2="80" y2="20"/>` +
			plus(24, 12),
		gostStd: 'ГОСТ 2.728',
		refGost: 'C',
		refIntl: 'C',
		note: 'В американских схемах минусовая обкладка изогнута. Знак «+» — у плюсовой обкладки.',
	},
	{
		id: 'inductor',
		name: 'Катушка индуктивности, дроссель',
		en: 'Inductor',
		gost: humps,
		iec: humps,
		ansi: humps,
		gostStd: 'ГОСТ 2.723',
		refGost: 'L',
		refIntl: 'L',
	},
	{
		id: 'diode',
		name: 'Диод',
		en: 'Diode',
		gost: leadL(48) + triOutline + bar + leadR(48),
		iec: leadL(30) + triOutline + bar + leadR(48),
		ansi: leadL(30) + triFilled + bar + leadR(48),
		gostStd: 'ГОСТ 2.730',
		refGost: 'VD',
		refIntl: 'D (раньше CR)',
		note: 'Треугольник указывает направление прямого тока: от анода к катоду (черта).',
	},
	{
		id: 'zener',
		name: 'Стабилитрон',
		en: 'Zener diode',
		gost: leadL(48) + triOutline + bar + `<line x1="48" y1="10" x2="43" y2="10"/>` + leadR(48),
		iec: leadL(30) + triOutline + `<polyline points="52,6 48,10 48,30 44,34"/>` + leadR(48),
		ansi: leadL(30) + triFilled + `<polyline points="52,6 48,10 48,30 44,34"/>` + leadR(48),
		gostStd: 'ГОСТ 2.730',
		refGost: 'VD',
		refIntl: 'D, ZD',
	},
	{
		id: 'led',
		name: 'Светодиод',
		en: 'LED',
		gost: leadL(48) + triOutline + bar + leadR(48) + ledArrows,
		iec: leadL(30) + triOutline + bar + leadR(48) + ledArrows,
		ansi: leadL(30) + triFilled + bar + leadR(48) + ledArrows,
		gostStd: 'ГОСТ 2.730',
		refGost: 'VD, HL (индикатор)',
		refIntl: 'D, LED',
		note: 'Стрелки наружу — прибор излучает. У фотодиода стрелки направлены внутрь.',
	},
	{
		id: 'npn',
		name: 'Биполярный транзистор NPN',
		en: 'NPN transistor',
		gost: npnBody(true),
		iec: npnBody(true),
		ansi: npnBody(true),
		gostStd: 'ГОСТ 2.730',
		refGost: 'VT',
		refIntl: 'Q',
		note: 'Стрелка эмиттера у NPN направлена наружу, у PNP — внутрь.',
	},
	{
		id: 'opamp',
		name: 'Операционный усилитель',
		en: 'Operational amplifier',
		gost:
			`<rect x="22" y="4" width="36" height="32"/>` +
			`<line x1="0" y1="12" x2="19" y2="12"/><circle cx="20.5" cy="12" r="1.8"/><line x1="0" y1="28" x2="22" y2="28"/>` +
			leadR(58) +
			label(40, 16, '▷ ∞'),
		iec:
			`<rect x="22" y="4" width="36" height="32"/>` +
			inputs2 +
			leadR(58) +
			label(40, 16, '▷ ∞') +
			label(28, 15, '−', 10) +
			label(28, 31, '+', 10),
		ansi:
			`<polygon points="22,4 22,36 58,20"/>` + inputs2 + leadR(58) + label(28, 15, '−', 10) + label(28, 31, '+', 10),
		gostStd: 'ГОСТ 2.759',
		refGost: 'DA',
		refIntl: 'U, IC',
		note: 'По ГОСТ инвертирующий вход отмечают кружком (инверсия) на границе прямоугольника.',
	},
	{
		id: 'and',
		name: 'Логический элемент «И»',
		en: 'AND gate',
		gost: `<rect x="25" y="4" width="30" height="32"/>` + `<line x1="0" y1="12" x2="25" y2="12"/><line x1="0" y1="28" x2="25" y2="28"/>` + leadR(55) + label(40, 15, '&', 11),
		iec: `<rect x="25" y="4" width="30" height="32"/>` + `<line x1="0" y1="12" x2="25" y2="12"/><line x1="0" y1="28" x2="25" y2="28"/>` + leadR(55) + label(40, 15, '&', 11),
		ansi: `<path d="M25 4 H38 A16 16 0 0 1 38 36 H25 Z"/>` + `<line x1="0" y1="12" x2="25" y2="12"/><line x1="0" y1="28" x2="25" y2="28"/>` + leadR(54),
		gostStd: 'ГОСТ 2.743',
		refGost: 'DD',
		refIntl: 'U, IC',
		note: 'ГОСТ и IEC совпадают (прямоугольник с «&»), американская форма — «пуля».',
	},
	{
		id: 'fuse',
		name: 'Предохранитель',
		en: 'Fuse',
		gost: rect + `<line x1="0" y1="20" x2="80" y2="20"/>`,
		iec: rect + `<line x1="0" y1="20" x2="80" y2="20"/>`,
		ansi: `<path d="M0 20 H20 C27 6, 33 6, 40 20 S53 34, 60 20 H80"/>`,
		gostStd: 'ГОСТ 2.727',
		refGost: 'FU',
		refIntl: 'F',
		note: 'В американских схемах встречается и прямоугольная форма, как в IEC.',
	},
	{
		id: 'ground',
		name: 'Заземление, общий провод',
		en: 'Ground',
		gost: groundBars,
		iec: groundBars,
		ansi: groundBars,
		gostStd: 'ГОСТ 2.721',
		refGost: '—',
		refIntl: '— (в Altium — Power Port)',
		note: 'В Altium это не компонент, а порт питания (Power Port) со стилем Ground.',
	},
	{
		id: 'battery',
		name: 'Гальванический элемент, батарея',
		en: 'Battery cell',
		gost: leadL(36) + `<line x1="36" y1="6" x2="36" y2="34"/><line x1="44" y1="13" x2="44" y2="27" stroke-width="4"/>` + leadR(44) + plus(24, 12),
		iec: leadL(36) + `<line x1="36" y1="6" x2="36" y2="34"/><line x1="44" y1="13" x2="44" y2="27" stroke-width="4"/>` + leadR(44) + plus(24, 12),
		ansi: leadL(36) + `<line x1="36" y1="6" x2="36" y2="34"/><line x1="44" y1="13" x2="44" y2="27" stroke-width="4"/>` + leadR(44) + plus(24, 12),
		gostStd: 'ГОСТ 2.768',
		refGost: 'GB',
		refIntl: 'BT',
		note: 'Длинная тонкая черта — плюс, короткая толстая — минус.',
	},
];
