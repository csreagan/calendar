const RING_CIRCUMFERENCE = 565.5;

window.sunTimes = { sunrise: 6, sunset: 18 };

function updateClock() {
    const now = new Date();
  
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const period = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12;
    if (hours === 0) hours = 12;
  
    const pad = (n) => String(n).padStart(2, '0');
    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  
    document.getElementById('clock-time').textContent = timeString;
    document.getElementById('clock-period').textContent = period;
    const secondsSinceMidnight =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const fractionOfDay = secondsSinceMidnight / 86400;

  const offset = RING_CIRCUMFERENCE * (1 - fractionOfDay);
  const ring = document.getElementById('ring-progress');
  ring.style.strokeDashoffset = offset;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const isDaytime =
    currentHour >= window.sunTimes.sunrise && currentHour < window.sunTimes.sunset;
  ring.style.stroke = isDaytime
    ? 'var(--accent-day)'
    : 'var(--accent-night)';
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('today-date').textContent =
    now.toLocaleDateString(undefined, dateOptions);
}

updateClock();
setInterval(updateClock, 1000);