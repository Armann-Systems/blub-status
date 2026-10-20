import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DAYS, availability, dayKey, dayState, lastDays, tally } from '../src/days.js';

const keys = lastDays(new Date('2026-10-20T10:00:00Z'));
const counts = (rated) => tally(rated, ['a'], keys).a;

test('90 Kalendertage bis heute, ältester zuerst', () => {
	assert.equal(keys.length, DAYS);
	assert.equal(keys.at(-1), '2026-10-20');
	assert.equal(keys[0], '2026-07-23');
});

test('Tag ohne Messung ist grau, nie grün', () => {
	assert.equal(dayState(counts([])['2026-10-19']), 'none');
});

test('Intervall ohne Daten zählt nicht als Messung', () => {
	const day = counts([{ at: '2026-10-19T10:00:00Z', states: { a: 'none' } }])['2026-10-19'];
	assert.equal(dayState(day), 'none');
	assert.equal(availability([day]), null);
});

test('Tagesstrich zeigt den schlechtesten Zustand des Tages', () => {
	const at = (h) => `2026-10-19T${h}:00:00Z`;
	const c = counts([
		{ at: at('08'), states: { a: 'ok' } },
		{ at: at('09'), states: { a: 'degraded' } },
		{ at: at('10'), states: { a: 'ok' } },
		{ at: at('11'), states: { a: 'outage' } },
		{ at: '2026-10-18T09:00:00Z', states: { a: 'degraded' } },
		{ at: '2026-10-18T10:00:00Z', states: { a: 'ok' } }
	]);
	assert.equal(dayState(c['2026-10-19']), 'outage');
	assert.equal(dayState(c['2026-10-18']), 'degraded');
});

test('Tage zählen in Berlin: 23:30 UTC am 19. ist schon der 20.', () => {
	assert.equal(dayKey(new Date('2026-10-19T22:30:00Z')), '2026-10-20');
	assert.equal(dayKey(new Date('2026-01-19T23:30:00Z')), '2026-01-20');
});

test('Prozent: Messungen ohne Ausfall durch alle Messungen, eingeschränkt zählt als verfügbar', () => {
	assert.equal(availability([{ ok: 3, degraded: 1, outage: 0 }]), 100);
	assert.equal(availability([{ ok: 2, degraded: 0, outage: 0 }, { ok: 1, degraded: 0, outage: 1 }]), 75);
});

test('Prozent: abgerundet, damit fast 100 nie als 100 erscheint', () => {
	assert.equal(availability([{ ok: 2, degraded: 0, outage: 1 }]), 66.66);
	assert.equal(availability([{ ok: 99_999, degraded: 0, outage: 1 }]), 99.99);
});

test('Prozent ohne eine einzige Messung ist unbekannt, nicht 100', () => {
	assert.equal(availability([{ ok: 0, degraded: 0, outage: 0 }]), null);
});
