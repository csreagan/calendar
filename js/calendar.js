// ==========================================================================
// CALENDAR
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
  const content = document.getElementById('calendar-content');
  content.innerHTML = `<p class="card__placeholder">Loading events…</p>`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${today.toISOString()}` +
    `&timeMax=${weekEnd.toISOString()}` +
    `&maxResults=50&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Calendar API responded with status ${response.status}`);
    }

    const data = await response.json();
    renderWeekView(data.items || [], today);
  } catch (error) {
    console.error('Failed to load calendar events:', error);
    content.innerHTML = `<p class="card__placeholder">Couldn't load events.</p>`;
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

function renderWeekView(events, weekStart) {
  const content = document.getElementById('calendar-content');

  // Build the 7 days of the week, each as { date, dateKey, events: [] }
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return { date, dateKey: date.toDateString(), events: [] };
  });

  // Sort each event into the matching day by comparing date strings
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

window.addEventListener('load', initCalendarSignIn);