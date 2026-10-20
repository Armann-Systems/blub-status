// Deutsche Texte und Formate der Statusseite. Zeiten immer in Europe/Berlin.
const TIME_ZONE = 'Europe/Berlin';

export const STATE_LABEL = {
	ok: 'betriebsbereit',
	degraded: 'eingeschränkt',
	outage: 'Ausfall',
	none: 'keine Daten'
};

const format = (options) => new Intl.DateTimeFormat('de-DE', { timeZone: TIME_ZONE, ...options });
const stampTime = format({ hour: '2-digit', minute: '2-digit' });
const dateTime = format({
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});
const dayLong = format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const timeText = (iso) => stampTime.format(new Date(iso));
export const dateTimeText = (iso) => `${dateTime.format(new Date(iso))} Uhr`;
/** Tag aus YYYY-MM-DD; Mittag UTC liegt in Berlin immer auf demselben Kalendertag. */
export const dayText = (key) => dayLong.format(new Date(`${key}T12:00:00Z`));

const decimal = (v, digits) =>
	v.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const secondsText = (ms) => `${decimal(ms / 1000, ms < 10_000 ? 2 : 1)} s`;
export const percentText = (p) => `${decimal(p, 2)} %`;

/** „A“, „A und B“, „A, B und C“; enthält ein Name schon „und“, trennt „sowie“ eindeutig. */
export function nameList(names) {
	if (names.length < 2) return names.join('');
	const last = names.some((n) => n.includes(' und ')) ? ' sowie ' : ' und ';
	return `${names.slice(0, -1).join(', ')}${last}${names.at(-1)}`;
}

export function countsText({ ok, degraded, outage }) {
	const total = ok + degraded + outage;
	if (!total) return 'keine Messung';
	const parts = [total === 1 ? '1 Messung' : `${total} Messungen`];
	if (degraded) parts.push(`${degraded} eingeschränkt`);
	if (outage) parts.push(`${outage} mit Ausfall`);
	return parts.join(', ');
}

/** Satz zum Gesamtzustand nach der letzten Messung. */
export function headline(components, hasMeasurement) {
	const named = (state) => components.filter((c) => c.state === state).map((c) => c.name);
	if (!hasMeasurement) return 'Noch keine Messung.';
	if (named('outage').length === components.length) return 'Störung in allen Bereichen.';
	if (named('outage').length) return `Ausfall: ${nameList(named('outage'))}.`;
	if (named('degraded').length) return `Eingeschränkt: ${nameList(named('degraded'))}.`;
	if (named('ok').length === components.length) return 'Alles läuft normal.';
	if (named('ok').length) return 'Was gemessen wurde, läuft normal.';
	return 'Die letzte Messung hat keine Werte geliefert.';
}

/** Was die Überschrift nicht nennt: Eingeschränktes neben Ausfällen und Bereiche ohne Werte. */
export function headlineDetails(components) {
	const named = (state) => components.filter((c) => c.state === state).map((c) => c.name);
	const details = [];
	if (named('outage').length && named('degraded').length) {
		details.push(`Eingeschränkt: ${nameList(named('degraded'))}.`);
	}
	if (named('none').length && named('none').length < components.length) {
		details.push(`Ohne aktuelle Werte: ${nameList(named('none'))}.`);
	}
	return details;
}

export const OVERALL_STAMP = {
	ok: 'betriebsbereit',
	degraded: 'eingeschränkt',
	outage: 'Störung',
	none: 'keine Daten'
};
