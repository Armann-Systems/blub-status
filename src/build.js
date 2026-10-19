// Baut index.html und status.json aus den Messungen der letzten 90 Tage.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { COMPONENTS } from './components.js';
import { availability, dayState, lastDays, tally } from './days.js';
import { evaluate } from './evaluate.js';
import { renderPage } from './render.js';
import { readSince } from './store.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export async function buildStatus({ dataDir, now = new Date() }) {
	const keys = lastDays(now);
	// Einen Tag Vorlauf in UTC: Der erste Berliner Tag beginnt am Vorabend nach UTC.
	const measurements = await readSince(dataDir, new Date(Date.parse(keys[0]) - 86_400_000));
	const rated = measurements.map((m) => ({ at: m.at, states: evaluate(m) }));
	const counts = tally(
		rated,
		COMPONENTS.map((c) => c.id),
		keys
	);
	const current = rated.at(-1)?.states ?? {};
	return {
		generatedAt: now.toISOString(),
		latest: measurements.at(-1) ?? null,
		components: COMPONENTS.map((c) => ({
			id: c.id,
			name: c.name,
			about: c.about,
			state: current[c.id] ?? 'none',
			availability: availability(Object.values(counts[c.id])),
			days: keys.map((key) => ({ key, state: dayState(counts[c.id][key]), ...counts[c.id][key] }))
		}))
	};
}

export function statusJson(status) {
	return {
		generated_at: status.generatedAt,
		last_measurement_at: status.latest?.at ?? null,
		components: status.components.map((c) => ({
			id: c.id,
			name: c.name,
			state: c.state,
			availability_90d: c.availability,
			days: c.days.map((d) => ({ date: d.key, state: d.state }))
		}))
	};
}

if (import.meta.main) {
	const { values } = parseArgs({
		options: {
			data: { type: 'string', default: join(ROOT, 'data') },
			out: { type: 'string', default: join(ROOT, '_site') }
		}
	});
	const status = await buildStatus({ dataDir: values.data });
	// Der Ordner ist das ganze Pages-Artefakt: Seite, Auswertung, Assets und die eigene Domain.
	mkdirSync(values.out, { recursive: true });
	writeFileSync(join(values.out, 'index.html'), renderPage(status));
	writeFileSync(join(values.out, 'status.json'), JSON.stringify(statusJson(status), null, '\t') + '\n');
	cpSync(join(ROOT, 'assets'), join(values.out, 'assets'), { recursive: true });
	cpSync(join(ROOT, 'CNAME'), join(values.out, 'CNAME'));
}
