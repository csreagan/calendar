// ==========================================================================
// CLOCK
// Digital time (hours:minutes, no seconds) + a day-progress ring.
// ==========================================================================

const RING_CIRCUMFERENCE = 565.5;

function updateClock() {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const pad = (n) => String(n).padStart(2, '0');
  const timeString = `${pad(hours)}:${pad(minutes)}`;

  document.getElementById('clock-time').textContent = timeString;
  document.getElementById('clock-period').textContent = period;

  const secondsSinceMidnight =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const fractionOfDay = secondsSinceMidnight / 86400;

  const offset = RING_CIRCUMFERENCE * (1 - fractionOfDay);
  document.getElementById('ring-progress').style.strokeDashoffset = offset;

  const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('today-date').textContent =
    now.toLocaleDateString(undefined, dateOptions);
}

updateClock();
setInterval(updateClock, 1000);