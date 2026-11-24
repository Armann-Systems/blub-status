// Bewertung einer Messung: ein Zustand je Komponente für das Intervall dieser Messung.
import { COMPONENTS } from './components.js';

/** Hat der Server geantwortet, ohne selbst einen Fehler zu melden? 4xx zählt als Antwort. */
export const answered = (p) => p.status !== undefined && p.status < 500;

/**
 * Kein Verbindungsaufbau zu einer Adresse, während blub.ai in derselben Messung auf einer anderen
 * geantwortet hat: Dann lag es am Messrechner, nicht an blub, und die Adresse zählt als nicht
 * gemessen. Der GitHub-Runner bricht den Aufbau nach Sekundenbruchteilen mit ETIMEDOUT ab, bei
 * keinem dieser Fälle war blub.ai weg. Die 10-s-Zeitüberschreitung bleibt ein echter Ausfall.
 */
function measured(p, reached) {
	return reached && p.error !== undefined && p.error !== 'timeout' ? null : p;
}

/**
 * blub.ai nicht erreichbar oder die Datenbank weg: Für Kunden geht dann nichts, alle Komponenten
 * sind Ausfall, auch wenn einzelne Kennzahlen noch gut aussehen. Fehlt nur /api/status, bleibt das
 * Portal bewertbar und der Rest ist „keine Daten“, nicht grün.
 */
export function evaluate(m) {
	const reached = [m.site, m.health, m.api].some(answered);
	const site = measured(m.site, reached);
	const health = measured(m.health, reached);
	const down = [site, health].some((p) => p && !answered(p)) || m.api.db === false;
	const states = {};
	for (const c of COMPONENTS) {
		if (down) states[c.id] = 'outage';
		else if (c.usesApi === false) states[c.id] = c.rate({ ...m, site, health });
		else if (m.api.db === true) states[c.id] = c.rate(m);
		else states[c.id] = 'none';
	}
	return states;
}
