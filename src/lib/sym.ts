/**
 * Переключатель стиля обозначений на схемах: «как в книге» (по умолчанию), ГОСТ, IEC, ANSI.
 * Выбор хранится в localStorage и действует на весь сайт. Атрибут <html data-sym> ставится
 * ещё в <head> (см. astro.config.mjs), чтобы схема не «мигала» при загрузке.
 * В IEC/ANSI заодно меняются буквенные обозначения: VT → Q, VD → D, DA → U, HL → LED.
 */
export type Sym = 'book' | 'gost' | 'iec' | 'ansi';
const KEY = 'pcb-sym';
const REF: [RegExp, string][] = [
	[/^VT(\d*)$/, 'Q$1'],
	[/^VD(\d*)$/, 'D$1'],
	[/^DA(\d*)$/, 'U$1'],
	[/^HL(\d*)$/, 'LED$1'],
];

export function getSym(): Sym {
	return (document.documentElement.dataset.sym as Sym) || 'book';
}

function swapRefs(mode: Sym) {
	const intl = mode === 'iec' || mode === 'ansi';
	document.querySelectorAll<SVGTextElement>('.diagram__body svg text').forEach((t) => {
		const orig = t.dataset.g ?? t.textContent ?? '';
		if (!REF.some(([re]) => re.test(orig))) return;
		t.dataset.g = orig;
		let v = orig;
		if (intl) for (const [re, to] of REF) v = v.replace(re, to);
		t.textContent = v;
	});
}

export function setSym(mode: Sym) {
	if (mode === 'book') delete document.documentElement.dataset.sym;
	else document.documentElement.dataset.sym = mode;
	try {
		localStorage.setItem(KEY, mode);
	} catch {
		/* хранилище недоступно */
	}
	sync();
}

function sync() {
	const mode = getSym();
	document.querySelectorAll<HTMLSelectElement>('select[data-sym]').forEach((s) => (s.value = mode));
	document.querySelectorAll<HTMLInputElement>('input[data-sym]').forEach((r) => (r.checked = r.value === mode));
	swapRefs(mode);
}

if (!(window as any).__pcbSym) {
	(window as any).__pcbSym = true;
	document.addEventListener('change', (e) => {
		const t = e.target as HTMLInputElement | HTMLSelectElement;
		if (t.matches?.('[data-sym]')) setSym(t.value as Sym);
	});
	window.addEventListener('storage', (e) => {
		if (e.key !== KEY) return;
		const m = (e.newValue as Sym) || 'book';
		if (m === 'book') delete document.documentElement.dataset.sym;
		else document.documentElement.dataset.sym = m;
		sync();
	});
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync);
	else sync();
}
