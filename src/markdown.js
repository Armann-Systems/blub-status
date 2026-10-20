// Das bisschen Markdown, das ein Vorfall braucht: Absätze, Zwischenüberschriften mit ##, Listen mit
// „- “, **fett**, `Code` und Links auf https. Alles andere bleibt Text, HTML wird nie durchgereicht.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESCAPES[c]);

function inline(text) {
	return esc(text)
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/`(.+?)`/g, '<code>$1</code>')
		.replace(/\[(.+?)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

export function markdown(text) {
	return text
		.split(/\n\s*\n/)
		.map((block) => block.trim())
		.filter(Boolean)
		.map((block) => {
			const lines = block.split('\n');
			if (lines[0].startsWith('## ')) {
				const rest = lines.slice(1).join('\n');
				return `<h4>${inline(lines[0].slice(3))}</h4>${rest ? markdown(rest) : ''}`;
			}
			if (lines.every((l) => l.startsWith('- '))) {
				return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
			}
			return `<p>${inline(lines.join(' '))}</p>`;
		})
		.join('\n');
}
