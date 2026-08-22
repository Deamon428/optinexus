/**
 * Factual Data Verification Service (OSRM Highway Routing + Open-Meteo Weather)
 */

export const fetchOSRMData = async (startLon, startLat, endLon, endLat) => {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
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
      temp: data.current_weather?.temperature ?? 20,
      condition: data.current_weather?.weathercode > 50 ? "RAIN/SNOW" : "CLEAR"
    };
  } catch (e) {
    return { temp: 20, condition: "CLEAR" };
  }
};

// Known global logistics hubs coordinates dictionary
export const LOCATION_COORDINATES = {
  'TSMC Fab 18 (Hsinchu, Taiwan)': { lat: 24.7827, lon: 120.9983, name: 'Taiwan' },
  'ASML Optics Facility (Veldhoven, NL)': { lat: 51.4180, lon: 5.4120, name: 'Netherlands' },
  'Samsung Pyeongtaek Fab (Seoul, Korea)': { lat: 37.0016, lon: 127.0850, name: 'Korea' },
  'GlobalFoundries Dresden (Germany)': { lat: 51.1264, lon: 13.7226, name: 'Germany' },
  'Austin Giga Assembly (Texas, USA)': { lat: 30.2672, lon: -97.7431, name: 'Texas' },
  'Munich Automotive Hub (Germany)': { lat: 48.1351, lon: 11.5820, name: 'Munich' },
  'Phoenix MegaFab (Arizona, USA)': { lat: 33.4484, lon: -112.0740, name: 'Arizona' },
  'Tokyo AI Datacenter (Japan)': { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  'Delhi IGI (IN)': { lat: 28.5562, lon: 77.1000, name: 'Delhi' },
  'Dubai Al Maktoum (UAE)': { lat: 24.8964, lon: 55.1614, name: 'Dubai' },
  'Memphis SuperHub (US)': { lat: 35.0424, lon: -89.9767, name: 'Memphis' },
  'Shenzhen Port (CN)': { lat: 22.5431, lon: 114.0579, name: 'Shenzhen' }
};

export const resolveLocationCoords = (locationStr, fallback = { lat: 24.7827, lon: 120.9983 }) => {
  if (!locationStr) return fallback;
  if (LOCATION_COORDINATES[locationStr]) return LOCATION_COORDINATES[locationStr];
  
  const lower = locationStr.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return coords;
    }
  }

  if (lower.includes('taiwan') || lower.includes('hsinchu') || lower.includes('tsmc')) return { lat: 24.7827, lon: 120.9983 };
  if (lower.includes('texas') || lower.includes('austin') || lower.includes('giga')) return { lat: 30.2672, lon: -97.7431 };
  if (lower.includes('netherlands') || lower.includes('veldhoven') || lower.includes('asml')) return { lat: 51.4180, lon: 5.4120 };
  if (lower.includes('munich') || lower.includes('germany')) return { lat: 48.1351, lon: 11.5820 };
  if (lower.includes('korea') || lower.includes('seoul') || lower.includes('samsung')) return { lat: 37.0016, lon: 127.0850 };
  if (lower.includes('arizona') || lower.includes('phoenix')) return { lat: 33.4484, lon: -112.0740 };
  if (lower.includes('japan') || lower.includes('tokyo')) return { lat: 35.6762, lon: 139.6503 };

  return fallback;
};
