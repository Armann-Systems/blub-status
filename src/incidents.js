// Vorfälle als Markdown in incidents/, von Menschen geschrieben. Frontmatter: datum, komponenten,
// schwere, gelöst. Zeiten in Berliner Ortszeit. Ein Fehler im Eintrag bricht den Bau ab, damit
// nichts halb Verstandenes auf der Seite landet.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { COMPONENTS } from './components.js';
import { dayKey } from './days.js';

const SEVERITY = { eingeschränkt: 'degraded', ausfall: 'outage' };
const COMPONENT_IDS = COMPONENTS.map((c) => c.id);

const berlinParts = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Europe/Berlin',
	hourCycle: 'h23',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit'
});

/** „2026-10-18 14:20“ in Berliner Ortszeit als Zeitpunkt; ohne Uhrzeit 0 Uhr. */
export function berlinTime(text) {
	const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/.exec(text);
	if (!m) return null;
	const [, y, mo, d, h = '0', mi = '0'] = m;
	const guess = Date.UTC(+y, mo - 1, +d, +h, +mi);
	// Berlin liegt eine oder zwei Stunden vor UTC; der Versatz an dieser Stelle korrigiert die Annahme.
	const p = Object.fromEntries(berlinParts.formatToParts(guess).map((x) => [x.type, +x.value]));
	const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
	return new Date(guess - (wall - guess));
}

export function parseIncident(text, id) {
	const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text.replace(/\r\n/g, '\n'));
	if (!match) throw new Error(`Vorfall ${id}: Frontmatter zwischen --- fehlt`);
	const meta = {};
	for (const line of match[1].split('\n').filter((l) => l.trim())) {
		const i = line.indexOf(':');
		meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
	}
	const fail = (what) => {
		throw new Error(`Vorfall ${id}: ${what}`);
	};
	const start = berlinTime(meta.datum ?? '') ?? fail('datum fehlt oder ist nicht JJJJ-MM-TT HH:MM');
	const components = (meta.komponenten ?? '')
		.replace(/[[\]]/g, '')
		.split(',')
		.map((c) => c.trim())
		.filter(Boolean);
	if (!components.length) fail('komponenten fehlt');
	for (const c of components) {
		if (!COMPONENT_IDS.includes(c)) fail(`unbekannte Komponente „${c}“, erlaubt: ${COMPONENT_IDS.join(', ')}`);
	}
	const severity = SEVERITY[meta.schwere] ?? fail('schwere muss „eingeschränkt“ oder „ausfall“ sein');
	const solved = meta['gelöst'] ?? 'nein';
	const end = solved === 'nein' || solved === 'ja' ? null : berlinTime(solved);
	if (solved !== 'nein' && solved !== 'ja' && !end) fail('gelöst muss „nein“, „ja“ oder ein Zeitpunkt sein');
	const body = match[2].trim();
	const title = /^# (.+)$/m.exec(body)?.[1].trim() ?? fail('Überschrift „# Titel“ fehlt');
	return {
		id,
		title,
		start,
		end,
		resolved: solved !== 'nein',
		severity,
		components,
		text: body.replace(/^# .+\n*/m, '')
	};
}

/** Alle Vorfälle, neueste zuerst. */
export function readIncidents(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith('.md'))
		.map((f) => parseIncident(readFileSync(join(dir, f), 'utf8'), basename(f, '.md')))
		.sort((a, b) => b.start - a.start);
}

/** Erster und letzter Kalendertag eines Vorfalls; offene reichen bis heute. */
export function incidentDays(incident, now = new Date()) {
	const last = incident.end ?? (incident.resolved ? incident.start : now);
	return [dayKey(incident.start), dayKey(last)];
}
