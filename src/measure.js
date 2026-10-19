// Eine Messung: blub.ai von außen abrufen, so wie es ein Kunde tut.
import { probe } from './probe.js';

export const BASE_URL = process.env.BLUB_BASE_URL ?? 'https://blub.ai';

const withoutBody = ({ body: _body, ...rest }) => rest;

export async function measure(base = BASE_URL, fetchImpl = fetch) {
	const at = new Date().toISOString();
	const [site, health] = await Promise.all([
		probe(new URL('/', base), fetchImpl),
		probe(new URL('/api/health', base), fetchImpl)
	]);
	return { at, site: withoutBody(site), health: withoutBody(health) };
}

if (import.meta.main) console.log(JSON.stringify(await measure()));
