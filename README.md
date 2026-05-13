# Weather Dashboard

A responsive weather dashboard built with HTML, CSS, and vanilla JavaScript using the OpenWeatherMap API.

## Features

- Current weather (temperature, humidity, wind speed, and description)
- 5-day forecast with weather icons
- City search
- Celsius/Fahrenheit unit toggle
- Local storage for unit preference and last searched city
- Loading states and clear error messages
- Responsive layout for desktop and mobile

## Setup

1. Clone or download this repository.
2. Open `index.html` in your browser.
3. Create a free API key at [OpenWeatherMap](https://openweathermap.org/api).
4. Paste your API key in the **OpenWeather API Key** field and click **Save Key**.
5. Search for a city.

## Files

- `index.html` - App structure
- `styles.css` - Styling and responsive layout
- `app.js` - API calls, rendering, local storage, interactions

## Notes

- This project uses OpenWeatherMap endpoints:
  - Current weather: `/data/2.5/weather`
  - Forecast: `/data/2.5/forecast`
- The API key is used in-memory for the active browser session only.
