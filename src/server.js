import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, db } from './config/database.js';
import healthRoutes from './routes/healthRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import optimizationRoutes from './routes/optimizationRoutes.js';
import fleetRoutes from './routes/fleetRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static frontend assets from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Engine JSON Index Route
app.get('/api', (req, res) => {
  res.status(200).json({
    engine: 'OptiNexus B2B SaaS Logistics Optimization Engine',
    version: '1.0.0',
    status: 'ONLINE',
    description: 'Autonomous constraint solving and route margin optimization backend powered by Google Gemini.',
    endpoints: {
      dashboard: 'GET /',
      health: 'GET /api/v1/health',
      budget: 'GET /api/v1/budget',
      ingestTelemetry: 'POST /api/v1/telemetry/ingest',
      vehicleTrail: 'GET /api/v1/telemetry/:vehicleId/trail',
      solveOptimization: 'POST /api/v1/optimization/solve',
      optimizationHistory: 'GET /api/v1/optimization/history',
      fleetStatus: 'GET /api/v1/fleet/status',
      registerVehicle: 'POST /api/v1/fleet/register'
    }
  });
});

// API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/budget', budgetRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/optimization', optimizationRoutes);
app.use('/api/v1/fleet', fleetRoutes);

// Fallback 404 Route for API requests
app.use((req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({
      success: false,
      error: `Endpoint '${req.originalUrl}' not found on OptiNexus engine.`
    });
  }
});

// Centralized Error Middleware
app.use(errorHandler);

// Server Bootstrapping Function
const startServer = async () => {
  try {
    console.log('🚀 Bootstrapping OptiNexus Logistics Engine...');
    
    // Initialize SQLite Tables and Defaults
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🌐 OptiNexus Backend Server is live on port ${PORT}`);
      console.log(`📡 Dashboard UI: http://localhost:${PORT}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🤖 Gemini AI Optimization Engine: ACTIVE`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown Handlers
    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down OptiNexus Server...');
      server.close(() => {
        db.close((err) => {
          if (err) console.error('Error closing SQLite DB:', err.message);
          else console.log('📦 SQLite database connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to start OptiNexus server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
