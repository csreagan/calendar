// ==========================================================================
// CALENDAR
// Uses Google Identity Services (GIS) for browser-only OAuth — no backend,
// no client secret. The flow: user clicks a button, Google shows a popup
// to sign in and approve access, and we get back a short-lived access
// token we can use to call the Calendar API directly from the browser.
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

  const now = new Date().toISOString();
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${now}&maxResults=10&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Calendar API responded with status ${response.status}`);
    }

    const data = await response.json();
    renderEvents(data.items);
  } catch (error) {
    console.error('Failed to load calendar events:', error);
    content.innerHTML = `<p class="card__placeholder">Couldn't load events.</p>`;
  }
}

function renderEvents(events) {
  const content = document.getElementById('calendar-content');

  if (!events || events.length === 0) {
    content.innerHTML = `<p class="card__placeholder">No upcoming events.</p>`;
    return;
  }

  content.innerHTML = events
    .map((event) => {
      const start = event.start.dateTime || event.start.date;
      const label = event.start.dateTime
        ? new Date(start).toLocaleString(undefined, {
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })
        : new Date(`${start}T00:00`).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

      return `
        <div class="calendar__event">
          <span class="calendar__event-time">${label}</span>
          <span class="calendar__event-title">${event.summary || '(No title)'}</span>
        </div>
      `;
    })
    .join('');
}

window.addEventListener('load', initCalendarSignIn);