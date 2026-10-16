let records = JSON.parse(localStorage.getItem('student_records')) || [];
let settings = JSON.parse(localStorage.getItem('student_settings')) || {
  cap: 100000,
  rates: { USD: 0.00075, EUR: 0.00070 },
  categories: ['Food', 'Drinks', 'Misc', 'Transport', 'Books', 'Entertainment', 'Other']
};

const recordForm = document.getElementById('record-form');
const categoryForm = document.getElementById('category-form');
const settingsForm = document.getElementById('settings-form');
const recordsBody = document.getElementById('records-body');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort');
const statusBox = document.getElementById('status');

function showStatus(msg) {
  statusBox.textContent = msg;
  setTimeout(() => {
    statusBox.textContent = '';
  }, 3000);
}

function renderCategories() {
  const categorySelect = document.getElementById('category');
  const categoryList = document.getElementById('category-list');
  
  categorySelect.innerHTML = '';
  categoryList.innerHTML = '';

  settings.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);

    const li = document.createElement('li');
    li.innerHTML = `${cat} <button type="button" onclick="removeCategory('${cat}')" class="danger">Remove</button>`;
    categoryList.appendChild(li);
  });
}

function renderApp() {
  recordsBody.innerHTML = '';
  
  let listToDisplay = [...records];
  
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

  const sortType = sortSelect.value;
  listToDisplay.sort((a, b) => {
    if (sortType === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortType === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortType === 'amount-desc') return b.amount - a.amount;
    if (sortType === 'amount-asc') return a.amount - b.amount;
    if (sortType === 'description-asc') return a.description.localeCompare(b.description);
    if (sortType === 'description-desc') return b.description.localeCompare(a.description);
  });

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
  const capFill = document.getElementById('cap-fill');

  const percentage = settings.cap > 0 ? Math.min(100, (totalSpent / settings.cap) * 100) : 100;
  capFill.style.width = percentage + '%';

  if (remaining < 0) {
    capBox.classList.add('over');
    capAlert.textContent = `Alert: You have gone over your monthly cap by ${Math.abs(remaining)} RWF!`;
  } else {
    capBox.classList.remove('over');
    capAlert.textContent = '';
  }
}

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

window.deleteRecord = function(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    records = records.filter(r => r.id !== id);
    localStorage.setItem('student_records', JSON.stringify(records));
    renderApp();
    showStatus('Transaction deleted.');
  }
};

categoryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newCatInput = document.getElementById('new-category');
  const catName = newCatInput.value.trim();

  if (!catName) {
    showStatus('Please enter a category name.');
    return;
  }

  if (settings.categories.some(c => c.toLowerCase() === catName.toLowerCase())) {
    showStatus('That category already exists.');
    return;
  }

  settings.categories.push(catName);
  localStorage.setItem('student_settings', JSON.stringify(settings));
  
  newCatInput.value = '';
  renderCategories();
  showStatus('Category added successfully!');
});

window.removeCategory = function(catName) {
  if (settings.categories.length <= 1) {
    showStatus('You must keep at least one category.');
    return;
  }

  const inUse = records.some(r => r.category === catName);
  if (inUse) {
    showStatus(`Cannot remove "${catName}" because records are using it.`);
    return;
  }

  settings.categories = settings.categories.filter(c => c !== catName);
  localStorage.setItem('student_settings', JSON.stringify(settings));
  renderCategories();
  showStatus('Category removed.');
};

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  settings.cap = parseFloat(document.getElementById('cap-input').value) || settings.cap;
  settings.rates.USD = parseFloat(document.getElementById('rate-usd').value) || settings.rates.USD;
  settings.rates.EUR = parseFloat(document.getElementById('rate-eur').value) || settings.rates.EUR;
  
  localStorage.setItem('student_settings', JSON.stringify(settings));
  renderApp();
  showStatus('Settings updated successfully!');
});

document.getElementById('export-btn').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "finance-tracker-export.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showStatus('Transactions exported successfully!');
});

document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedData = JSON.parse(event.target.result);
      if (!Array.isArray(importedData)) {
        showStatus('Invalid JSON format: Must be an array.');
        return;
      }
      if (confirm(`Replace current records with ${importedData.length} imported records?`)) {
        records = importedData;
        localStorage.setItem('student_records', JSON.stringify(records));
        
        importedData.forEach(r => {
          if (r.category && !settings.categories.includes(r.category)) {
            settings.categories.push(r.category);
          }
        });
        localStorage.setItem('student_settings', JSON.stringify(settings));
        
        renderCategories();
        renderApp();
        showStatus(`Successfully imported ${importedData.length} records!`);
      }
    } catch (err) {
      showStatus('Error parsing JSON file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('cap-input').value = settings.cap;
document.getElementById('rate-usd').value = settings.rates.USD;
document.getElementById('rate-eur').value = settings.rates.EUR;

searchInput.addEventListener('input', renderApp);
sortSelect.addEventListener('change', renderApp);

renderCategories();
renderApp();