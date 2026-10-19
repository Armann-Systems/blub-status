// Bewertung einer Messung: ein Zustand je Komponente für das Intervall dieser Messung.
import { COMPONENTS } from './components.js';

/** Hat der Server geantwortet, ohne selbst einen Fehler zu melden? 4xx zählt als Antwort. */
export const answered = (p) => p.status !== undefined && p.status < 500;

/**
 * blub.ai nicht erreichbar oder die Datenbank weg: Für Kunden geht dann nichts, alle Komponenten
 * sind Ausfall, auch wenn einzelne Kennzahlen noch gut aussehen. Fehlt nur /api/status, bleibt das
 * Portal bewertbar und der Rest ist „keine Daten“, nicht grün.
 */
export function evaluate(m) {
	const down = !answered(m.site) || !answered(m.health) || m.api.db === false;
	const states = {};
	for (const c of COMPONENTS) {
		if (down) states[c.id] = 'outage';
		else if (c.usesApi === false || m.api.db === true) states[c.id] = c.rate(m);
		else states[c.id] = 'none';
	}
	return states;
}
