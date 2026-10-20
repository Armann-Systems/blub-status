import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate } from '../src/evaluate.js';
import { measure } from '../src/measure.js';
import { platformFrom } from '../src/platform.js';

const refused = async () => {
	throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
};

test('blub.ai nicht erreichbar: Messwert ist der Fehler, nicht null, und alles ist Ausfall', async () => {
	const m = await measure('https://blub.invalid', refused);
	assert.deepEqual(m.site, { error: 'ECONNREFUSED', ms: m.site.ms });
	assert.equal(m.api.error, 'ECONNREFUSED');
	assert.deepEqual([...new Set(Object.values(evaluate(m)))], ['outage']);
});

test('Zeitüberschreitung wird als timeout gemessen', async () => {
	const slow = async () => {
		throw new DOMException('signal timed out', 'TimeoutError');
	};
	const m = await measure('https://blub.invalid', slow);
	assert.equal(m.health.error, 'timeout');
});

test('Leitungen nur als Anteil, keine Zählwerte in der Messung', () => {
	const body = JSON.stringify({ platform: { db: true }, lines: { registered: 11, active: 12 } });
	const api = platformFrom({ status: 200, ms: 10, body });
	assert.equal(api.linesRatio, 0.917);
	assert.doesNotMatch(JSON.stringify(api), /registered|active/);
});

test('/api/status mit kaputtem JSON ist „invalid“, nicht leer', () => {
	assert.deepEqual(platformFrom({ status: 200, ms: 10, body: '<html>' }), {
		status: 200,
		ms: 10,
		error: 'invalid'
	});
});
