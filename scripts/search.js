export function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, c => map[c]);
}

export function compileRegex(input, flags = 'gi') {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
    return null;
  }
}

export function highlight(text, re) {
  if (!re) return escapeHtml(text);
  let html = '';
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (!m[0]) continue;
    html += escapeHtml(text.slice(last, m.index)) + '<mark>' + escapeHtml(m[0]) + '</mark>';
    last = m.index + m[0].length;
  }
  return html + escapeHtml(text.slice(last));
}

export function filterRecords(list, re) {
  if (!re) return list;
  return list.filter(r => `${r.description} ${r.category} ${r.date} ${r.amount.toFixed(2)}`.search(re) !== -1);
}

export function sortRecords(list, choice) {
  const [field, direction] = choice.split('-');
  const sign = direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const result = field === 'amount' ? a.amount - b.amount : a[field].localeCompare(b[field]);
    return result * sign;
  });
}
