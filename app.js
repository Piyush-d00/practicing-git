const API_BASE = "https://api.openweathermap.org/data/2.5";
const ICON_BASE = "https://openweathermap.org/img/wn";
const LAST_CITY_KEY = "weather_last_city";
const UNIT_STORAGE = "weather_unit";

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const statusMessage = document.getElementById("status-message");
const errorMessage = document.getElementById("error-message");
const forecastList = document.getElementById("forecast-list");

const currentIcon = document.getElementById("current-icon");
const currentCity = document.getElementById("current-city");
const currentTemp = document.getElementById("current-temp");
const currentDescription = document.getElementById("current-description");
const currentHumidity = document.getElementById("current-humidity");
const currentWind = document.getElementById("current-wind");

const apiKeyInput = document.getElementById("api-key-input");
const saveKeyButton = document.getElementById("save-key-button");
const unitButtons = document.querySelectorAll(".unit-btn");

const savedUnit = localStorage.getItem(UNIT_STORAGE);
let unit = savedUnit === "imperial" ? "imperial" : "metric";
let apiKey = "";

function getApiKey() {
  return apiKey.trim();
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Loading..." : "Search";
  if (isLoading) {
    statusMessage.textContent = "Fetching weather data...";
  }
}

function formatTemp(value) {
  return `${Math.round(value)}°${unit === "metric" ? "C" : "F"}`;
}

function formatWind(value) {
  if (typeof value !== "number") {
    return "—";
  }
  const suffix = unit === "metric" ? "m/s" : "mph";
  return `${value} ${suffix}`;
}

function updateUnitButtons() {
  unitButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.unit === unit);
  });
}

function clearError() {
  errorMessage.textContent = "";
}

function setError(message) {
  errorMessage.textContent = message;
  statusMessage.textContent = "";
}

function toSentenceCase(text) {
  if (!text) {
    return "N/A";
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function setCurrentWeather(data) {
  const weather = data.weather?.[0] || {};
  currentCity.textContent = data.sys?.country ? `${data.name}, ${data.sys.country}` : data.name;
  currentTemp.textContent = formatTemp(data.main?.temp ?? 0);
  currentDescription.textContent = toSentenceCase(weather.description);
  currentHumidity.textContent = `${data.main?.humidity ?? "-"}%`;
  currentWind.textContent = formatWind(data.wind?.speed);
  currentIcon.src = weather.icon ? `${ICON_BASE}/${weather.icon}@2x.png` : "";
  currentIcon.alt = weather.description || "Weather icon";
}

function createForecastItem(item) {
  const weather = item.weather?.[0] || {};
  const date = new Date(item.dt * 1000);

  const card = document.createElement("div");
  card.className = "forecast-item";

  const day = document.createElement("p");
  day.textContent = date.toLocaleDateString(undefined, { weekday: "short" });

  const icon = document.createElement("img");
  icon.src = weather.icon ? `${ICON_BASE}/${weather.icon}@2x.png` : "";
  icon.alt = weather.description || "Forecast icon";

  const temp = document.createElement("p");
  temp.textContent = formatTemp(item.main?.temp ?? 0);

  const desc = document.createElement("p");
  desc.textContent = weather.main || "N/A";

  card.append(day, icon, temp, desc);
  return card;
}

function setForecast(data) {
  forecastList.textContent = "";

  const byDay = new Map();
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toISOString().slice(0, 10);
    const hour = new Date(item.dt * 1000).getHours();
    if (!byDay.has(date) && hour >= 11 && hour <= 14) {
      byDay.set(date, item);
    }
  });

  const fallback = data.list.filter((_, idx) => idx % 8 === 0);
  const selected = Array.from(byDay.values()).slice(0, 5);
  const items = selected.length === 5 ? selected : fallback.slice(0, 5);

  items.forEach((item) => {
    forecastList.appendChild(createForecastItem(item));
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  const rawPayload = await response.text();
  let payload = {};

  if (rawPayload) {
    try {
      payload = JSON.parse(rawPayload);
    } catch (error) {
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}.`);
      }
      throw new Error("Received malformed weather API response.");
    }
  }

  if (!response.ok) {
    throw new Error(payload.message || "Unable to fetch weather data.");
  }
  return payload;
}

async function loadWeather(city) {
  const apiKey = getApiKey();
  if (!apiKey) {
    setError("Please save your OpenWeather API key first.");
    return;
  }

  clearError();
  setLoading(true);

  try {
    const query = encodeURIComponent(city.trim());
    const currentUrl = `${API_BASE}/weather?q=${query}&appid=${apiKey}&units=${unit}`;
    const forecastUrl = `${API_BASE}/forecast?q=${query}&appid=${apiKey}&units=${unit}`;

    const [current, forecast] = await Promise.all([
      fetchJson(currentUrl),
      fetchJson(forecastUrl),
    ]);

    setCurrentWeather(current);
    setForecast(forecast);
    localStorage.setItem(LAST_CITY_KEY, city.trim());
    statusMessage.textContent = `Updated for ${current.name}`;
  } catch (error) {
    const normalized = error.message.toLowerCase();
    setError(
      normalized.includes("city not found")
        ? "City not found. Please check the spelling and try again."
        : `Failed to load weather: ${error.message}`
    );
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setError("Please enter a city name.");
    return;
  }
  loadWeather(city);
});

saveKeyButton.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    setError("API key cannot be empty.");
    return;
  }
  apiKey = key;
  apiKeyInput.value = "";
  clearError();
  statusMessage.textContent = "API key set for this session.";
  const lastCity = localStorage.getItem(LAST_CITY_KEY);
  if (lastCity) {
    loadWeather(lastCity);
  }
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    unit = button.dataset.unit;
    localStorage.setItem(UNIT_STORAGE, unit);
    updateUnitButtons();
    const lastCity = localStorage.getItem(LAST_CITY_KEY);
    if (lastCity) {
      loadWeather(lastCity);
    }
  });
});

(function init() {
  updateUnitButtons();
  const lastCity = localStorage.getItem(LAST_CITY_KEY);
  if (lastCity) {
    cityInput.value = lastCity;
  }
  statusMessage.textContent = "Set your API key and search for a city to get started.";
})();
