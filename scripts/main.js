// Simple Student Finance Tracker Script

let records = JSON.parse(localStorage.getItem('student_records')) || [];
let settings = JSON.parse(localStorage.getItem('student_settings')) || {
  cap: 100000,
  rates: { USD: 0.00075, EUR: 0.00070 },
  categories: ['Food', 'Transport', 'Books', 'Entertainment', 'Other']
};

const recordForm = document.getElementById('record-form');
const recordsBody = document.getElementById('records-body');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const statusBox = document.getElementById('status');

// Show status message at the bottom
function showStatus(msg) {
  statusBox.textContent = msg;
  setTimeout(() => {
    statusBox.textContent = '';
  }, 3000);
}

// Render records and update dashboard stats
function renderApp() {
  recordsBody.innerHTML = '';
  
  let listToDisplay = [...records];
  
  // Search filter (Regex)
  const searchText = searchInput.value;
  if (searchText) {
    try {
      const regex = new RegExp(searchText, 'i');
      listToDisplay = listToDisplay.filter(r => regex.test(r.description) || regex.test(r.category));
      document.getElementById('search-status').textContent = `${listToDisplay.length} match(es) found.`;
    } catch (e) {
      document.getElementById('search-status').textContent = 'Invalid regular expression.';
    }
  } else {
    document.getElementById('search-status').textContent = '';
  }

  // Sorting
  const sortType = sortSelect.value;
  listToDisplay.sort((a, b) => {
    if (sortType === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortType === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortType === 'amount-desc') return b.amount - a.amount;
    if (sortType === 'amount-asc') return a.amount - b.amount;
    if (sortType === 'description-asc') return a.description.localeCompare(b.description);
    if (sortType === 'description-desc') return b.description.localeCompare(a.description);
  });

  // Populate Table
  if (listToDisplay.length === 0) {
    recordsBody.innerHTML = '<tr><td colspan="5">No records found.</td></tr>';
  } else {
    listToDisplay.forEach(r => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${r.description}</td>
        <td>${r.amount}</td>
        <td>${r.category}</td>
        <td>${r.date}</td>
        <td>
          <button onclick="deleteRecord('${r.id}')" class="danger">Delete</button>
        </td>
      `;
      recordsBody.appendChild(row);
    });
  }

  updateDashboard();
}

// Calculate totals and update dashboard
function updateDashboard() {
  const totalSpent = records.reduce((sum, r) => sum + r.amount, 0);
  
  document.getElementById('stat-count').textContent = records.length;
  document.getElementById('stat-total').textContent = totalSpent;
  document.getElementById('stat-usd').textContent = (totalSpent * settings.rates.USD).toFixed(2);
  document.getElementById('stat-eur').textContent = (totalSpent * settings.rates.EUR).toFixed(2);

  const remaining = settings.cap - totalSpent;
  document.getElementById('cap-remaining').textContent = `${remaining} RWF left`;

  const capBox = document.getElementById('cap-box');
  const capAlert = document.getElementById('cap-alert');

  if (remaining < 0) {
    capBox.classList.add('over');
    capAlert.textContent = 'Alert: You have gone over your monthly cap!';
  } else {
    capBox.classList.remove('over');
    capAlert.textContent = '';
  }
}

// Add new transaction
recordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const description = document.getElementById('description').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;
  const category = document.getElementById('category').value;

  if (!description || isNaN(amount) || !date) {
    showStatus('Please fill in all required fields properly.');
    return;
  }

  const newRecord = {
    id: 'txn_' + Date.now(),
    description,
    amount,
    date,
    category
  };

  records.push(newRecord);
  localStorage.setItem('student_records', JSON.stringify(records));
  
  recordForm.reset();
  renderApp();
  showStatus('Transaction saved!');
});

// Delete record function attached to window for inline onclick use
window.deleteRecord = function(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem('student_records', JSON.stringify(records));
    renderApp();
    showStatus('Transaction deleted.');
  }
};

// Populate Category dropdown
function loadCategories() {
  const categorySelect = document.getElementById('category');
  categorySelect.innerHTML = '';
  settings.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// Settings form submission
document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  settings.cap = parseFloat(document.getElementById('cap-input').value) || settings.cap;
  settings.rates.USD = parseFloat(document.getElementById('rate-usd').value) || settings.rates.USD;
  settings.rates.EUR = parseFloat(document.getElementById('rate-eur').value) || settings.rates.EUR;
  
  localStorage.setItem('student_settings', JSON.stringify(settings));
  renderApp();
  showStatus('Settings updated successfully!');
});

// Initialize form values from settings
document.getElementById('cap-input').value = settings.cap;
document.getElementById('rate-usd').value = settings.rates.USD;
document.getElementById('rate-eur').value = settings.rates.EUR;

// Event listeners
searchInput.addEventListener('input', renderApp);
sortSelect.addEventListener('change', renderApp);

// Run on page load
loadCategories();
renderApp();