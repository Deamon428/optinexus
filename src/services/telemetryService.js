import { dbRun, dbGet, dbAll } from '../config/database.js';

export class TelemetryService {
  /**
   * Record operational telemetry packet from mobile app.
   */
  static async recordTelemetry(data) {
    const {
      vehicleId,
      driverId = null,
      tripId = null,
      latitude,
      longitude,
      speedKmh = 0,
      fuelLevelPct = 100,
      engineTempC = 90,
      payloadKg = 0,
      trafficDensity = 'NORMAL',
      status = 'ON_ROUTE',
      metadata = {}
    } = data;

    const result = await dbRun(
      `INSERT INTO telemetry_logs 
       (vehicle_id, driver_id, trip_id, latitude, longitude, speed_kmh, fuel_level_pct, engine_temp_c, payload_kg, traffic_density, status, raw_metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicleId,
        driverId,
        tripId,
        latitude,
        longitude,
        speedKmh,
        fuelLevelPct,
        engineTempC,
        payloadKg,
        trafficDensity,
        status,
        JSON.stringify(metadata)
      ]
    );

    // Update fleet vehicle last ping & status
    await dbRun(
      `UPDATE fleet_vehicles 
       SET last_ping = CURRENT_TIMESTAMP, current_status = ? 
       WHERE vehicle_id = ?`,
      [status, vehicleId]
    );

    return { id: result.id, vehicleId, status, timestamp: new Date().toISOString() };
  }

  /**
   * Retrieve recent telemetry trail for a vehicle.
   */
  static async getRecentTelemetry(vehicleId, limit = 50) {
    return await dbAll(
      `SELECT * FROM telemetry_logs 
       WHERE vehicle_id = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [vehicleId, limit]
    );
  }

  /**
   * Retrieve latest telemetry status for all active fleet units.
   */
  static async getFleetOverview() {
    return await dbAll(`
      SELECT f.*, t.latitude, t.longitude, t.speed_kmh, t.fuel_level_pct, t.engine_temp_c, t.traffic_density
      FROM fleet_vehicles f
      LEFT JOIN (
        SELECT t1.*
        FROM telemetry_logs t1
        INNER JOIN (
          SELECT vehicle_id, MAX(id) as max_id
          FROM telemetry_logs
          GROUP BY vehicle_id
        ) t2 ON t1.id = t2.max_id
      ) t ON f.vehicle_id = t.vehicle_id
    `);
  }
}
