// Eine Messung: blub.ai von außen abrufen, so wie es ein Kunde tut.
import { parseArgs } from 'node:util';
import { platformFrom } from './platform.js';
import { probe } from './probe.js';
import { append } from './store.js';

export const BASE_URL = process.env.BLUB_BASE_URL ?? 'https://blub.ai';

const withoutBody = ({ body: _body, ...rest }) => rest;

export async function measure(base = BASE_URL, fetchImpl = fetch) {
	const at = new Date().toISOString();
	const [site, health, api] = await Promise.all([
		probe(new URL('/', base), fetchImpl),
		probe(new URL('/api/health', base), fetchImpl),
		probe(new URL('/api/status', base), fetchImpl)
	]);
	return { at, site: withoutBody(site), health: withoutBody(health), api: platformFrom(api) };
}

if (import.meta.main) {
	const { values } = parseArgs({ options: { data: { type: 'string', default: 'data' } } });
	const measurement = await measure();
	await append(values.data, measurement);
	console.log(JSON.stringify(measurement));
}
