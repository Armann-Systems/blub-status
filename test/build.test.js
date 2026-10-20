import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildStatus } from '../src/build.js';
import { renderPage } from '../src/render.js';
import { append } from '../src/store.js';
import { healthy } from './fixtures.js';

const now = new Date('2026-10-20T10:05:00Z');

async function setup(incident) {
	const dir = mkdtempSync(join(tmpdir(), 'blub-status-'));
	await append(join(dir, 'data'), healthy('2026-10-19T10:00:00.000Z'));
	await append(join(dir, 'data'), healthy('2026-10-20T10:00:00.000Z'));
	if (incident) writeFileSync(join(dir, 'vorfall.md'), incident);
	return buildStatus({ dataDir: join(dir, 'data'), incidentDir: dir, now });
}

test('Vorfall färbt seinen Tag und den aktuellen Zustand, die Prozentzahl bleibt Messung', async () => {
	const status = await setup(
		'---\ndatum: 2026-10-20 11:00\nkomponenten: anrufannahme\nschwere: ausfall\ngelöst: nein\n---\n# Leitungen gestört\n'
	);
	const calls = status.components.find((c) => c.id === 'anrufannahme');
	assert.equal(calls.state, 'outage');
	assert.equal(calls.days.at(-1).state, 'outage');
	assert.equal(calls.days.at(-2).state, 'ok');
	assert.equal(calls.availability, 100);
});

test('Seite: 90 Tagesstriche je Komponente, jeder mit Text für Screenreader', async () => {
	const html = renderPage(await setup());
	const bars = html.match(/<button type="button" class="day /g);
	assert.equal(bars.length, 6 * 90);
	assert.match(html, /Dienstag, 20\. Oktober 2026<\/span>: <span data-part="state">betriebsbereit/);
	assert.match(html, /Montag, 21\. September 2026<\/span>: <span data-part="state">keine Messung/);
	assert.equal(html.match(/class="day [^"]*" tabindex="0"/g).length, 6);
});

test('Seite lädt nichts von fremden Servern', async () => {
	const html = renderPage(await setup());
	assert.doesNotMatch(html, /<(script|link)[^>]+(src|href)="https?:/);
});
