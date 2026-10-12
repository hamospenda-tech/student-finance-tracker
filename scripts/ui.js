import { highlight, escapeHtml } from './search.js';

export function renderRecords(list, re) {
  const body = document.getElementById('records-body');

  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="5">No transactions to show.</td></tr>';
    return;
  }

  body.innerHTML = list.map(r => `
    <tr>
      <th scope="row" data-label="Description">${highlight(r.description, re)}</th>
      <td data-label="Amount (RWF)">${highlight(r.amount.toFixed(2), re)}</td>
      <td data-label="Category">${highlight(r.category, re)}</td>
      <td data-label="Date">${highlight(r.date, re)}</td>
      <td data-label="Actions">
        <button type="button" class="danger" data-delete="${escapeHtml(r.id)}">Delete</button>
      </td>
    </tr>`).join('');
}
