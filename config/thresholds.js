// Schwellen der Bewertung, eine Stelle für alle. Über `degraded` wird eine Komponente gelb
// (eingeschränkt), über `outage` rot (Ausfall). Mit `below: true` ist es umgekehrt, für Quoten,
// bei denen weniger schlechter ist. Wer eine Zahl ändert, ändert ihre Begründung mit.
export const thresholds = {
	// Startseite und /api/health von einem GitHub-Runner aus, normal 0,1 bis 0,8 s. Ab 3 s wirkt das
	// Portal zäh. Kein Rot über die Zeit: Nach 10 s bricht die Messung ab, das ist „nicht erreichbar“.
	portalMs: { degraded: 3000 },

	// Angemeldete Leitungen aktiver Betriebe. Eine einzelne abgemeldete Kundenanlage (Strom, Router,
	// Umbau) ist keine Störung von blub; unter 90 % sind es mehrere, unter 50 % liegt es an uns.
	linesRatio: { degraded: 0.9, outage: 0.5, below: true },

	// p95 der Zeit von der Annahme bis zum ersten Ton von blub, üblich um 1 s. Ab 2,5 s fragen
	// Anrufer „Hallo?“, ab 5 s legen viele wieder auf.
	answerP95Ms: { degraded: 2500, outage: 5000 },

	// Gespräche ohne technischen Fehlerausgang, 24 h. Einzelne Fehler kommen vor (Anlage legt mitten
	// im Aufbau auf); unter 98 % ist es mehr als Rauschen, unter 90 % ein Ausfall.
	callsOkRatio: { degraded: 0.98, outage: 0.9, below: true },

	// Gespräche mit abgerissener Sprachverbindung, letzte Stunde, ohne Gespräche darin die letzten
	// 24 h. Nachts sind es wenige Gespräche, ein einzelner Abriss ist dann schnell 3 %; ab 15 % hakt
	// es grundsätzlich.
	speechErrorRatio: { degraded: 0.03, outage: 0.15 },

	// Sekunden, die der älteste fällige Job schon wartet. Normal sind es Sekunden. 5 min Rückstand
	// merkt kaum jemand, nach 30 min kommen Zusammenfassungen, Mails und Webhooks spürbar zu spät.
	jobAgeS: { degraded: 300, outage: 1800 },

	// Der Worker meldet sich jede Minute. Nach 3 min fehlen zwei Lebenszeichen, nach 10 min steht er.
	workerAgeS: { degraded: 180, outage: 600 },

	// Anteil gescheiterter Mailversuche, 24 h. Wiederholungen fangen kurze Aussetzer ab; über 10 %
	// hakt der Versand, über 50 % geht kaum noch etwas raus. Der Wert klingt einen Tag lang nach.
	mailErrorRatio: { degraded: 0.1, outage: 0.5 },

	// Zugestellte Webhooks, 24 h. Die Ziele sind fremde Server, die auch mal ausfallen, daher
	// großzügiger als bei eigenen Diensten.
	webhookRatio: { degraded: 0.95, outage: 0.8, below: true }
};
