// Messungen für Tests: eine gesunde, die einzelne Tests gezielt verändern.
export function healthy(at = '2026-10-20T10:00:00.000Z') {
	return {
		at,
		site: { status: 200, ms: 250 },
		health: { status: 200, ms: 60 },
		api: {
			status: 200,
			ms: 80,
			db: true,
			workerAgeS: 20,
			jobs: { followup: 0, recording: 0, mail: 0, webhook: 0 },
			linesRatio: 1,
			answerP50Ms: 800,
			answerP95Ms: 1400,
			callsOkRatio: 0.997,
			speechErrorRatio1h: 0,
			speechErrorRatio24h: 0.003,
			mailErrorRatio: 0,
			webhookRatio: 1
		}
	};
}
