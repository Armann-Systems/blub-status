// Beispieldaten für die lokale Ansicht: 90 Tage Messungen mit ein paar Störungen und passenden
// Vorfällen, standardmäßig nach beispiel/ (steht in .gitignore). Nie nach data/ schreiben, sonst
// landen erfundene Messungen auf der echten Seite.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { append } from '../src/store.js';

const INTERVAL_MS = 10 * 60_000;
const DAY_MS = 86_400_000;

/** Fester Startwert, damit die Beispielseite bei jedem Lauf gleich aussieht. */
function random(seed) {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function normal(rand, at) {
	// Nachts telefoniert kaum jemand, dann gibt es keinen Stundenwert der Sprachverbindung.
	// Grob Berliner Sommerzeit, für Beispieldaten genau genug.
	const hour = new Date(at).getUTCHours() + 2;
	const quiet = hour < 7 || hour >= 22;
	const pick = (lo, hi) => Math.round(lo + rand() * (hi - lo));
	return {
		at: new Date(at).toISOString(),
		site: { status: 200, ms: pick(140, 420) },
		health: { status: 200, ms: pick(30, 110) },
		api: {
			status: 200,
			ms: pick(40, 160),
			db: true,
			workerAgeS: pick(2, 70),
			jobs: { followup: rand() < 0.1 ? pick(1, 25) : 0, recording: 0, mail: 0, webhook: 0 },
			linesRatio: rand() < 0.15 ? 0.917 : 1,
			answerP50Ms: pick(720, 980),
			answerP95Ms: pick(1150, 1900),
			callsOkRatio: Math.min(1, 0.988 + rand() * 0.02),
			speechErrorRatio1h: quiet ? null : rand() < 0.08 ? 0.02 : 0,
			speechErrorRatio24h: Math.round(rand() * 6) / 1000,
			mailErrorRatio: rand() < 0.1 ? 0.01 : 0,
			webhookRatio: rand() < 0.2 ? 0.98 : 1
		}
	};
}

/** Störungen relativ zu heute: Tage zurück, Uhrzeit von/bis (UTC) und was dann anders ist */
const DISTURBANCES = [
	{ day: 0, from: 6, to: 24, change: (m) => (m.api.webhookRatio = 0.93) },
	{ day: 3, from: 10, to: 11, change: (m) => (m.api.speechErrorRatio1h = 0.21) },
	{
		day: 11,
		from: 12.2,
		to: 12.9,
		change: (m) => {
			m.site = { error: 'timeout', ms: 10000 };
			m.health = { error: 'timeout', ms: 10000 };
			m.api = { error: 'timeout', ms: 10000 };
		}
	},
	{
		day: 26,
		from: 7,
		to: 7.6,
		change: (m) => {
			m.api.workerAgeS = 840;
			m.api.jobs.followup = 1260;
		}
	},
	{ day: 41, from: 8, to: 16, change: (m) => (m.api.mailErrorRatio = 0.22) },
	{ day: 64, from: 13, to: 17, change: (m) => (m.api.webhookRatio = 0.9) },
	{ day: 78, from: 15, to: 16, change: (m) => (m.api = { status: 502, ms: 40 }) }
];

/** Tage ohne jede Messung: Die Action lief nicht (56, 57), die Seite startete vor 86 Tagen. */
const GAPS = [56, 57];
const FIRST_DAY = 86;

/** Vorfälle zu den Störungen oben: Tage zurück, von, bis (Berliner Zeit, bis null = offen) */
const INCIDENTS = {
	'a-webhooks.md': [0, '08:05', null, 'eingeschränkt', 'webhooks', 'Webhooks an ein Ticketsystem verzögert', 'Ein angebundenes Ticketsystem nimmt Zustellungen nur langsam an. blub wiederholt sie, es geht nichts verloren.'],
	'b-sprache.md': [3, '12:00', '13:05', 'ausfall', 'sprachverarbeitung', 'Gespräche brachen ab', 'Die Sprachverbindung riss zwischen 12 und 13 Uhr wiederholt ab. Betroffene Anrufer hörten Stille und wurden, wo eingerichtet, zur Zentrale weitergeleitet.'],
	'c-erreichbar.md': [11, '14:12', '14:55', 'ausfall', 'anrufannahme, sprachverarbeitung, portal, nacharbeit, benachrichtigungen, webhooks', 'blub.ai nicht erreichbar', 'Ein Neustart des Servers dauerte 40 Minuten statt zwei. Anrufe klingelten in dieser Zeit wie früher bei den Menschen im Betrieb.\n\n## 14:55\nAlles läuft wieder. Gespräche aus dieser Zeit gibt es nicht, weil blub nicht abgenommen hat.'],
	'd-nacharbeit.md': [26, '09:00', '09:40', 'eingeschränkt', 'nacharbeit', 'Zusammenfassungen verspätet', 'Der Worker hing nach einem Update. Zusammenfassungen kamen bis zu 20 Minuten später.']
};

const { values } = parseArgs({ options: { out: { type: 'string', default: 'beispiel' } } });
const dataDir = join(values.out, 'data');
const incidentDir = join(values.out, 'incidents');
rmSync(values.out, { recursive: true, force: true });
mkdirSync(incidentDir, { recursive: true });

const now = Date.now();
const rand = random(20261020);
const todayStart = Math.floor(now / DAY_MS) * DAY_MS;
for (let at = todayStart - FIRST_DAY * DAY_MS; at <= now; at += INTERVAL_MS) {
	const daysBack = Math.floor((todayStart - Math.floor(at / DAY_MS) * DAY_MS) / DAY_MS);
	if (GAPS.includes(daysBack)) continue;
	const m = normal(rand, at);
	const hour = (at % DAY_MS) / 3_600_000;
	for (const d of DISTURBANCES) if (d.day === daysBack && hour >= d.from && hour < d.to) d.change(m);
	await append(dataDir, m);
}

for (const [file, [daysBack, from, to, severity, components, title, text]] of Object.entries(INCIDENTS)) {
	const date = new Date(todayStart - daysBack * DAY_MS).toISOString().slice(0, 10);
	writeFileSync(
		join(incidentDir, file),
		`---\ndatum: ${date} ${from}\nkomponenten: ${components}\nschwere: ${severity}\ngelöst: ${to ? `${date} ${to}` : 'nein'}\n---\n# ${title}\n\n${text}\n`
	);
}
console.log(`Beispieldaten in ${values.out}/`);
