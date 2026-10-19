// Messungen als JSON Lines, eine Datei je Monat (UTC), z. B. data/2026-10.jsonl. Anhängen statt
// Umschreiben hält die Commits im Branch messungen klein.
import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const MONTH_FILE = /^\d{4}-\d{2}\.jsonl$/;

export async function append(dir, measurement) {
	await mkdir(dir, { recursive: true });
	const file = join(dir, `${measurement.at.slice(0, 7)}.jsonl`);
	await appendFile(file, JSON.stringify(measurement) + '\n');
}

/** Messungen ab since, älteste zuerst. Ein frisches Repository hat noch kein data/. */
export async function readSince(dir, since) {
	if (!existsSync(dir)) return [];
	const from = since.toISOString();
	const files = (await readdir(dir))
		.filter((f) => MONTH_FILE.test(f) && f.slice(0, 7) >= from.slice(0, 7))
		.sort();
	const measurements = [];
	for (const f of files) {
		for (const line of (await readFile(join(dir, f), 'utf8')).split('\n')) {
			if (!line) continue;
			const m = JSON.parse(line);
			if (m.at >= from) measurements.push(m);
		}
	}
	return measurements;
}
