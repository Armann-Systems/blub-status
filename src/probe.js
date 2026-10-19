// Abruf von außen mit Zeitmessung. Scheitert der Abruf, ist das selbst der Messwert „nicht
// erreichbar“: Der Fehler wird als error festgehalten, nicht geworfen und nicht zu null.

// Länger wartet kein Anrufer und kein Browser; wer bis dahin nicht antwortet, gilt als nicht erreichbar.
export const TIMEOUT_MS = 10_000;

const USER_AGENT = 'blub-status (+https://status.blub.ai)';

export async function probe(url, fetchImpl = fetch) {
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
