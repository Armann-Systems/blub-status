# blub-status

Öffentliche Statusseite von [blub](https://blub.ai) unter <https://status.blub.ai>.

Eine GitHub Action misst alle zehn Minuten von außen, hängt die Messung im Branch `messungen` an und veröffentlicht daraus `index.html` und `status.json` über GitHub Pages. `main` enthält nur Code, Schwellen und Vorfälle, keine Messdaten. Es gibt keinen Server und keine Abhängigkeiten außer Node 24.

## So funktioniert es

1. `src/measure.js` ruft `https://blub.ai/` und `/api/health` ab (Statuscode, Antwortzeit) und holt von `/api/status` die zusammengefassten Kennzahlen der Plattform.
2. Die Messung landet als eine Zeile in `data/JJJJ-MM.jsonl` im Branch `messungen`. Den legt der erste Lauf ohne gemeinsame Historie an; nur der Bot schreibt dorthin.
3. `src/build.js` bewertet jede Messung je Komponente (`config/thresholds.js`), fasst die letzten 90 Tage zu Tagesstrichen zusammen und schreibt die Seite samt `assets/` und `CNAME` nach `_site/`. Die Action lädt den Ordner als Pages-Artefakt hoch.

Bewertung in Kürze: Antwortet blub.ai nicht, ist das Intervall überall Ausfall. Ein Tagesstrich zeigt den schlechtesten Zustand des Tages, ohne Messung bleibt er grau. Die Prozentzahl ist der Anteil der Messungen ohne Ausfall.

Einrichtung auf GitHub: Settings › Pages › Source „GitHub Actions“, Custom domain `status.blub.ai`, HTTPS erzwingen. Der erste Lauf (Actions › Messung › Run workflow) legt den Branch `messungen` an.

Lokal, mit Beispieldaten (90 Tage, ein paar Störungen) in `beispiel/`, das nie ins Repo gehört:

```sh
npm test
npm run sample
node src/build.js --data beispiel/data --incidents beispiel/incidents --out beispiel
BLUB_BASE_URL=http://localhost:5191 node src/measure.js --data beispiel/data
```

## Vorfall eintragen

Eine Markdown-Datei in `incidents/`, Name frei, z. B. `2026-10-20-webhooks.md`:

```markdown
---
datum: 2026-10-20 14:20
komponenten: webhooks, benachrichtigungen
schwere: eingeschränkt
gelöst: nein
---
# Webhooks an ein Ticketsystem verzögert

Was Kunden merken und was wir tun, in zwei, drei Sätzen.

## 14:45
Ursache gefunden, Zustellungen laufen wieder an.
```

- `datum` und `gelöst` in Berliner Ortszeit. `gelöst` ist `nein`, `ja` oder der Zeitpunkt, z. B. `2026-10-20 15:05`.
- `komponenten`: `anrufannahme`, `sprachverarbeitung`, `portal`, `nacharbeit`, `benachrichtigungen`, `webhooks`.
- `schwere`: `eingeschränkt` oder `ausfall`.

Committen und pushen, mit dem nächsten Lauf der Action steht der Vorfall auf der Seite. Ein offener Vorfall bestimmt den aktuellen Zustand seiner Komponenten mit und färbt seine Tage. Die Prozentzahl bleibt reine Messung. Ist ein Eintrag fehlerhaft, bricht der Bau mit einer Meldung ab und die Seite bleibt, wie sie war.
