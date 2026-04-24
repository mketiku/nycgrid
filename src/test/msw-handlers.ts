import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// NYC DOT camera API mock
const dotCameraHandler = http.get("https://webcams.nyctmc.org/api/cameras/:id/image", () => {
  return new HttpResponse(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
    headers: { "Content-Type": "image/jpeg" },
  });
});

// NOAA weather.gov mock
const noaaPointsHandler = http.get("https://api.weather.gov/points/:lat\\,:lng", () => {
  return HttpResponse.json({
    properties: {
      forecast: "https://api.weather.gov/gridpoints/OKX/33,37/forecast",
    },
  });
});

const noaaForecastHandler = http.get(
  "https://api.weather.gov/gridpoints/OKX/:grid/forecast",
  () => {
    return HttpResponse.json({
      properties: {
        periods: [
          {
            temperature: 72,
            shortForecast: "Partly Cloudy",
            isDaytime: true,
          },
        ],
      },
    });
  }
);

// Citibike GBFS mocks
const citibikeInfoHandler = http.get(
  "https://gbfs.citibikenyc.com/gbfs/en/station_information.json",
  () => {
    return HttpResponse.json({
      data: {
        stations: [
          {
            station_id: "stub-01",
            name: "Test St & Example Ave",
            lat: 40.7061,
            lon: -73.9969,
          },
        ],
      },
    });
  }
);

const citibikeStatusHandler = http.get(
  "https://gbfs.citibikenyc.com/gbfs/en/station_status.json",
  () => {
    return HttpResponse.json({
      data: {
        stations: [
          {
            station_id: "stub-01",
            num_docks_available: 8,
            num_bikes_available: 4,
            is_renting: 1,
          },
        ],
      },
    });
  }
);

// NYC Open Data events mock
const nycEventsHandler = http.get("https://data.cityofnewyork.us/resource/tvpp-9vvx.json", () => {
  return HttpResponse.json([]);
});

const coverageGapHandler = http.get("/api/coverage-gap", () =>
  HttpResponse.json({ type: "FeatureCollection", features: [] })
);

export const handlers = [
  dotCameraHandler,
  noaaPointsHandler,
  noaaForecastHandler,
  citibikeInfoHandler,
  citibikeStatusHandler,
  nycEventsHandler,
  coverageGapHandler,
];

export const server = setupServer(...handlers);
