/**
 * Factual Data Verification Service (OSRM Routing + Open-Meteo Weather)
 */

export const fetchOSRMData = async (startLon, startLat, endLon, endLat) => {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok') {
      return {
        distanceKm: (data.routes[0].distance / 1000).toFixed(2),
        durationHours: (data.routes[0].duration / 3600).toFixed(2)
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const fetchLiveWeather = async (lat, lon) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      temp: data.current_weather.temperature,
      condition: data.current_weather.weathercode > 50 ? "RAIN/SNOW" : "CLEAR"
    };
  } catch (e) {
    return { temp: 20, condition: "CLEAR" };
  }
};

// Known coordinates dictionary for factual telemetry enrichment
export const LOCATION_COORDINATES = {
  'TSMC Fab 18 (Hsinchu, Taiwan)': { lat: 24.7827, lon: 120.9983 },
  'ASML Optics Facility (Veldhoven, NL)': { lat: 51.4180, lon: 5.4120 },
  'Samsung Pyeongtaek Fab (Seoul, Korea)': { lat: 37.0016, lon: 127.0850 },
  'GlobalFoundries Dresden (Germany)': { lat: 51.1264, lon: 13.7226 },
  'Austin Giga Assembly (Texas, USA)': { lat: 30.2672, lon: -97.7431 },
  'Munich Automotive Hub (Germany)': { lat: 48.1351, lon: 11.5820 },
  'Phoenix MegaFab (Arizona, USA)': { lat: 33.4484, lon: -112.0740 },
  'Tokyo AI Datacenter (Japan)': { lat: 35.6762, lon: 139.6503 }
};

export const resolveLocationCoords = (locationStr) => {
  if (!locationStr) return null;
  if (LOCATION_COORDINATES[locationStr]) return LOCATION_COORDINATES[locationStr];
  
  const lower = locationStr.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return coords;
    }
  }
  return null;
};
