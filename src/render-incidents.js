// Vorfälle auf der Seite: offene oben unter dem Gesamtzustand, alle der letzten 90 Tage als Notizen
// unter den Tagesstrichen.
import { COMPONENTS } from './components.js';
import { esc, markdown } from './markdown.js';
import { STATE_LABEL, dateTimeText, timeText } from './text.js';

const nameOf = Object.fromEntries(COMPONENTS.map((c) => [c.id, c.name]));
const anchor = (i) => `vorfall-${i.id}`;

export function openIncidents(incidents) {
	const open = incidents.filter((i) => !i.resolved);
	if (!open.length) return '';
	const items = open
		.map((i) => `<li><a href="#${anchor(i)}">${esc(i.title)}</a>, seit ${dateTimeText(i.start)}</li>`)
		.join('');
	return `<div class="open-incidents"><p class="label">In Arbeit</p><ul>${items}</ul></div>`;
}

function period(i) {
	if (!i.end) return `${dateTimeText(i.start)}`;
	const sameDay = i.days[0] === i.days[1];
	return sameDay
		? `${dateTimeText(i.start).replace(/ Uhr$/, '')} bis ${timeText(i.end)} Uhr`
		: `${dateTimeText(i.start)} bis ${dateTimeText(i.end)}`;
}

function incident(i) {
	const affected = i.components.map((c) => `<li>${esc(nameOf[c])}</li>`).join('');
	const stamp = i.resolved
		? `<p class="stamp s-ok"><span>gelöst</span>${i.end ? `<span class="time">${timeText(i.end)}</span>` : ''}</p>`
		: `<p class="stamp s-${i.severity}"><span>in Arbeit</span></p>`;
	return `<article class="incident" id="${anchor(i)}">
	<p class="when">${esc(period(i))}</p>
	<h3 class="display">${esc(i.title)}</h3>
	<p class="meta"><span class="severity s-${i.severity}">${STATE_LABEL[i.severity]}</span></p>
	<ul class="affected" aria-label="Betroffen">${affected}</ul>
	<div class="text">${markdown(i.text)}</div>
	${stamp}
</article>`;
}

export function incidentSection(incidents) {
	const list = incidents.length
		? incidents.map(incident).join('')
		: '<p class="empty">Keine Vorfälle in den letzten 90 Tagen.</p>';
	return `<section class="incidents wrap" aria-labelledby="vorfaelle">
	<h2 id="vorfaelle" class="display">Vorfälle</h2>
	<div class="incident-list">${list}</div>
</section>`;
}
