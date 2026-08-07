// ==========================================================================
// CHECKLIST / ACTIVITIES
// Two lists: "recurring" (permanent — stays, just toggles checked/unchecked)
// and "today" (one-off — disappears entirely once checked). Both are saved
// to localStorage, a small key/value store built into the browser, so the
// lists survive a page reload instead of resetting every time.
// ==========================================================================

const RECURRING_KEY = 'dashboard:recurringItems';
const TODAY_KEY = 'dashboard:todayItems';

let recurringItems = loadItems(RECURRING_KEY);
let todayItems = loadItems(TODAY_KEY);

function loadItems(key) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

function saveItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function renderList(items, containerId) {
  const container = document.getElementById(containerId);

  if (items.length === 0) {
    container.innerHTML = `<li class="checklist__empty">Nothing here yet</li>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <li class="checklist__item">
          <label>
            <input type="checkbox" data-id="${item.id}" ${item.checked ? 'checked' : ''} />
            <span>${item.text}</span>
          </label>
        </li>
      `
    )
    .join('');
}

function renderChecklist() {
  renderList(recurringItems, 'recurring-items');
  renderList(todayItems, 'checklist-items');
}

// --- Adding new items ---

const form = document.getElementById('checklist-form');
const input = document.getElementById('checklist-input');
const recurringToggle = document.getElementById('recurring-toggle');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const newItem = { id: generateId(), text, checked: false };

  if (recurringToggle.checked) {
    recurringItems.push(newItem);
    saveItems(RECURRING_KEY, recurringItems);
  } else {
    todayItems.push(newItem);
    saveItems(TODAY_KEY, todayItems);
  }

  renderChecklist();
  input.value = '';
  recurringToggle.checked = false;
});

// --- Checking items off ---

document.getElementById('recurring-items').addEventListener('change', (event) => {
  if (event.target.type !== 'checkbox') return;

  const id = event.target.dataset.id;
  const item = recurringItems.find((item) => item.id === id);
  item.checked = event.target.checked;

  saveItems(RECURRING_KEY, recurringItems);
});

document.getElementById('checklist-items').addEventListener('change', (event) => {
  if (event.target.type !== 'checkbox') return;

  const id = event.target.dataset.id;
  todayItems = todayItems.filter((item) => item.id !== id);

  saveItems(TODAY_KEY, todayItems);
  renderChecklist();
});
// --- Daily reset for recurring items ---

const RESET_DATE_KEY = 'dashboard:recurringResetDate';

function getTodayString() {
  return new Date().toDateString(); // e.g. "Thu Aug 06 2026"
}

function checkDailyReset() {
  const lastResetDate = localStorage.getItem(RESET_DATE_KEY);
  const today = getTodayString();

  if (lastResetDate === today) return; // already reset today, nothing to do

  recurringItems.forEach((item) => {
    item.checked = false;
  });

  saveItems(RECURRING_KEY, recurringItems);
  localStorage.setItem(RESET_DATE_KEY, today);
  renderChecklist();
}
// --- Initial render on page load ---
checkDailyReset();
renderChecklist();
setInterval(checkDailyReset, 60 * 1000);