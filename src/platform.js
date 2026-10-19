// Kennzahlen aus /api/status der Plattform. Übernommen wird nur, was die Bewertung braucht. Leitungen
// nur als Anteil: Die absolute Zahl ist eine Geschäftszahl und gehört nicht in ein öffentliches Repo.

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const round3 = (v) => Math.round(v * 1000) / 1000;

function linesRatio(lines) {
	const registered = num(lines?.registered);
	const active = num(lines?.active);
	return registered !== null && active > 0 ? round3(registered / active) : null;
}

export function platformFrom(p) {
	if (p.error) return { error: p.error, ms: p.ms };
	if (p.status !== 200) return { status: p.status, ms: p.ms };
	let s;
	try {
		s = JSON.parse(p.body);
	} catch {
		return { status: p.status, ms: p.ms, error: 'invalid' };
	}
	return {
		status: p.status,
		ms: p.ms,
		db: typeof s?.platform?.db === 'boolean' ? s.platform.db : null,
		workerAgeS: num(s?.worker?.heartbeat_age_s),
		jobs: {
			followup: num(s?.jobs?.followup_s),
			recording: num(s?.jobs?.recording_s),
			mail: num(s?.jobs?.mail_s),
			webhook: num(s?.jobs?.webhook_s)
		},
		linesRatio: linesRatio(s?.lines),
		answerP50Ms: num(s?.answer_ms_p50),
		answerP95Ms: num(s?.answer_ms_p95),
		callsOkRatio: num(s?.calls_ok_ratio_24h),
		speechErrorRatio1h: num(s?.speech_error_ratio_1h),
		speechErrorRatio24h: num(s?.speech_error_ratio_24h),
		mailErrorRatio: num(s?.mail?.error_ratio_24h),
		webhookRatio: num(s?.webhooks?.delivered_ratio_24h)
	};
}
