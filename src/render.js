// HTML der Statusseite. Setzt nur zusammen, bewertet ist alles schon in build.js.
import { readFileSync } from 'node:fs';
import { worst } from './grade.js';
import { esc } from './markdown.js';
import { incidentSection, openIncidents } from './render-incidents.js';
import {
	OVERALL_STAMP,
	STATE_LABEL,
	countsText,
	dayText,
	headline,
	headlineDetails,
	dateTimeText,
	percentText,
	secondsText,
	timeText
} from './text.js';

const REPO_URL = 'https://github.com/Armann-Systems/blub-status';
// Eingebettet statt als Datei: eine Anfrage weniger, und die Seite lädt kein Skript von irgendwo.
const CLIENT = readFileSync(new URL('./client.js', import.meta.url), 'utf8');

function noteRows(latest) {
	const api = latest?.api ?? {};
	const site = latest?.site;
	const portal = !site
		? 'keine Messung'
		: site.status !== undefined && site.status < 500
			? `antwortet in ${secondsText(site.ms)}`
			: 'nicht erreichbar';
	const firstSound =
		typeof api.answerP50Ms === 'number' ? `nach ${secondsText(api.answerP50Ms)}` : 'keine Angabe';
	// Abrunden: 99,6 % angemeldet ist nicht „alle“.
	const lines =
		typeof api.linesRatio !== 'number'
			? 'keine Angabe'
			: api.linesRatio === 1
				? 'alle angemeldet'
				: `${Math.floor(api.linesRatio * 100)} % angemeldet`;
	return [
		['Uhrzeit', latest ? timeText(latest.at) : '–'],
		['Portal', portal],
		['Erster Ton', firstSound],
		['Leitungen', lines]
	];
}

/** blub wie auf der Website: zufrieden, wenn alles läuft, sonst mit offenen Augen und geradem Mund. */
function figure(overall) {
	const face =
		overall === 'ok'
			? '<path class="line arc" d="M37 46q8-11 16 0m14 0q8-11 16 0"/><path class="line" d="M52 63q8 7 16 0"/>'
			: '<ellipse class="white" cx="45" cy="42" rx="9" ry="11"/><ellipse class="white" cx="75" cy="42" rx="9" ry="11"/><circle class="pupil" cx="45" cy="45" r="4.8"/><circle class="pupil" cx="75" cy="45" r="4.8"/><path class="line" d="M53 65h14"/>';
	return `<svg class="figure" viewBox="0 0 120 112" aria-hidden="true"><path class="shape" d="M30 68 16 108 58 80Z"/><rect class="shape" x="6" y="6" width="108" height="78" rx="36"/>${face}</svg>`;
}

function hero(status) {
	const { latest, components } = status;
	const overall = latest ? worst(components.map((c) => c.state)) : 'none';
	const lead = latest
		? `Stand der letzten Messung: ${dateTimeText(latest.at)}.`
		: 'Die erste Messung folgt in den nächsten zehn Minuten.';
	const details = headlineDetails(components)
		.map((d) => `<p class="detail">${esc(d)}</p>`)
		.join('');
	const rows = noteRows(latest)
		.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
		.join('');
	return `<section class="hero wrap">
	<div class="copy">
		<p class="kicker mono">Betriebsstatus, alle zehn Minuten von außen gemessen</p>
		<h1 class="display">${esc(headline(components, Boolean(latest)))}</h1>
		<p class="lead" data-measured-at="${latest?.at ?? ''}">${esc(lead)}</p>
		${details}
		${openIncidents(status.incidents)}
	</div>
	<article class="note" aria-label="Notiz zur letzten Messung">
		${figure(overall)}
		<p class="note-org">Armann Systems · Regensburg</p>
		<p class="note-title">Betriebsnotiz</p>
		<dl>${rows}</dl>
		<div class="note-foot">
			<span class="label">gemessen</span><span class="bubble">alle 10 Min.</span>
			<p class="stamp s-${overall}"><span>${OVERALL_STAMP[overall]}</span>${
				latest ? `<span class="time">${timeText(latest.at)}</span>` : ''
			}</p>
		</div>
	</article>
</section>`;
}

function dayBar(day, isToday) {
	const measured = day.ok + day.degraded + day.outage > 0;
	const state = measured || day.incidents.length ? STATE_LABEL[day.state] : 'keine Messung';
	const parts = [
		`<span data-part="date">${dayText(day.key)}</span>: <span data-part="state">${state}</span>.`,
		measured ? ` <span data-part="counts">${countsText(day)}</span>.` : '',
		...day.incidents.map((i) => ` <span data-part="incident">Vorfall: ${esc(i.title)}</span>.`)
	].join('');
	const marked = day.incidents.length ? ' has-incident' : '';
	return `<li><button type="button" class="day s-${day.state}${marked}" tabindex="${isToday ? 0 : -1}"><span class="sr">${parts}</span></button></li>`;
}

function component(c) {
	const pct =
		c.availability === null
			? `<span class="num">–</span><span class="label">noch keine Messung</span>`
			: `<span class="num">${percentText(c.availability)}</span><span class="label">ohne Ausfall in 90 Tagen</span>`;
	const days = c.days.map((d, i) => dayBar(d, i === c.days.length - 1)).join('');
	return `<li class="component" id="${c.id}">
	<div class="head">
		<h3 class="name">${esc(c.name)}</h3>
		<p class="now s-${c.state}"><span class="dot" aria-hidden="true"></span>${STATE_LABEL[c.state]}</p>
		<p class="pct">${pct}</p>
	</div>
	<p class="about">${esc(c.about)}</p>
	<div class="strip">
		<ol class="days" aria-label="${esc(c.name)}, Tagesstriche der letzten 90 Tage">${days}</ol>
		<div class="tip" aria-hidden="true" hidden></div>
	</div>
	<p class="axis" aria-hidden="true"><span>vor 90 Tagen</span><span>heute</span></p>
</li>`;
}

const LEGEND = ['ok', 'degraded', 'outage', 'none']
	.map((s) => `<li><span class="swatch s-${s}" aria-hidden="true"></span>${STATE_LABEL[s]}</li>`)
	.join('');

const METHOD = `<section class="method wrap" aria-labelledby="messung">
	<h2 id="messung" class="display">So wird gemessen</h2>
	<div class="method-text">
		<p>Alle zehn Minuten ruft ein Server bei GitHub blub.ai von außen auf, so wie es Kunden tun. Dazu holt er von der Plattform zusammengefasste Kennzahlen: Quoten und Zeiten, keine Anrufzahlen und nichts über einzelne Betriebe.</p>
		<p>Antwortet blub.ai nicht oder fehlt die Datenbank, gilt das Intervall in allen Bereichen als Ausfall. Ein Tagesstrich zeigt den schlechtesten Zustand des Tages. Grau heißt keine Messung, nicht „alles gut“.</p>
		<p>Die Prozentzahl ist der Anteil der Messungen ohne Ausfall in den letzten 90 Tagen, abgerundet. Eingeschränkt zählt als verfügbar, Intervalle ohne Messung zählen nicht mit.</p>
		<p>Die Schwellen stehen offen im <a href="${REPO_URL}">Repository</a>, die Rohdaten im Branch <a href="${REPO_URL}/tree/messungen/data">messungen</a>, die aktuelle Auswertung in <a href="status.json">status.json</a>.</p>
	</div>
</section>`;

export function renderPage(status) {
	return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Status · blub</title>
<meta name="description" content="Betriebsstatus von blub: Anrufannahme, Sprachverarbeitung, Portal, Nacharbeit, Benachrichtigungen und Webhooks, alle zehn Minuten von außen gemessen.">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="assets/blub.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/fraunces-soft.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/status.css">
</head>
<body>
<a class="skip" href="#bereiche">Zu den Bereichen</a>
<header class="top wrap">
	<a class="mark" href="https://blub.ai" aria-label="blub, zur Website">blub</a>
	<span class="hand" aria-hidden="true">Status</span>
	<a class="site-link" href="https://blub.ai">Zu blub.ai</a>
</header>
<main>
${hero(status)}
<section class="sheet wrap" aria-labelledby="bereiche">
	<div class="sheet-head">
		<h2 id="bereiche" class="display">Bereiche</h2>
		<ul class="legend" aria-label="Farben der Tagesstriche">${LEGEND}</ul>
	</div>
	<ol class="components">${status.components.map(component).join('')}</ol>
</section>
${incidentSection(status.incidents)}
${METHOD}
</main>
<footer class="foot wrap">
	<p><span class="wm">blub</span> ist ein Produkt der Armann Systems GmbH aus Regensburg.</p>
	<ul>
		<li><a href="https://blub.ai/impressum">Impressum</a></li>
		<li><a href="https://blub.ai/datenschutz">Datenschutz</a></li>
		<li><a href="${REPO_URL}">Quelltext und Messdaten</a></li>
	</ul>
</footer>
<script>
${CLIENT}</script>
</body>
</html>
`;
}
