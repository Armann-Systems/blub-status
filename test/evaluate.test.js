import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate } from '../src/evaluate.js';
import { healthy } from './fixtures.js';

const allStates = (states) => [...new Set(Object.values(states))];

test('gesunde Messung: alle Komponenten betriebsbereit', () => {
	assert.deepEqual(allStates(evaluate(healthy())), ['ok']);
});

test('blub.ai antwortet nicht: alle Komponenten Ausfall, auch wenn /api/status gut aussieht', () => {
	const m = healthy();
	m.site = { error: 'timeout', ms: 10000 };
	assert.deepEqual(allStates(evaluate(m)), ['outage']);
});

test('/api/health mit 5xx: alle Komponenten Ausfall', () => {
	const m = healthy();
	m.health = { status: 502, ms: 30 };
	assert.deepEqual(allStates(evaluate(m)), ['outage']);
});

test('Datenbank weg: alle Komponenten Ausfall', () => {
	const m = healthy();
	m.api = { ...m.api, db: false };
	assert.deepEqual(allStates(evaluate(m)), ['outage']);
});

test('/api/status nicht lesbar: Portal bewertet, alles andere keine Daten statt grün', () => {
	const m = healthy();
	m.api = { status: 429, ms: 20 };
	const states = evaluate(m);
	assert.equal(states.portal, 'ok');
	assert.deepEqual(allStates({ ...states, portal: 'none' }), ['none']);
});

test('Schwellen: Quote unter gelb ist eingeschränkt, unter rot Ausfall', () => {
	const m = healthy();
	m.api.linesRatio = 0.8;
	assert.equal(evaluate(m).anrufannahme, 'degraded');
	m.api.linesRatio = 0.4;
	assert.equal(evaluate(m).anrufannahme, 'outage');
});

test('Schwellen: Worker ohne Lebenszeichen hält alles an, was er abarbeitet', () => {
	const m = healthy();
	m.api.workerAgeS = 900;
	const states = evaluate(m);
	assert.equal(states.nacharbeit, 'outage');
	assert.equal(states.benachrichtigungen, 'outage');
	assert.equal(states.webhooks, 'outage');
	assert.equal(states.anrufannahme, 'ok');
});

test('ohne Gespräche gilt der 24-h-Wert der Sprachverbindung, ohne beide keine Daten', () => {
	const m = healthy();
	m.api.speechErrorRatio1h = null;
	m.api.speechErrorRatio24h = 0.05;
	assert.equal(evaluate(m).sprachverarbeitung, 'degraded');
	m.api.speechErrorRatio24h = null;
	assert.equal(evaluate(m).sprachverarbeitung, 'none');
});
