// Abruf von außen mit Zeitmessung. Scheitert der Abruf, ist das selbst der Messwert „nicht
// erreichbar“: Der Fehler wird als error festgehalten, nicht geworfen und nicht zu null.

// Länger wartet kein Anrufer und kein Browser; wer bis dahin nicht antwortet, gilt als nicht erreichbar.
export const TIMEOUT_MS = 10_000;

const USER_AGENT = 'blub-status (+https://status.blub.ai)';

// Nach einem Verbindungsfehler einmal neu ansetzen: Der Runner verliert gelegentlich den Aufbau,
// ein Kunde lädt dann einfach neu. Nach einer Zeitüberschreitung nicht, länger wartet niemand.
const RETRY_AFTER_MS = 1000;

export async function probe(url, fetchImpl = fetch) {
	const first = await attempt(url, fetchImpl);
	if (!first.error || first.error === 'timeout') return first;
	await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER_MS));
	return attempt(url, fetchImpl);
}

async function attempt(url, fetchImpl) {
	const started = performance.now();
	const elapsed = () => Math.round(performance.now() - started);
	try {
		const res = await fetchImpl(url, {
			headers: { 'user-agent': USER_AGENT },
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		const body = await res.text();
		return { status: res.status, ms: elapsed(), body };
	} catch (e) {
		// cause.code unterscheidet DNS (ENOTFOUND), abgewiesen (ECONNREFUSED) und Zertifikat
		const error = e.name === 'TimeoutError' ? 'timeout' : (e.cause?.code ?? 'connect');
		return { error, ms: elapsed() };
	}
}
