# 🚛 OptiNexus: B2B SaaS Logistics Optimization Engine

An enterprise-grade logistics backend engineered with **Node.js**, **Express**, **SQLite**, and the official **Google Gemini SDK (`@google/genai`)**.

OptiNexus ingests high-frequency operational telemetry from Flutter driver/fleet devices, executes autonomous constraint solving (HOS, axle weights, traffic, SLA time windows), and optimizes route profit margins ($/mile & margin expansion).

---

## ⚡ Architecture Overview

```
optinexus-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # SQLite3 schema initialization & async query handlers
│   │   └── gemini.js            # Official @google/genai SDK client configuration
│   ├── controllers/
│   │   ├── telemetryController.js    # Mobile Flutter telemetry stream ingestion
│   │   ├── optimizationController.js # Gemini constraint solving & margin engine
│   │   └── fleetController.js       # Fleet asset tracking & telemetry summaries
│   ├── routes/
│   │   ├── telemetryRoutes.js   # POST /api/v1/telemetry/ingest, GET /:id/trail
│   │   ├── optimizationRoutes.js# POST /api/v1/optimization/solve, GET /history
│   │   ├── fleetRoutes.js       # GET /api/v1/fleet/status, POST /register
│   │   └── healthRoutes.js      # GET /api/v1/health
│   ├── services/
│   │   ├── geminiOptimizerService.js # Autonomous Gemini reasoning & heuristic fallback
│   │   └── telemetryService.js       # SQLite DAO for fleet telemetry
│   ├── middleware/
│   │   ├── requestLogger.js     # Latency & HTTP request logging
│   │   └── errorHandler.js      # Centralized error handler
│   └── server.js                # Express app bootstrap, CORS, & port 3000 listener
├── data/                        # SQLite storage directory (optinexus.db)
├── .env.example                 # Environment variables specification
├── package.json
└── README.md
```

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
cd optinexus-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and configure your Google Gemini API key:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run Server
```bash
npm start
# Or for auto-reloading dev mode:
npm run dev
```

The backend server runs on `http://localhost:3000`.

---

## 📡 API Endpoints

### 1. Health Check
- **`GET /api/v1/health`**

### 2. Telemetry Ingestion (Flutter App Integration)
- **`POST /api/v1/telemetry/ingest`**
```json
{
  "vehicleId": "VH-101",
  "driverId": "DRV-882",
  "tripId": "TRIP-2024-90",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "speedKmh": 82.5,
  "fuelLevelPct": 78.4,
  "engineTempC": 88.0,
  "payloadKg": 16500,
  "trafficDensity": "MODERATE",
  "status": "ON_ROUTE"
}
```
- **`GET /api/v1/telemetry/:vehicleId/trail?limit=50`**

### 3. Autonomous Gemini Constraint Solving & Margin Optimization
- **`POST /api/v1/optimization/solve`**
```json
{
  "vehicleId": "VH-101",
  "origin": "Dallas Logistics Hub, TX",
  "destination": "Atlanta Freight Terminal, GA",
  "payloadKg": 18200,
  "constraints": {
    "maxContinuousDriveHours": 8,
    "hardSlaDeadline": "2026-08-23T06:00:00Z",
    "avoidTollsIfMarginImpactUnderPct": 5
  },
  "telemetry": {
    "currentFuelLevelPct": 85,
    "speedKmh": 78
  }
}
```
- **`GET /api/v1/optimization/history?limit=20`**

### 4. Fleet Management
- **`GET /api/v1/fleet/status`**
- **`POST /api/v1/fleet/register`**
