import { ai, DEFAULT_MODEL } from '../config/gemini.js';
import { fetchOSRMData, fetchLiveWeather, resolveLocationCoords } from './factualDataService.js';

export { fetchOSRMData, fetchLiveWeather } from './factualDataService.js';

export const generateOptimization = async (params) => {
  const {
    origin = 'TSMC Fab 18 (Hsinchu, Taiwan)',
    destination = 'Austin Giga Assembly (Texas, USA)',
    transportUnit = params.vehicleId || 'FLIGHT-TW-TX',
    cargoMass = params.payloadKg || 14500,
    maxHOS = params.constraints?.maxHOS || params.constraints?.maxContinuousDriveHours || 8
  } = params;

  // Extract location keys from the dropdown strings
  const getCoords = (locationString) => {
    const loc = (locationString || '').toLowerCase();
    if (loc.includes('tsmc') || loc.includes('taiwan')) return { lat: 23.11, lon: 120.28 }; // TSMC Fab 18
    if (loc.includes('austin') || loc.includes('texas')) return { lat: 30.22, lon: -97.61 }; // Austin Giga
    if (loc.includes('asml') || loc.includes('veldhoven')) return { lat: 51.40, lon: 5.40 }; // ASML NL
    if (loc.includes('munich') || loc.includes('auto')) return { lat: 48.13, lon: 11.58 }; // Munich DE
    if (loc.includes('tokyo')) return { lat: 35.62, lon: 139.77 }; // Tokyo Port
    if (loc.includes('long beach')) return { lat: 33.75, lon: -118.21 }; // Port of Long Beach
    if (loc.includes('delhi')) return { lat: 28.55, lon: 77.10 }; // Delhi IGI
    if (loc.includes('dubai')) return { lat: 24.89, lon: 55.16 }; // Dubai Al Maktoum
    if (loc.includes('memphis')) return { lat: 35.04, lon: -89.97 }; // Memphis SuperHub
    if (loc.includes('shenzhen')) return { lat: 22.54, lon: 114.05 }; // Shenzhen Port
    return { lat: 0, lon: 0 }; // Fallback
  };

  const originCoords = getCoords(origin);
  const destCoords = getCoords(destination);

  const weather = await fetchLiveWeather(destCoords.lat, destCoords.lon);
  let distanceStr = "Transoceanic/Air Route";
  
  if (transportUnit.includes("TRUCK")) {
    const osrm = await fetchOSRMData(originCoords.lon, originCoords.lat, destCoords.lon, destCoords.lat);
    if (osrm) {
      distanceStr = `${osrm.distanceKm} km (Est. ${osrm.durationHours} hrs)`;
    } else {
      const error = new Error("CRITICAL ROUTING ERROR: Impossible terrestrial route detected (e.g. transoceanic). Ground vehicle cannot proceed.");
      error.statusCode = 400;
      throw error;
    }
  }

  const prompt = `
    Calculate enterprise logistics optimization. 
    Origin: ${origin} | Destination: ${destination} | Vehicle: ${transportUnit} | Mass: ${cargoMass}kg | HOS: ${maxHOS}h
    
    FACTUAL CONSTRAINTS (DO NOT HALLUCINATE):
    - Verified Distance: ${distanceStr}
    - Destination Weather: ${weather.temp}°C, Condition: ${weather.condition}

    If weather condition is RAIN/SNOW, SLA Risk MUST be HIGH and margin Expansion drops by at least 3%.
    If Vehicle is TRUCK and HOS < 8, margin Expansion MUST drop to < 5.0%.
    
    SPEED & CONCISENESS RULES:
    1. Provide exactly 3 waypoints for the journey.
    2. Write a BRIEF synthesis paragraph explaining the logic. MAXIMUM 2 SHORT SENTENCES. Do not generate long explanations. Keep token count low for speed.
    
    Return strict JSON without markdown formatting with keys:
    {
      "marginExpansion": "string (e.g. +9.4%)",
      "projectedMargin": number,
      "optimizedCost": number,
      "baselineCost": number,
      "slaRisk": "LOW" | "MEDIUM" | "HIGH",
      "waypoints": [
        { "title": "string", "eta": "string", "status": "string", "fuel": "string" }
      ],
      "synthesis": "string (MAX 2 short sentences)"
    }
  `;

  // Verify Gemini API Key
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    const error = new Error('CRITICAL: GEMINI_API_KEY is missing or unconfigured. Real AI optimization solver disabled.');
    error.statusCode = 500;
    throw error;
  }

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const rawText = response.text?.trim() || '';
    if (!rawText) {
      throw new Error('Gemini API returned an empty response body.');
    }

    const cleanJson = JSON.parse(rawText);

    // Normalize output structure for full cross-system compatibility
    let marginLiftVal = 8.5;
    if (cleanJson.marginExpansion) {
      marginLiftVal = parseFloat(String(cleanJson.marginExpansion).replace('%', '').replace('+', '')) || 8.5;
    }

    // Format normalized response
    const formattedResult = {
      success: true,
      jobId: params.jobId || `OPT-${Date.now()}`,
      source: 'GEMINI_AI',
      model: DEFAULT_MODEL,
      marginExpansion: cleanJson.marginExpansion || `+${marginLiftVal.toFixed(1)}%`,
      projectedMargin: cleanJson.projectedMargin || 1442.90,
      optimizedCost: cleanJson.optimizedCost || 1724.80,
      baselineCost: cleanJson.baselineCost || 2140.00,
      slaRisk: cleanJson.slaRisk || 'LOW',
      waypoints: cleanJson.waypoints || [],
      synthesis: cleanJson.synthesis || 'Optimization synthesized via Google Gemini 3.6 Flash.',
      result: {
        financials: {
          marginLiftPct: marginLiftVal,
          projectedMarginUsd: cleanJson.projectedMargin || 1442.90,
          optimizedCostUsd: cleanJson.optimizedCost || 1724.80,
          baselineCostUsd: cleanJson.baselineCost || 2140.00,
          estimatedFuelCostUsd: cleanJson.optimizedCost ? cleanJson.optimizedCost * 0.35 : 420.00
        },
        slaRiskLevel: cleanJson.slaRisk || 'LOW',
        reasoning: cleanJson.synthesis || 'Optimization synthesized via Google Gemini 3.6 Flash.',
        optimizedWaypoints: (cleanJson.waypoints || []).map(wp => ({
          waypoint: wp.title || wp.waypoint || 'Waypoint',
          etaMinutes: parseInt(wp.eta) || 120,
          action: wp.status || wp.action || 'ON_ROUTE',
          fuelEstimatedLiters: parseInt(wp.fuel) || 150
        }))
      }
    };

    return formattedResult;
  } catch (error) {
    console.error('🔥 ACTUAL PIPELINE ERROR:', error.message);
    const apiError = new Error(`Gemini AI Solver Error: ${error.message}`);
    apiError.statusCode = error.statusCode || 400;
    throw apiError;
  }
};

export class GeminiOptimizerService {
  static async generateOptimization(jobContext) {
    return generateOptimization(jobContext);
  }

  static async optimizeRoute(jobContext) {
    return generateOptimization(jobContext);
  }
}
