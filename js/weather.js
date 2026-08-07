const LOCATION = {
    name: 'bremerton WA',
    latitude: 47.579629,
    longitude: -122.622618,

    name: 'Billings MT',
    latitude: 45.783287,
    longitude: -108.500687,
  };

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
  async function loadWeather() {
    const card = document.getElementById('weather-content');
  
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}` +
      `&current=temperature_2m,weather_code` +
      `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit` +
      `&timezone=auto`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API responded with status ${response.status}`);
      }
  
      const data = await response.json();
      const temp = Math.round(data.current.temperature_2m);
    const high = Math.round(data.daily.temperature_2m_max[0]);
    const low = Math.round(data.daily.temperature_2m_min[0]);
    const { label, icon } = describeWeatherCode(data.current.weather_code);

    card.innerHTML = `
      <div class="weather__row">
        <span class="weather__icon">${icon}</span>
        <span class="weather__temp">${temp}°</span>
      </div>
      <p class="weather__label">${label}</p>
      <p class="weather__range">H:${high}° L:${low}° · ${LOCATION.name}</p>
    `;
    window.sunTimes = {
        sunrise: isoTimeToDecimalHour(data.daily.sunrise[0]),
        sunset: isoTimeToDecimalHour(data.daily.sunset[0]),
      };
    } catch (error) {
      console.error('Failed to load weather:', error);
      card.innerHTML = `<p class="card__placeholder">Couldn't load weather right now.</p>`;
    }
  }
  function isoTimeToDecimalHour(isoString) {
    const time = isoString.split('T')[1];
    const [h, m] = time.split(':').map(Number);
    return h + m / 60;
  }