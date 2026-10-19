// Tagesstriche und Verfügbarkeit über 90 Tage. Tage zählen in Europe/Berlin, so wie die Betriebe sie
// erleben. Jede Messung steht für ihr Zehn-Minuten-Intervall.
export const DAYS = 90;

const dayFormat = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Europe/Berlin',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

/** Kalendertag in Berlin als YYYY-MM-DD */
export const dayKey = (date) => dayFormat.format(date);

/** Die letzten 90 Kalendertage bis einschließlich heute, ältester zuerst. */
export function lastDays(now = new Date()) {
	// Mittag UTC: Beim Zurückzählen in ganzen Tagen stört die Zeitumstellung nicht.
	const today = Date.parse(`${dayKey(now)}T12:00:00Z`);
	return Array.from({ length: DAYS }, (_, i) =>
		new Date(today - (DAYS - 1 - i) * 86_400_000).toISOString().slice(0, 10)
	);
}

/**
 * Bewertete Intervalle je Komponente und Tag zählen. Intervalle ohne Daten zählen nicht: Ein Tag
 * ohne Messung bleibt leer und wird grau, nie grün.
 */
export function tally(rated, ids, keys) {
	const counts = {};
	for (const id of ids) {
		counts[id] = Object.fromEntries(keys.map((k) => [k, { ok: 0, degraded: 0, outage: 0 }]));
	}
	for (const { at, states } of rated) {
		const key = dayKey(new Date(at));
		for (const id of ids) {
			const day = counts[id][key];
			if (day && states[id] !== 'none') day[states[id]] += 1;
		}
	}
	return counts;
}

/** Tagesstrich: schlechtester Zustand des Tages; ohne Messung none. */
export function dayState(c) {
	if (c.outage) return 'outage';
	if (c.degraded) return 'degraded';
	return c.ok ? 'ok' : 'none';
}

/**
 * Verfügbarkeit in Prozent: gemessene Intervalle ohne Ausfall geteilt durch alle gemessenen.
 * Eingeschränkt zählt als verfügbar. Abgerundet, damit 99,996 % nicht als 100 % erscheint. Ohne
 * eine einzige Messung null.
 */
export function availability(days) {
	let measured = 0;
	let outage = 0;
	for (const c of days) {
		measured += c.ok + c.degraded + c.outage;
		outage += c.outage;
	}
	return measured ? Math.floor(((measured - outage) * 10_000) / measured) / 100 : null;
}
