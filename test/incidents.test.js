import assert from 'node:assert/strict';
import { test } from 'node:test';
import { berlinTime, incidentDays, parseIncident } from '../src/incidents.js';

const entry = (meta) => `---\n${meta}\n---\n# Gespräche brachen ab\n\nText.\n`;

test('Zeiten in Berliner Ortszeit, Sommer- und Winterzeit', () => {
	assert.equal(berlinTime('2026-10-20 14:20').toISOString(), '2026-10-20T12:20:00.000Z');
	assert.equal(berlinTime('2026-12-01 14:20').toISOString(), '2026-12-01T13:20:00.000Z');
	assert.equal(berlinTime('20.10.2026'), null);
});

test('Vorfall mit Frontmatter wird gelesen', () => {
	const i = parseIncident(
		entry('datum: 2026-10-17 12:05\nkomponenten: sprachverarbeitung, anrufannahme\nschwere: ausfall\ngelöst: 2026-10-17 13:10'),
		'x'
	);
	assert.equal(i.title, 'Gespräche brachen ab');
	assert.deepEqual(i.components, ['sprachverarbeitung', 'anrufannahme']);
	assert.equal(i.severity, 'outage');
	assert.equal(i.resolved, true);
	assert.equal(i.text, 'Text.');
});

test('unbekannte Komponente bricht ab statt still zu fehlen', () => {
	assert.throws(
		() => parseIncident(entry('datum: 2026-10-17\nkomponenten: telefon\nschwere: ausfall'), 'x'),
		/unbekannte Komponente „telefon“/
	);
});

test('offener Vorfall reicht bis heute', () => {
	const i = parseIncident(entry('datum: 2026-10-17 12:05\nkomponenten: portal\nschwere: eingeschränkt\ngelöst: nein'), 'x');
	assert.deepEqual(incidentDays(i, new Date('2026-10-20T10:00:00Z')), ['2026-10-17', '2026-10-20']);
});
