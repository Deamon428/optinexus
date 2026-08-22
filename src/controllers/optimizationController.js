import { generateOptimization } from '../services/geminiOptimizerService.js';
import { dbAll } from '../config/database.js';

// The Multi-Tenant Vault
global.sessionCache = global.sessionCache || new Map();

export const solveOptimization = async (req, res) => {
  try {
    const sessionId = req.header('X-Session-ID');
    if (!sessionId) throw new Error("Missing Session Fingerprint");

    // Pass data to Gemini + Factual Services
    const result = await generateOptimization(req.body);
    
    // Save to this specific user's vault
    global.sessionCache.set(sessionId, result);
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const solveRouteOptimization = solveOptimization;

export const getSessionState = async (req, res) => {
  const sessionId = req.header('X-Session-ID');
  if (sessionId && global.sessionCache.has(sessionId)) {
    return res.status(200).json(global.sessionCache.get(sessionId));
  }
  return res.status(200).json({ status: 'standby' });
};

export const getOptimizationHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const history = await dbAll(
      `SELECT * FROM route_optimizations ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );

    const parsed = history.map((h) => ({
      ...h,
      constraints: h.constraints_json ? JSON.parse(h.constraints_json) : {},
      optimizedWaypoints: h.optimized_waypoints_json ? JSON.parse(h.optimized_waypoints_json) : []
    }));

    return res.status(200).json({
      success: true,
      count: parsed.length,
      data: parsed
    });
  } catch (error) {
    next(error);
  }
};
