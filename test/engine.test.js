import test from 'node:test';
import assert from 'node:assert/strict';
import { TelemetryService } from '../src/services/telemetryService.js';
import { GeminiOptimizerService } from '../src/services/geminiOptimizerService.js';
import { BudgetService, MAX_MONTHLY_BUDGET } from '../src/services/budgetService.js';
import { enforceApiBudget } from '../src/middleware/budgetCheck.js';
import { initDatabase, dbGet } from '../src/config/database.js';

test('OptiNexus Engine Core Initialization and Ingestion Test', async (t) => {
  await t.test('1. Initialize SQLite database schema and fleet seeds', async () => {
    await initDatabase();
    const count = await dbGet('SELECT COUNT(*) as c FROM fleet_vehicles');
    assert.ok(count.c >= 3, 'Fleet vehicles should be seeded');
  });

  await t.test('2. Ingest operational Flutter telemetry packet', async () => {
    const payload = {
      vehicleId: 'VH-101',
      driverId: 'DRV-901',
      tripId: 'TRIP-TX-88',
      latitude: 32.7767,
      longitude: -96.7970,
      speedKmh: 84.2,
      fuelLevelPct: 88.5,
      engineTempC: 89.0,
      payloadKg: 15400,
      trafficDensity: 'LOW',
      status: 'ON_ROUTE'
    };

    const record = await TelemetryService.recordTelemetry(payload);
    assert.ok(record.id, 'Telemetry record must have an ID');
    assert.equal(record.vehicleId, 'VH-101');

    const history = await TelemetryService.getRecentTelemetry('VH-101', 5);
    assert.ok(history.length > 0, 'Should return recent telemetry history');
  });

  await t.test('3. Execute autonomous constraint solving & real error throwing', async () => {
    const job = {
      vehicleId: 'VH-101',
      origin: 'Dallas Logistics Hub, TX',
      destination: 'Atlanta Freight Terminal, GA',
      payloadKg: 15400,
      constraints: {
        maxContinuousDriveHours: 8,
        hardSlaDeadline: '2026-08-23T12:00:00Z'
      }
    };

    try {
      const result = await GeminiOptimizerService.optimizeRoute(job);
      assert.ok(result.financials, 'Optimization result should contain financials');
      assert.ok(result.financials.projectedMarginUsd > 0, 'Projected margin must be positive');
    } catch (err) {
      assert.ok(err.message.includes('Gemini AI Solver Error'), 'Must throw real Gemini AI error without silent fallback mock');
      assert.equal(err.statusCode, 400, 'Must have statusCode 400');
    }
  });

  await t.test('4. Enforce strict $1500 monthly API budget constraint', async () => {
    // Reset to initial baseline
    BudgetService.resetUsage();
    const initialBudget = BudgetService.getBudgetStatus();
    assert.equal(initialBudget.maxMonthlyBudget, 1500, 'Max budget must be 1500');
    assert.equal(initialBudget.currentUsage, 412.00, 'Baseline usage should be 412.00');
    assert.equal(initialBudget.status, 'ACTIVE_UNDER_BUDGET');
    assert.equal(initialBudget.isSolverEnabled, true);

    // Test middleware passes when under budget
    let passedNext = false;
    const mockReq = {};
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };
    const mockNext = () => { passedNext = true; };

    enforceApiBudget(mockReq, mockRes, mockNext);
    assert.equal(passedNext, true, 'Under-budget requests must proceed to solver');

    // Test middleware intercept when budget exceeds 1500
    BudgetService.setUsage(1500.00);
    const exceededBudget = BudgetService.getBudgetStatus();
    assert.equal(exceededBudget.status, 'BUDGET_EXCEEDED');
    assert.equal(exceededBudget.isSolverEnabled, false);

    let failedNext = false;
    const failNext = () => { failedNext = true; };
    enforceApiBudget(mockReq, mockRes, failNext);

    assert.equal(failedNext, false, 'Over-budget request must NOT call next()');
    assert.equal(mockRes.statusCode, 402, 'Must return 402 Payment Required');
    assert.equal(
      mockRes.body.error,
      'CRITICAL: Max monthly API budget (1500) exceeded. Solver disabled.',
      'Must return exact error message'
    );

    // Reset back for normal operation
    BudgetService.resetUsage();
  });

  await t.test('5. Verify strict error boundary enforcement on live solver failure', async () => {
    const flightJob = {
      vehicleId: 'FLIGHT-TW-TX',
      origin: 'TSMC Fab 18, Taiwan',
      destination: 'Austin Giga Assembly, TX',
      payloadKg: 14500,
      maxHOS: 3,
      constraints: { maxContinuousDriveHours: 3 }
    };

    try {
      const flightResult = await GeminiOptimizerService.optimizeRoute(flightJob);
      assert.ok(flightResult.financials.marginLiftPct <= 12.0, 'Flight margin must be <= 12.0%');
    } catch (err) {
      assert.ok(err.message.includes('Gemini AI Solver Error'), 'Must throw real error when live API fails');
      assert.equal(err.statusCode, 400, 'Must have statusCode 400');
    }
  });

  await t.test('6. Return critical routing error for impossible transoceanic truck routes', async () => {
    const impossibleTruckJob = {
      vehicleId: 'TRUCK-EU-02',
      origin: 'TSMC Fab 18 (Hsinchu, Taiwan)',
      destination: 'Austin Giga Assembly (Texas, USA)',
      payloadKg: 14500,
      maxHOS: 8,
      constraints: { maxContinuousDriveHours: 8 }
    };

    await assert.rejects(
      async () => {
        await GeminiOptimizerService.optimizeRoute(impossibleTruckJob);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('Impossible transoceanic route') || err.message.includes('ocean'));
        return true;
      },
      'Impossible transoceanic truck route must throw HTTP 400 error'
    );
  });
});
