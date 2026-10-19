# blub-status

Öffentliche Statusseite von [blub](https://blub.ai) unter <https://status.blub.ai>.

Eine GitHub Action misst alle zehn Minuten von außen, hängt die Messung im Branch `messungen` an und veröffentlicht daraus `index.html` und `status.json` über GitHub Pages. `main` enthält nur Code, Schwellen und Vorfälle, keine Messdaten. Es gibt keinen Server und keine Abhängigkeiten außer Node 24.
