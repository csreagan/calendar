// ==========================================================================
// CALENDAR
// One sign-in, one fetch — feeds both the week columns and the month grid.
// ==========================================================================

const CLIENT_ID = '312386544320-f48i3uuqtve0jgo9lapuhms2d9rt102o.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;

function initCalendarSignIn() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        console.error('Google sign-in error:', response);
        return;
      }
      loadCalendarEvents(response.access_token);
    },
  });

  document.getElementById('calendar-signin').addEventListener('click', () => {
    tokenClient.requestAccessToken();
  });
}

async function loadCalendarEvents(accessToken) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Fetch a window wide enough to cover BOTH the rolling week and the
  // whole calendar month, whichever stretches further in each direction.
  const fetchStart = monthStart < today ? monthStart : today;
  const fetchEndCandidate = new Date(monthEnd);
  fetchEndCandidate.setDate(fetchEndCandidate.getDate() + 1);
  const fetchEnd = fetchEndCandidate > weekEnd ? fetchEndCandidate : weekEnd;

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${fetchStart.toISOString()}` +
    `&timeMax=${fetchEnd.toISOString()}` +
    `&maxResults=100&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Calendar API responded with status ${response.status}`);
    }

    const data = await response.json();
    const events = data.items || [];

    renderWeekView(events, today);
    renderMonthView(events, monthStart, monthEnd, today);
  } catch (error) {
    console.error('Failed to load calendar events:', error);
    document.getElementById('week-content').innerHTML =
      `<p class="card__placeholder">Couldn't load events.</p>`;
    document.getElementById('month-content').innerHTML =
      `<p class="card__placeholder">Couldn't load events.</p>`;
  }
}

function getEventDate(event) {
  return event.start.dateTime
    ? new Date(event.start.dateTime)
    : new Date(`${event.start.date}T00:00`);
}

function formatEventTime(event) {
  if (!event.start.dateTime) return 'All day';
  return new Date(event.start.dateTime).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// --- Week view (unchanged from before) ---

function renderWeekView(events, weekStart) {
  const content = document.getElementById('week-content');

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return { date, dateKey: date.toDateString(), events: [] };
  });

  events.forEach((event) => {
    const eventDateKey = getEventDate(event).toDateString();
    const day = days.find((d) => d.dateKey === eventDateKey);
    if (day) day.events.push(event);
  });

  const dayColumns = days
    .map((day) => {
      const dayLabel = day.date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const eventsHtml =
        day.events.length === 0
          ? `<p class="calendar__day-empty">—</p>`
          : day.events
              .map(
                (event) => `
                  <div class="calendar__day-event">
                    <span class="calendar__day-event-time">${formatEventTime(event)}</span>
                    <span class="calendar__day-event-title">${event.summary || '(No title)'}</span>
                  </div>
                `
              )
              .join('');

      return `
        <div class="calendar__day-column">
          <p class="calendar__day-header">${dayLabel}</p>
          ${eventsHtml}
        </div>
      `;
    })
    .join('');

  content.innerHTML = `<div class="calendar__week">${dayColumns}</div>`;
}

// --- Month view (new) ---

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function renderMonthView(events, monthStart, monthEnd, today) {
  document.getElementById('month-title').textContent =
    monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const content = document.getElementById('month-content');
  const daysInMonth = monthEnd.getDate();
  const firstWeekday = monthStart.getDay(); // 0 = Sunday

  // Group events by date string, but only ones that actually fall in this month
  const eventsByDate = {};
  events.forEach((event) => {
    const eventDate = getEventDate(event);
    if (eventDate < monthStart || eventDate > monthEnd) return;
    const key = eventDate.toDateString();
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  });

  const weekdayHeaders = WEEKDAY_LABELS.map(
    (label) => `<span class="calendar__month-weekday">${label}</span>`
  ).join('');

  // Empty cells before day 1, so day 1 lands under the correct weekday column
  const leadingBlanks = Array.from(
    { length: firstWeekday },
    () => `<div class="calendar__month-day calendar__month-day--empty"></div>`
  ).join('');

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1;
    const cellDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayNumber);
    const dayEvents = eventsByDate[cellDate.toDateString()] || [];
    const isToday = cellDate.toDateString() === today.toDateString();

    const dot = dayEvents.length > 0 ? `<span class="calendar__month-day-dot"></span>` : '';
    const timeLabel =
      dayEvents.length > 0
        ? `<span class="calendar__month-day-time">${formatEventTime(dayEvents[0])}</span>`
        : '';

    return `
      <div class="calendar__month-day${isToday ? ' calendar__month-day--today' : ''}">
        <span class="calendar__month-day-number">${dayNumber}</span>
        ${dot}
        ${timeLabel}
      </div>
    `;
  }).join('');

  content.innerHTML = `
    <div class="calendar__month-weekdays">${weekdayHeaders}</div>
    <div class="calendar__month-grid">${leadingBlanks}${dayCells}</div>
  `;
}

window.addEventListener('load', initCalendarSignIn);