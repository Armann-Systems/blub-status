// Läuft im Browser, eingebettet in index.html. Zeiger und Finger zeigen die Notiz zum Tag, Pfeiltasten
// wandern durch die Tage (ein Tabstopp je Komponente). Ohne Skript bleibt alles lesbar: Jeder
// Tagesstrich trägt seinen Text für Screenreader.
for (const strip of document.querySelectorAll('.strip')) {
	const list = strip.querySelector('.days');
	const bars = [...strip.querySelectorAll('.day')];
	const tip = strip.querySelector('.tip');

	const show = (bar) => {
		const lines = [...bar.querySelectorAll('[data-part]')].map((part) => {
			const line = document.createElement('p');
			line.className = `tip-${part.dataset.part}`;
			line.textContent = part.textContent;
			return line;
		});
		tip.replaceChildren(...lines);
		tip.className = `tip ${[...bar.classList].find((c) => c.startsWith('s-'))}`;
		tip.hidden = false;
		const box = strip.getBoundingClientRect();
		const rect = bar.getBoundingClientRect();
		const center = rect.left + rect.width / 2 - box.left;
		const left = Math.min(Math.max(center - tip.offsetWidth / 2, 0), box.width - tip.offsetWidth);
		tip.style.left = `${left}px`;
		tip.style.setProperty('--arrow', `${center - left}px`);
		for (const b of bars) b.classList.toggle('is-active', b === bar);
	};
	const hide = () => {
		tip.hidden = true;
		for (const b of bars) b.classList.remove('is-active');
	};
	// Auf dem Handy ist ein Strich keine 3 px breit: Der Tag ergibt sich aus der Position im Streifen.
	const barAt = (x) => {
		const r = list.getBoundingClientRect();
		const i = Math.floor(((x - r.left) / r.width) * bars.length);
		return bars[Math.min(bars.length - 1, Math.max(0, i))];
	};
	const focusBar = (bar) => {
		for (const b of bars) b.tabIndex = b === bar ? 0 : -1;
		bar.focus();
	};

	list.addEventListener('pointermove', (e) => show(barAt(e.clientX)));
	list.addEventListener('pointerdown', (e) => show(barAt(e.clientX)));
	list.addEventListener('pointerleave', () => {
		if (bars.includes(document.activeElement)) show(document.activeElement);
		else hide();
	});
	// detail 0: per Tastatur ausgelöst, dann gilt der fokussierte Strich, nicht die Zeigerposition
	list.addEventListener('click', (e) => {
		if (e.detail) focusBar(barAt(e.clientX));
	});
	strip.addEventListener('focusin', (e) => show(e.target));
	strip.addEventListener('focusout', (e) => {
		if (!strip.contains(e.relatedTarget)) hide();
	});
	strip.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') return hide();
		const i = bars.indexOf(document.activeElement);
		const next = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: bars.length - 1 }[e.key];
		if (next === undefined || !bars[next]) return;
		e.preventDefault();
		focusBar(bars[next]);
	});
}

// Die Seite ist statisch. Bleibt die Messung aus, stünde hier still ein alter Stand; ab 45 Minuten
// (Zeitpläne der Action verspäten sich manchmal um 20 Minuten) sagt die Seite das selbst.
const lead = document.querySelector('[data-measured-at]');
const minutes = Math.floor((Date.now() - Date.parse(lead?.dataset.measuredAt ?? '')) / 60_000);
if (minutes > 45) {
	const note = document.createElement('p');
	note.className = 'stale';
	const age = minutes < 120 ? `${minutes} Minuten` : `${Math.floor(minutes / 60)} Stunden`;
	note.textContent = `Die letzte Messung ist ${age} alt. Der Zustand oben kann veraltet sein.`;
	lead.after(note);
}
