import { highlight, escapeHtml } from './search.js';

const $ = id => document.getElementById(id);
const fmt = (n, digits = 0) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: 2 });

function viewRow(r, re) {
  const id = escapeHtml(r.id);
  return `
    <tr>
      <th scope="row" data-label="Description">${highlight(r.description, re)}</th>
      <td data-label="Amount (RWF)">${highlight(r.amount.toFixed(2), re)}</td>
      <td data-label="Category">${highlight(r.category, re)}</td>
      <td data-label="Date">${highlight(r.date, re)}</td>
      <td data-label="Actions">
        <button type="button" data-action="edit" data-id="${id}">Edit</button>
        <button type="button" class="danger" data-action="delete" data-id="${id}">Delete</button>
      </td>
    </tr>`;
}

function editRow(r) {
  const id = escapeHtml(r.id);
  const options = [...document.querySelectorAll('#category option')]
    .map(o => `<option${o.value === r.category ? ' selected' : ''}>${escapeHtml(o.value)}</option>`)
    .join('');
  return `
    <tr>
      <th scope="row" data-label="Description">
        <label class="sr-only" for="edit-description">Description</label>
        <input id="edit-description" value="${escapeHtml(r.description)}">
      </th>
      <td data-label="Amount (RWF)">
        <label class="sr-only" for="edit-amount">Amount</label>
        <input id="edit-amount" value="${r.amount}">
      </td>
      <td data-label="Category">
        <label class="sr-only" for="edit-category">Category</label>
        <select id="edit-category">${options}</select>
      </td>
      <td data-label="Date">
        <label class="sr-only" for="edit-date">Date</label>
        <input id="edit-date" value="${escapeHtml(r.date)}">
      </td>
      <td data-label="Actions">
        <button type="button" data-action="save" data-id="${id}">Save</button>
        <button type="button" data-action="cancel" data-id="${id}">Cancel</button>
        <p class="error" id="edit-error" role="status"></p>
      </td>
    </tr>`;
}

export function renderRecords(list, re, editingId = null) {
  const body = $('records-body');

  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="5">No transactions to show.</td></tr>';
    return;
  }

  body.innerHTML = list.map(r => (r.id === editingId ? editRow(r) : viewRow(r, re))).join('');
}

export function renderDashboard(s, cap) {
  $('stat-count').textContent = s.count;
  $('stat-total').textContent = fmt(s.total);
  $('stat-top').textContent = s.topCategory;
  $('stat-usd').textContent = fmt(s.usd, 2);
  $('stat-eur').textContent = fmt(s.eur, 2);

  const over = s.remaining < 0;
  $('cap-box').classList.toggle('over', over);
  $('cap-remaining').textContent = over ? `Over by ${fmt(-s.remaining)} RWF` : `${fmt(s.remaining)} RWF left`;
  $('cap-fill').style.width = (cap > 0 ? Math.min(100, (s.spentThisMonth / cap) * 100) : 100) + '%';
  $('cap-status').textContent = over ? '' : `You have ${fmt(s.remaining)} RWF left this month.`;
  $('cap-alert').textContent = over ? `You are over your monthly cap by ${fmt(-s.remaining)} RWF.` : '';

  const max = Math.max(...s.days.map(d => d.total), 1);
  $('trend').innerHTML = s.days
    .map(d => `<div style="height:${(d.total / max) * 100}%" data-day="${d.label}" title="${d.key}: ${fmt(d.total)} RWF"></div>`)
    .join('');
  $('trend').setAttribute('aria-label', 'Spending over the last 7 days: ' + s.days.map(d => `${d.key} ${fmt(d.total)}`).join(', '));
}

export function renderCategories(categories) {
  $('category').innerHTML = categories.map(c => `<option>${escapeHtml(c)}</option>`).join('');
  $('category-list').innerHTML = categories
    .map(c => `<li>${escapeHtml(c)} <button type="button" data-category="${escapeHtml(c)}" aria-label="Remove ${escapeHtml(c)}">Remove</button></li>`)
    .join('');
}
