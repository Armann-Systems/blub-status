// Zustände: ok, degraded (eingeschränkt), outage (Ausfall), none (keine Daten). none ist kein
// guter Zustand, sondern ein unbekannter; er setzt sich gegen bekannte Zustände nie durch.
import { thresholds } from '../config/thresholds.js';

const RANK = { ok: 0, degraded: 1, outage: 2 };

export function worst(states) {
	let result = 'none';
	for (const s of states) {
		if (s !== 'none' && (result === 'none' || RANK[s] > RANK[result])) result = s;
	}
	return result;
}

/** Zustand eines Messwerts nach seiner Schwelle; fehlt der Wert, ist er unbekannt. */
export function grade(value, name) {
	if (value === null || value === undefined) return 'none';
	const rule = thresholds[name];
	const beyond = (limit) => limit !== undefined && (rule.below ? value < limit : value > limit);
	if (beyond(rule.outage)) return 'outage';
	if (beyond(rule.degraded)) return 'degraded';
	return 'ok';
}
