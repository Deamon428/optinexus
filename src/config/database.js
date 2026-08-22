import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../data/optinexus.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite Database Connection
export const db = new (sqlite3.verbose()).Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`📦 SQLite database connected at: ${dbPath}`);
  }
});

// Promisified query helper methods
export const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Database Schema Initialization
export const initDatabase = async () => {
  try {
    // 1. Telemetry Ingestion Table (Streamed from Flutter App)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS telemetry_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id TEXT NOT NULL,
        driver_id TEXT,
        trip_id TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        speed_kmh REAL,
        fuel_level_pct REAL,
        engine_temp_c REAL,
        payload_kg REAL,
        traffic_density TEXT,
        status TEXT DEFAULT 'ON_ROUTE',
        raw_metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Route Optimization & Constraint Solving Results
    await dbRun(`
      CREATE TABLE IF NOT EXISTS route_optimizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT UNIQUE NOT NULL,
        vehicle_id TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        constraints_json TEXT,
        optimized_waypoints_json TEXT,
        projected_margin_usd REAL,
        baseline_margin_usd REAL,
        margin_lift_pct REAL,
        estimated_fuel_cost REAL,
        sla_risk_level TEXT,
        gemini_reasoning TEXT,
        status TEXT DEFAULT 'OPTIMIZED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Fleet Assets & Specifications
    await dbRun(`
      CREATE TABLE IF NOT EXISTS fleet_vehicles (
        vehicle_id TEXT PRIMARY KEY,
        driver_name TEXT,
        model TEXT,
        capacity_kg REAL,
        fuel_efficiency_km_per_l REAL,
        cost_per_km_usd REAL,
        current_status TEXT DEFAULT 'ACTIVE',
        last_ping DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed initial fleet sample data if empty
    const vehicleCount = await dbGet('SELECT COUNT(*) as count FROM fleet_vehicles');
    if (vehicleCount.count === 0) {
      await dbRun(`
        INSERT INTO fleet_vehicles (vehicle_id, driver_name, model, capacity_kg, fuel_efficiency_km_per_l, cost_per_km_usd, current_status)
        VALUES 
          ('VH-101', 'Alex Rivera', 'Freightliner Cascadia EV/Diesel', 18000, 3.8, 1.45, 'ACTIVE'),
          ('VH-204', 'Sarah Chen', 'Volvo VNL 860 High-Efficiency', 22000, 4.1, 1.35, 'ACTIVE'),
          ('VH-309', 'Marcus Vance', 'Kenworth T680 Logistics Eco', 15000, 4.4, 1.28, 'ACTIVE')
      `);
      console.log('🌱 Seeded default fleet assets in SQLite.');
    }

    console.log('✅ OptiNexus database schema verified and initialized.');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
  }
};
