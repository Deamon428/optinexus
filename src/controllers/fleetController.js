import { TelemetryService } from '../services/telemetryService.js';
import { dbAll, dbRun } from '../config/database.js';

export const getFleetStatus = async (req, res, next) => {
  try {
    const fleet = await TelemetryService.getFleetOverview();
    return res.status(200).json({
      success: true,
      count: fleet.length,
      data: fleet
    });
  } catch (error) {
    next(error);
  }
};

export const registerVehicle = async (req, res, next) => {
  try {
    const { vehicleId, driverName, model, capacityKg, fuelEfficiencyKmPerL, costPerKmUsd } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ success: false, error: 'vehicleId is required' });
    }

    await dbRun(
      `INSERT OR REPLACE INTO fleet_vehicles 
       (vehicle_id, driver_name, model, capacity_kg, fuel_efficiency_km_per_l, cost_per_km_usd, current_status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [vehicleId, driverName || 'Unassigned', model || 'Standard Heavy Truck', capacityKg || 20000, fuelEfficiencyKmPerL || 4.0, costPerKmUsd || 1.30]
    );

    return res.status(201).json({
      success: true,
      message: `Vehicle ${vehicleId} registered successfully in OptiNexus fleet roster.`
    });
  } catch (error) {
    next(error);
  }
};
