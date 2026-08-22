import { TelemetryService } from '../services/telemetryService.js';

export const ingestTelemetry = async (req, res, next) => {
  try {
    const { vehicleId, latitude, longitude } = req.body;

    if (!vehicleId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required telemetry fields: vehicleId, latitude, and longitude are mandatory.'
      });
    }

    const record = await TelemetryService.recordTelemetry(req.body);

    return res.status(201).json({
      success: true,
      message: 'Telemetry frame ingested successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleTelemetryTrail = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;

    const trail = await TelemetryService.getRecentTelemetry(vehicleId, limit);

    return res.status(200).json({
      success: true,
      vehicleId,
      count: trail.length,
      data: trail
    });
  } catch (error) {
    next(error);
  }
};
