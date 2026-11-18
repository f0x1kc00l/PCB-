/**
 * Кнопка «Сброс» для интерактивных виджетов.
 *
 * Два режима:
 *  1. Виджет лежит в обёртке [data-reset-host] рядом с <template data-reset-tpl>
 *     (так делает WaterFrame). Сброс = живой элемент заменяется свежей копией
 *     исходной разметки: пропадает всё внутреннее состояние (сгоревший
 *     предохранитель, заряд, осциллограмма), а connectedCallback запускается заново.
 *  2. Обычный калькулятор. Сброс = все поля возвращаются к значениям из HTML,
 *     после чего им посылаются события input/change, чтобы пересчитался результат.
 */

function resetFields(root: Element) {
	const fields = root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select, textarea');
	for (const f of fields) {
		if (f instanceof HTMLSelectElement) {
			for (const o of f.options) o.selected = o.defaultSelected;
		} else if (f.type === 'radio' || f.type === 'checkbox') {
			f.checked = f.defaultChecked;
		} else {
			f.value = f.defaultValue;
		}
	}
	for (const f of fields) {
		// Невыбранным радиокнопкам событие не шлём — обработчик мог бы принять их значение.
		if (f instanceof HTMLInputElement && f.type === 'radio' && !f.checked) continue;
		f.dispatchEvent(new Event('input', { bubbles: true }));
		f.dispatchEvent(new Event('change', { bubbles: true }));
	}
}

if (!(window as any).__pcbReset) {
	(window as any).__pcbReset = true;
	document.addEventListener('click', (e) => {
		const btn = (e.target as Element | null)?.closest?.('[data-reset]');
		if (!btn) return;
		const host = btn.closest('[data-reset-host]');
		const tpl = host?.querySelector<HTMLTemplateElement>(':scope > template[data-reset-tpl]');
		const live = host?.querySelector(':scope > .pcb-widget');
		if (host && tpl && live) {
			const fresh = document.importNode(tpl.content.firstElementChild!, true);
			if (live.classList.contains('is-full')) fresh.classList.add('is-full');
			live.replaceWith(fresh);
			fresh.querySelector<HTMLElement>('[data-reset]')?.focus({ preventScroll: true });
			return;
		}
		const w = btn.closest('.pcb-widget');
		if (w) {
			resetFields(w);
			// Для состояния, которого нет в полях (например, выбранный слой).
			w.dispatchEvent(new CustomEvent('pcb-reset'));
		}
	});
}

/* Подсветка пар «вода ↔ электричество»: наведение, фокус или нажатие на .pair-hot. */
if (!(window as any).__pcbPairs) {
	(window as any).__pcbPairs = true;
	const set = (el: Element | null) => {
		const hot = el?.closest?.('.pair-hot') as SVGElement | null;
		const w = (hot ?? el)?.closest?.('.water') as HTMLElement | null;
		if (!w) return;
		const note = w.querySelector<HTMLElement>('[data-pairnote]');
		if (hot) {
			w.dataset.hl = hot.dataset.pair!;
			if (note) {
				note.dataset.def ??= note.textContent ?? '';
				note.textContent = hot.dataset.say ?? '';
			}
		}
	};
	document.addEventListener('pointerover', (e) => set(e.target as Element));
	document.addEventListener('focusin', (e) => set(e.target as Element));
	document.addEventListener('click', (e) => set(e.target as Element));
}

/* ===================================================================
 * Полный экран и ссылка на состояние виджета.
 *  [data-full]  — развернуть виджет на весь экран (CSS-оверлей: работает и на iOS, и в приложении).
 *  [data-share] — ссылка вида …/урок/#s=2.12~6~1 : номер виджета на странице и значения его полей.
 *  При открытии такой ссылки поля виджета выставляются, и страница прокручивается к нему.
 * =================================================================== */
const shareable = () => [...document.querySelectorAll<HTMLElement>('.pcb-widget')].filter((w) => w.querySelector('[data-share]'));
const fieldsOf = (w: Element) =>
	[...w.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')].filter((f) => !f.closest('template'));
const encode = (w: Element) =>
	fieldsOf(w)
		.map((f) => (f instanceof HTMLInputElement && (f.type === 'radio' || f.type === 'checkbox') ? (f.checked ? '1' : '0') : encodeURIComponent(f.value)))
		.join('~');

function applyState(w: Element, s: string) {
	const vals = s.split('~');
	const fs = fieldsOf(w);
	fs.forEach((f, i) => {
		const v = vals[i];
		if (v === undefined) return;
		if (f instanceof HTMLInputElement && (f.type === 'radio' || f.type === 'checkbox')) f.checked = v === '1';
		else f.value = decodeURIComponent(v);
	});
	for (const f of fs) {
		if (f instanceof HTMLInputElement && f.type === 'radio' && !f.checked) continue;
		f.dispatchEvent(new Event('input', { bubbles: true }));
		f.dispatchEvent(new Event('change', { bubbles: true }));
	}
}

function toast(w: Element, text: string) {
	let t = w.querySelector<HTMLElement>('.pcb-toast');
	if (!t) {
		t = document.createElement('div');
		t.className = 'pcb-toast';
		t.setAttribute('role', 'status');
		w.appendChild(t);
	}
	t.textContent = text;
	t.classList.add('is-on');
	clearTimeout((t as any)._h);
	(t as any)._h = setTimeout(() => t!.classList.remove('is-on'), 2600);
}

function setFull(w: HTMLElement, on: boolean) {
	w.classList.toggle('is-full', on);
	document.documentElement.classList.toggle('pcb-noscroll', on);
	const b = w.querySelector<HTMLElement>('[data-full]');
	if (b) {
		b.setAttribute('aria-pressed', String(on));
		b.title = on ? 'Свернуть' : 'На весь экран';
	}
}

if (!(window as any).__pcbTools) {
	(window as any).__pcbTools = true;
	document.addEventListener('click', async (e) => {
		const t = e.target as Element | null;
		const full = t?.closest?.('[data-full]');
		if (full) {
			const w = full.closest<HTMLElement>('.pcb-widget')!;
			setFull(w, !w.classList.contains('is-full'));
			return;
		}
		const sh = t?.closest?.('[data-share]');
		if (!sh) return;
		const w = sh.closest<HTMLElement>('.pcb-widget')!;
		const i = shareable().indexOf(w);
		// в Android-приложении адрес внутренний (https://localhost/…) — подставляем публичный адрес сайта
		const path = location.pathname.replace(/index\.html$/, '');
		let origin = location.origin;
		if ((window as any).Capacitor) {
			const site = document.documentElement.dataset.site;
			if (!site) {
				toast(w, 'Поделиться ссылкой можно с сайта курса — в приложении у страниц нет публичного адреса.');
				return;
			}
			origin = site.replace(/\/$/, '');
		}
		const url = `${origin}${path}#s=${i}.${encode(w)}`;
		const title = w.querySelector('.pcb-widget__title')?.textContent?.trim() ?? document.title;
		try {
			if (navigator.share && matchMedia('(pointer: coarse)').matches) {
				await navigator.share({ title, url });
				return;
			}
		} catch {
			/* пользователь закрыл меню «Поделиться» — пробуем буфер обмена */
		}
		try {
			await navigator.clipboard.writeText(url);
			toast(w, 'Ссылка скопирована: по ней откроется это же состояние.');
		} catch {
			window.prompt('Скопируй ссылку:', url);
		}
	});
	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape') return;
		const w = document.querySelector<HTMLElement>('.pcb-widget.is-full');
		if (w) setFull(w, false);
	});
	const restore = () => {
		const m = location.hash.match(/^#s=(\d+)\.(.*)$/);
		if (!m) return;
		const w = shareable()[+m[1]];
		if (!w) return;
		applyState(w, m[2]);
		w.scrollIntoView({ block: 'start' });
		w.classList.add('pcb-flash');
		setTimeout(() => w.classList.remove('pcb-flash'), 1800);
	};
	// ждём, пока все виджеты на странице оживут (их скрипты — модули, выполняются по порядку)
	if (document.readyState === 'complete') setTimeout(restore, 50);
	else window.addEventListener('load', () => setTimeout(restore, 50));
}
