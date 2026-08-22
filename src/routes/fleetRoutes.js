import { Router } from 'express';
import { getFleetStatus, registerVehicle } from '../controllers/fleetController.js';

const router = Router();

// Retrieve live fleet overview with latest telemetry coordinates
router.get('/status', getFleetStatus);

// Register or update a fleet asset
router.post('/register', registerVehicle);

export default router;
