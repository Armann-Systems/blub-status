# blub-status

Öffentliche Statusseite von [blub](https://blub.ai) unter <https://status.blub.ai>.

Eine GitHub Action misst alle zehn Minuten von außen, hängt die Messung im Branch `messungen` an und veröffentlicht daraus `index.html` und `status.json` über GitHub Pages. `main` enthält nur Code, Schwellen und Vorfälle, keine Messdaten. Es gibt keinen Server und keine Abhängigkeiten außer Node 24.

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
