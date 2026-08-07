// ==========================================================================
// WEATHER
// ==========================================================================

const LOCATIONS = [
    { name: 'Bremerton, WA', latitude: 47.579629, longitude: -122.622618 },
    { name: 'Billings, MT', latitude: 45.783287, longitude: -108.500687 },
  ];
  
  const WEATHER_CODES = {
    0: { label: 'Clear sky', icon: '☀️' },
    1: { label: 'Mostly clear', icon: '🌤️' },
    2: { label: 'Partly cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Fog', icon: '🌫️' },
    48: { label: 'Fog', icon: '🌫️' },
    51: { label: 'Light drizzle', icon: '🌦️' },
    53: { label: 'Drizzle', icon: '🌦️' },
    55: { label: 'Heavy drizzle', icon: '🌧️' },
    61: { label: 'Light rain', icon: '🌦️' },
    63: { label: 'Rain', icon: '🌧️' },
    65: { label: 'Heavy rain', icon: '🌧️' },
    71: { label: 'Light snow', icon: '🌨️' },
    73: { label: 'Snow', icon: '❄️' },
    75: { label: 'Heavy snow', icon: '❄️' },
    80: { label: 'Rain showers', icon: '🌦️' },
    81: { label: 'Rain showers', icon: '🌧️' },
    82: { label: 'Violent showers', icon: '⛈️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
  };
  
  function describeWeatherCode(code) {
    return WEATHER_CODES[code] || { label: 'Unknown', icon: '❔' };
  }
  
  async function getForecast(location) {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${location.latitude}&longitude=${location.longitude}` +
      `&current=temperature_2m,weather_code` +
      `&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min` +
      `&forecast_days=10` +
      `&temperature_unit=fahrenheit` +
      `&timezone=auto`;
  
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }
  
    const data = await response.json();
    const { label, icon } = describeWeatherCode(data.current.weather_code);
  
    const days = data.daily.time.map((dateString, index) => {
      const dayCode = describeWeatherCode(data.daily.weather_code[index]);
      return {
        label: index === 0 ? 'Today' : formatDayName(dateString),
        icon: dayCode.icon,
        high: Math.round(data.daily.temperature_2m_max[index]),
        low: Math.round(data.daily.temperature_2m_min[index]),
      };
    });
  
    return {
      name: location.name,
      temp: Math.round(data.current.temperature_2m),
      high: days[0].high,
      low: days[0].low,
      label,
      icon,
      sunrise: isoTimeToDecimalHour(data.daily.sunrise[0]),
      sunset: isoTimeToDecimalHour(data.daily.sunset[0]),
      days,
    };
  }
  
  function formatDayName(dateString) {
    const date = new Date(`${dateString}T00:00`);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  
  function isoTimeToDecimalHour(isoString) {
    const time = isoString.split('T')[1];
    const [h, m] = time.split(':').map(Number);
    return h + m / 60;
  }
  
  function renderLocationBlock(forecast) {
    const dayRows = forecast.days
      .map(
        (day) => `
          <div class="weather__day-row">
            <span class="weather__day-name">${day.label}</span>
            <span class="weather__day-icon">${day.icon}</span>
            <span class="weather__day-high">${day.high}°</span>
            <span class="weather__day-low">${day.low}°</span>
          </div>
        `
      )
      .join('');
  
    return `
      <div class="weather__location">
        <p class="weather__location-name">${forecast.name}</p>
        <div class="weather__row">
          <span class="weather__icon">${forecast.icon}</span>
          <span class="weather__temp">${forecast.temp}°</span>
        </div>
        <p class="weather__label">${forecast.label}</p>
        <p class="weather__range">H:${forecast.high}° L:${forecast.low}°</p>
        <div class="weather__forecast">
          ${dayRows}
        </div>
      </div>
    `;
  }
  
  async function loadWeather() {
    const card = document.getElementById('weather-content');
  
    try {
      const forecasts = await Promise.all(LOCATIONS.map(getForecast));
  
      card.innerHTML = forecasts.map(renderLocationBlock).join('');
  
      window.sunTimes = {
        sunrise: forecasts[0].sunrise,
        sunset: forecasts[0].sunset,
      };
    } catch (error) {
      console.error('Failed to load weather:', error);
      card.innerHTML = `<p class="card__placeholder">Couldn't load weather right now.</p>`;
    }
  }