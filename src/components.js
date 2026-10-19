// Die Komponenten der Statusseite in Anzeigereihenfolge und die Messwerte, nach denen sie bewertet
// werden. Die Schwellen dazu stehen in config/thresholds.js.
import { grade, worst } from './grade.js';

const known = (values) => values.filter((v) => v !== null && v !== undefined);
const maxKnown = (...values) => (known(values).length ? Math.max(...known(values)) : null);

/** Was der Worker abarbeitet, steht still, wenn er sich nicht mehr meldet. */
const workerState = (api) => grade(api.workerAgeS, 'workerAgeS');

function portal(m) {
	const refused = m.site.status >= 400 || m.health.status >= 400;
	return worst([refused ? 'degraded' : 'ok', grade(Math.max(m.site.ms, m.health.ms), 'portalMs')]);
}

export const COMPONENTS = [
	{
		id: 'anrufannahme',
		name: 'Anrufannahme',
		about: 'Angemeldete Leitungen, Zeit bis zum ersten Ton, Gespräche ohne technischen Fehler',
		rate: ({ api }) =>
			worst([
				grade(api.linesRatio, 'linesRatio'),
				grade(api.answerP95Ms, 'answerP95Ms'),
				grade(api.callsOkRatio, 'callsOkRatio')
			])
	},
	{
		id: 'sprachverarbeitung',
		name: 'Sprachverarbeitung',
		about: 'Gespräche ohne abgerissene Sprachverbindung',
		rate: ({ api }) =>
			grade(api.speechErrorRatio1h ?? api.speechErrorRatio24h, 'speechErrorRatio')
	},
	{
		id: 'portal',
		name: 'Portal',
		about: 'blub.ai erreichbar, Antwortzeit von außen',
		usesApi: false,
		rate: portal
	},
	{
		id: 'nacharbeit',
		name: 'Nacharbeit und Aufnahmen',
		about: 'Zusammenfassungen und Aufnahmen nach dem Gespräch',
		rate: ({ api }) =>
			worst([
				grade(maxKnown(api.jobs.followup, api.jobs.recording), 'jobAgeS'),
				workerState(api)
			])
	},
	{
		id: 'benachrichtigungen',
		name: 'Benachrichtigungen',
		about: 'Mails zu Rückrufbitten, Berichten und Konten',
		rate: ({ api }) =>
			worst([
				grade(api.jobs.mail, 'jobAgeS'),
				grade(api.mailErrorRatio, 'mailErrorRatio'),
				workerState(api)
			])
	},
	{
		id: 'webhooks',
		name: 'Webhooks und Integrationen',
		about: 'Zustellung an angebundene Systeme',
		rate: ({ api }) =>
			worst([
				grade(api.jobs.webhook, 'jobAgeS'),
				grade(api.webhookRatio, 'webhookRatio'),
				workerState(api)
			])
	}
];
