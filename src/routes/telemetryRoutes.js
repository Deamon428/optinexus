import { Router } from 'express';
import { ingestTelemetry, getVehicleTelemetryTrail } from '../controllers/telemetryController.js';

const router = Router();

// Ingest mobile telemetry packet from Flutter app
router.post('/ingest', ingestTelemetry);

// Retrieve historic telemetry trail for a vehicle
router.get('/:vehicleId/trail', getVehicleTelemetryTrail);

export default router;
