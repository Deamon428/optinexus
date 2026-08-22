// Session Fingerprinting for Multi-Tenant Session State
let sessionId = localStorage.getItem('nexus_session_id');
if (!sessionId) {
  sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'session-' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('nexus_session_id', sessionId);
}

// Dynamic UI Route Feasibility Filtering
function initDynamicRouteFiltering() {
  const originSelect = document.querySelector('select[name="origin"]') || document.getElementById('optOrigin');
  const destSelect = document.querySelector('select[name="destination"]') || document.getElementById('optDestination');
  const transportSelect = document.querySelector('select[name="transportUnit"]') || document.getElementById('optVehicle');

  const updateValidDestinations = () => {
    if (!originSelect || !destSelect || !transportSelect) return;

    const origin = originSelect.value.toLowerCase();
    const mode = transportSelect.value;
    const isTruck = mode.includes('TRUCK');

    Array.from(destSelect.options).forEach(option => {
      const dest = option.value.toLowerCase();
      let isAllowed = true;

      // Apply strict terrestrial physics for Trucks
      if (isTruck) {
        const isOriginEU = origin.includes('asml') || origin.includes('munich') || origin.includes('dresden') || origin.includes('germany') || origin.includes('netherlands');
        const isDestEU = dest.includes('asml') || dest.includes('munich') || dest.includes('dresden') || dest.includes('germany') || dest.includes('netherlands');
        
        const isOriginUS = origin.includes('austin') || origin.includes('long beach') || origin.includes('texas') || origin.includes('phoenix') || origin.includes('arizona') || origin.includes('memphis');
        const isDestUS = dest.includes('austin') || dest.includes('long beach') || dest.includes('texas') || dest.includes('phoenix') || dest.includes('arizona') || dest.includes('memphis');

        // Prevent transoceanic trucking
        if (isOriginEU && !isDestEU) isAllowed = false;
        if (isOriginUS && !isDestUS) isAllowed = false;
        
        // Isolate islands and separated continental zones from other regional ground routes
        const isOriginIslandOrAsia = origin.includes('tsmc') || origin.includes('tokyo') || origin.includes('taiwan') || origin.includes('japan') || origin.includes('korea') || origin.includes('samsung') || origin.includes('delhi') || origin.includes('dubai') || origin.includes('shenzhen');
        if (isOriginIslandOrAsia && dest !== origin) isAllowed = false; 
      }

      // Disable and dim invalid options
      option.disabled = !isAllowed;
      option.style.display = isAllowed ? 'block' : 'none'; 
    });

    // Auto-select the first valid destination if the currently selected one just became disabled
    if (destSelect.options[destSelect.selectedIndex] && destSelect.options[destSelect.selectedIndex].disabled) {
      const firstValid = Array.from(destSelect.options).find(opt => !opt.disabled);
      if (firstValid) destSelect.value = firstValid.value;
    }
  };

  if (originSelect && destSelect && transportSelect) {
    originSelect.addEventListener('change', updateValidDestinations);
    transportSelect.addEventListener('change', updateValidDestinations);
    updateValidDestinations();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDynamicRouteFiltering);
} else {
  initDynamicRouteFiltering();
}

/**
 * OPTINEXUS MULTI-PAGE APPLICATION CONTROLLER
 * Handles:
 * 1. NFC Auth Gateway (index.html) -> Fullscreen click trigger + Telemetry Ingest + Redirect to dashboard.html
 * 2. Global Fleet Dashboard (dashboard.html) -> Leaflet Map with 5 Active Routes + Telemetry Feed
 * 3. Gemini AI Solver (solver.html) -> Autonomous Constraint Solving & Margin Lift Engine
 */

// Application Global State
const state = {
  map: null,
  markers: {},
  routeLines: {},
  routes: [
    {
      id: 'FLIGHT-TW-TX',
      name: 'TSMC Fab 18 (TW) ➔ Austin Giga (USA)',
      type: 'flight',
      icon: 'fa-plane',
      markerClass: 'flight',
      origin: { lat: 24.7827, lng: 120.9983, name: 'TSMC Hsinchu (TW)' },
      dest: { lat: 30.2672, lng: -97.7431, name: 'Austin Giga (TX)' },
      progress: 0.42,
      speedKmh: 890,
      fuelPct: 78,
      cryoTemp: -188,
      cargo: '3nm FinFET Wafers',
      valuation: '$38M',
      status: 'ON_CORRIDOR'
    },
    {
      id: 'TRUCK-EU-02',
      name: 'ASML Veldhoven (NL) ➔ Munich Auto (DE)',
      type: 'truck',
      icon: 'fa-truck',
      markerClass: 'truck',
      origin: { lat: 51.4180, lng: 5.4120, name: 'ASML Veldhoven (NL)' },
      dest: { lat: 48.1351, lng: 11.5820, name: 'Munich Auto (DE)' },
      progress: 0.65,
      speedKmh: 84,
      fuelPct: 86,
      cryoTemp: -192,
      cargo: 'High-NA EUV Optics',
      valuation: '$52M',
      status: 'ON_CORRIDOR'
    },
    {
      id: 'VESSEL-PAC-09',
      name: 'Tokyo Port (JP) ➔ Long Beach (USA)',
      type: 'vessel',
      icon: 'fa-ship',
      markerClass: 'vessel',
      origin: { lat: 35.6762, lng: 139.6503, name: 'Tokyo Port (JP)' },
      dest: { lat: 33.7701, lng: -118.1937, name: 'Long Beach (CA)' },
      progress: 0.28,
      speedKmh: 36,
      fuelPct: 92,
      cryoTemp: -184,
      cargo: 'GaN Power Inverters',
      valuation: '$14M',
      status: 'ON_CORRIDOR'
    },
    {
      id: 'FLIGHT-KR-AZ',
      name: 'Samsung Pyeongtaek (KR) ➔ Phoenix (USA)',
      type: 'flight',
      icon: 'fa-plane',
      markerClass: 'flight',
      origin: { lat: 37.0019, lng: 127.0864, name: 'Samsung Pyeongtaek' },
      dest: { lat: 33.2500, lng: -111.8800, name: 'Phoenix MegaFab (AZ)' },
      progress: 0.58,
      speedKmh: 910,
      fuelPct: 74,
      cryoTemp: -186,
      cargo: '5nm Server Dies',
      valuation: '$44M',
      status: 'ON_CORRIDOR'
    },
    {
      id: 'TRUCK-DE-IE',
      name: 'GF Dresden (DE) ➔ Intel Leixlip (IE)',
      type: 'truck',
      icon: 'fa-truck',
      markerClass: 'truck',
      origin: { lat: 51.0504, lng: 13.7373, name: 'GF Dresden (DE)' },
      dest: { lat: 53.3700, lng: -6.5050, name: 'Intel Leixlip (IE)' },
      progress: 0.35,
      speedKmh: 82,
      fuelPct: 80,
      cryoTemp: -190,
      cargo: 'Liquid Nitrogen Tanks',
      valuation: '$8M',
      status: 'ON_CORRIDOR'
    }
  ]
};

// Dispatch execution based on active page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('fullscreenNfcTrigger')) {
    initNfcAuthPage();
  }
  if (document.getElementById('tacticalMap')) {
    initTacticalMap();
    startContinuousKinematicLoop();
  }
  if (document.getElementById('telemetryTableBody')) {
    initDashboardPage();
  }
  if (document.getElementById('optimizerForm')) {
    initSolverPage();
  }
  if (document.getElementById('zuluTimePill')) {
    initZuluClock();
  }
});

/* ==========================================================================
   1. PAGE 1: NFC AUTHENTICATION & REDIRECT LOGIC (index.html)
   ========================================================================== */
function initNfcAuthPage() {
  const triggerBtn = document.getElementById('fullscreenNfcTrigger');
  const progressBox = document.getElementById('authProgressBox');
  const fill = document.getElementById('authProgressFill');
  const statusCode = document.getElementById('authStatusCode');
  const defconBadge = document.getElementById('authDefconBadge');
  const centerIcon = document.getElementById('authCenterIcon');
  const instructionMain = document.getElementById('instructionMain');
  const instructionSub = document.getElementById('instructionSub');
  
  let isAuthenticating = false;

  const executeSingleUseAuth = async (tagId = 'TAG-EUV-3NM-88', vehicleId = 'FLIGHT-TW-TX', cargo = '3nm FinFET Wafers ($38M)') => {
    // 1. Strict guard: Prevent any subsequent executions
    if (isAuthenticating) return;
    isAuthenticating = true;

    // 2. Disable & completely detach invisible overlay trigger immediately
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.style.pointerEvents = 'none';
      triggerBtn.remove(); // Completely detach overlay so it cannot intercept any more clicks
    }

    // 3. Visually swap the screen state to locked Decrypting / Authenticating animation
    if (statusCode) {
      statusCode.innerHTML = `<strong style="color: var(--cyan);"><i class="fa-solid fa-lock"></i> DECRYPTING NFC ASSET BADGE...</strong>`;
    }
    if (defconBadge) {
      defconBadge.textContent = 'DECRYPTING';
      defconBadge.style.borderColor = 'var(--border-cyan)';
      defconBadge.style.color = 'var(--cyan)';
      defconBadge.style.background = 'var(--cyan-subtle)';
    }
    if (centerIcon) {
      centerIcon.innerHTML = `<i class="fa-solid fa-fingerprint" style="color: var(--cyan); font-size: 32px;"></i>`;
    }
    if (instructionMain) {
      instructionMain.innerHTML = `<span style="color: var(--text-main);"><i class="fa-solid fa-circle-notch fa-spin text-cyan"></i> Authenticating Pod #${tagId.replace('TAG-', '')}</span>`;
    }
    if (instructionSub) {
      instructionSub.innerHTML = `Streaming encrypted telemetry to /api/v1/telemetry/ingest...`;
    }

    if (progressBox) progressBox.style.display = 'flex';
    if (fill) {
      fill.style.width = '0%';
      setTimeout(() => { fill.style.width = '100%'; }, 50);
    }

    // 4. Dispatch simulated ingestion telemetry to backend API
    try {
      await fetch('/api/v1/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicleId,
          driverId: tagId,
          latitude: 24.7827,
          longitude: 120.9983,
          speedKmh: 885,
          fuelLevelPct: 88,
          payloadKg: 14500,
          status: 'NFC_VERIFIED',
          metadata: { cargo, scannedAt: new Date().toISOString() }
        })
      });
    } catch (e) {
      console.warn('Telemetry broadcast notice:', e);
    }

    // 5. Instantly redirect to dashboard.html after visual confirmation
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 700);
  };

  // Attach single-use event listener
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      executeSingleUseAuth();
    }, { once: true }); // Strictly fires once
  }

  // Native Web NFC Hardware Reader Support (if available)
  if ('NDEFReader' in window) {
    try {
      const ndef = new window.NDEFReader();
      ndef.scan().then(() => {
        ndef.addEventListener('reading', ({ serialNumber }) => {
          executeSingleUseAuth(serialNumber || 'NFC-HW-WAFER-POD', 'FLIGHT-TW-TX', 'Physical NFC Wafer Pod');
        }, { once: true });
      }).catch(err => console.log('Web NFC passive wait:', err));
    } catch (e) {
      console.log('NDEFReader init:', e);
    }
  }
}

/* ==========================================================================
   2. PAGE 2: GLOBAL FLEET DASHBOARD LOGIC (dashboard.html)
   ========================================================================== */
function initDashboardPage() {
  renderRoutesTable();

  // Simulate Telemetry Ping Button
  const pingBtn = document.getElementById('simulatePingBtn');
  if (pingBtn) {
    pingBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/v1/telemetry/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: 'FLIGHT-TW-TX',
            latitude: 28.5 + (Math.random() - 0.5),
            longitude: 140.0 + (Math.random() - 0.5),
            speedKmh: 890 + Math.round((Math.random() - 0.5) * 20),
            fuelLevelPct: 84,
            payloadKg: 14500,
            status: 'STREAM_VERIFIED'
          })
        });
        showToast('Telemetry Ping Streamed to /api/v1/telemetry/ingest', 'success');
      } catch (err) {
        showToast('Stream packet dispatched', 'info');
      }
    });
  }

  // Reset Map View
  const fitBtn = document.getElementById('fitMapBtn');
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      state.map.setView([32.0, 10.0], 2);
    });
  }
}

function initTacticalMap() {
  state.map = L.map('tacticalMap', {
    zoomControl: false,
    attributionControl: false,
    minZoom: 2,
    maxZoom: 9
  }).setView([32.0, 10.0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd'
  }).addTo(state.map);

  L.control.zoom({ position: 'topright' }).addTo(state.map);

  // Plot glowing route lines & markers
  state.routes.forEach(route => {
    const polyCoords = [
      [route.origin.lat, route.origin.lng],
      [route.dest.lat, route.dest.lng]
    ];

    L.polyline(polyCoords, {
      color: route.type === 'flight' ? '#c084fc' : '#00f0ff',
      weight: 2.8,
      opacity: 0.95,
      dashArray: '6, 6'
    }).addTo(state.map);

    updateMarkerPosition(route);
  });

  // Attach reset view button if present
  const fitBtn = document.getElementById('fitMapBtn');
  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      state.map.setView([32.0, 10.0], 2);
      showToast('Map View Recalibrated', 'info');
    });
  }
}

function updateMarkerPosition(route) {
  const curLat = route.origin.lat + (route.dest.lat - route.origin.lat) * route.progress;
  const curLng = route.origin.lng + (route.dest.lng - route.origin.lng) * route.progress;

  if (!state.markers[route.id]) {
    const modeClass = route.type === 'vessel' ? 'vessel' : route.type === 'truck' ? 'truck' : 'flight';

    const iconHtml = `
      <div class="spatial-map-node ${modeClass}">
        <div class="node-pulse-ring"></div>
        <div class="node-callsign-pill">${route.id}</div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-spatial-pin',
      html: iconHtml,
      iconSize: [110, 24],
      iconAnchor: [6, 12]
    });

    const marker = L.marker([curLat, curLng], { icon: customIcon }).addTo(state.map);
    
    marker.bindPopup(`
      <div class="spatial-hud-popup">
        <div class="popup-head">
          <span class="text-cyan">${route.id}</span>
          <span style="font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600;">${route.type.toUpperCase()}</span>
        </div>
        <div class="popup-row"><span>Vector:</span> <strong>${route.name}</strong></div>
        <div class="popup-row"><span>Velocity:</span> <strong class="text-cyan">${Math.round(route.speedKmh)} km/h</strong></div>
        <div class="popup-row"><span>Cryo Temp:</span> <strong style="color: var(--rose);">${route.cryoTemp}°C</strong></div>
        <div class="popup-row"><span>Cargo Val:</span> <strong class="text-white">${route.valuation}</strong></div>
      </div>
    `);

    state.markers[route.id] = marker;
  } else {
    state.markers[route.id].setLatLng([curLat, curLng]);
  }
}

function renderRoutesTable() {
  const tbody = document.getElementById('telemetryTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.routes.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid ${r.icon} text-cyan"></i>
          <strong style="color: #ffffff;">${r.id}</strong>
        </div>
      </td>
      <td><span style="color: rgba(255,255,255,0.85);">${r.name}</span></td>
      <td><span class="text-dim-metric">${Math.round(r.speedKmh)} km/h</span></td>
      <td><span class="text-dim-metric">${r.fuelPct}%</span></td>
      <td><span class="pill pill-cyan">${r.cryoTemp}°C</span></td>
      <td><span style="color: rgba(255,255,255,0.65);">${r.cargo}</span></td>
      <td><strong style="color: #ffffff;">${r.valuation}</strong></td>
      <td><span class="pill pill-emerald">ON_CORRIDOR</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function startContinuousKinematicLoop() {
  setInterval(() => {
    state.routes.forEach(r => {
      const step = r.type === 'flight' ? 0.004 : r.type === 'truck' ? 0.002 : 0.0008;
      r.progress = (r.progress + step) % 1.0;
      r.speedKmh = Math.max(30, r.speedKmh + (Math.random() - 0.5) * 3);
      if (state.map) updateMarkerPosition(r);
    });
    renderRoutesTable();
  }, 1800);
}

/* ==========================================================================
   3. PAGE 3: GEMINI AI OPTIMIZER LOGIC (solver.html)
   ========================================================================== */
async function fetchBudgetStatus() {
  try {
    const res = await fetch('/api/v1/budget');
    const json = await res.json();
    if (json.success && json.data) {
      renderBudgetWidget(json.data);
    }
  } catch (e) {
    console.warn('Failed to load budget metrics:', e);
  }
}

function renderBudgetWidget(budget) {
  const {
    maxMonthlyBudget = 1500,
    currentUsage = 412,
    utilizationPct = 27.5,
    remainingBudget = 1088,
    status = 'ACTIVE_UNDER_BUDGET'
  } = budget;

  const currentEl = document.getElementById('budgetCurrentVal');
  const maxEl = document.getElementById('budgetMaxVal');
  const pctEl = document.getElementById('budgetPctPill');
  const fillEl = document.getElementById('budgetFillBar');
  const remainingEl = document.getElementById('budgetRemainingText');
  const statusTextEl = document.getElementById('budgetStatusText');

  if (currentEl) currentEl.textContent = `$${currentUsage.toFixed(2)}`;
  if (maxEl) maxEl.textContent = `$${maxMonthlyBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  if (pctEl) pctEl.textContent = `${utilizationPct.toFixed(1)}%`;
  if (remainingEl) remainingEl.textContent = `Remaining: $${remainingBudget.toFixed(2)}`;
  
  if (fillEl) {
    fillEl.style.width = `${Math.min(100, utilizationPct)}%`;
    if (utilizationPct >= 90) {
      fillEl.classList.add('danger');
    } else {
      fillEl.classList.remove('danger');
    }
  }

  if (statusTextEl) {
    if (status === 'BUDGET_EXCEEDED' || currentUsage >= maxMonthlyBudget) {
      statusTextEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ff3366;"></i> <strong style="color: #ff3366;">CRITICAL: BUDGET EXCEEDED ($1,500 CAP REACHED)</strong>`;
    } else {
      statusTextEl.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i> Guard Active • 402 Intercept Threshold: $${maxMonthlyBudget.toLocaleString()}.00`;
    }
  }
}

function initSolverPage() {
  fetchBudgetStatus();
  restoreSessionState();

  const runBtn = document.getElementById('btn-run-ai-solver');
  const form = document.getElementById('optimizerForm');

  if (runBtn) {
    runBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await executeAutonomousSolverBridge();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await executeAutonomousSolverBridge();
    });
  }
}

async function restoreSessionState() {
  try {
    const res = await fetch('/api/v1/optimization/session', {
      headers: { 'X-Session-ID': sessionId }
    });
    const json = await res.json();
    if (json && json.success && json.result) {
      renderSolverOutputDOM(json);
    }
  } catch (e) {}
}

async function executeAutonomousSolverBridge() {
  const runBtn = document.getElementById('btn-run-ai-solver');
  const btnText = runBtn?.querySelector('.btn-text');
  const btnLoading = runBtn?.querySelector('.btn-loading');

  if (btnText) btnText.style.display = 'none';
  if (btnLoading) btnLoading.style.display = 'inline-flex';
  if (runBtn) runBtn.disabled = true;

  // 1. Capture ALL inputs explicitly
  const origin = document.getElementById('optOrigin')?.value || 'TSMC Fab 18 (Hsinchu, Taiwan)';
  const destination = document.getElementById('optDestination')?.value || 'Austin Giga Assembly (Texas, USA)';
  const vehicleId = document.getElementById('optVehicle')?.value || 'FLIGHT-TW-TX';
  const payloadKg = parseFloat(document.getElementById('optPayload')?.value) || 14500;
  const maxHos = parseFloat(document.getElementById('optHosLimit')?.value) || 8;
  const avoidTolls = document.getElementById('optTolls')?.checked ?? true;
  const strictSla = document.getElementById('optSla')?.checked ?? true;

  // Target output elements by new IDs
  const outMarginLift = document.getElementById('out-margin-lift');
  const outOptimizedCost = document.getElementById('out-optimized-cost');
  const outSlaRisk = document.getElementById('out-sla-risk');
  const outSynthesisText = document.getElementById('out-synthesis-text');
  const outProjMargin = document.getElementById('out-projected-margin');
  const outBaselineCost = document.getElementById('out-baseline-cost');
  const outWaypointsContainer = document.getElementById('out-waypoints-container');
  const outJobId = document.getElementById('out-job-id');

  if (outSynthesisText) {
    outSynthesisText.innerHTML = '<span style="color: var(--cyan);"><i class="fa-solid fa-spinner fa-spin"></i> Synthesizing autonomous corridor constraints via Google Gemini 3.6 Flash...</span>';
  }

  try {
    const payload = {
      vehicleId,
      origin,
      destination,
      payloadKg,
      maxHOS: maxHos,
      constraints: {
        maxHOS: maxHos,
        maxContinuousDriveHours: maxHos,
        avoidTolls,
        strictSla
      },
      telemetry: { speedKmh: 88, fuelLevelPct: 85 }
    };

    const res = await fetch('/api/v1/optimization/solve', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId 
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => null);

    // If HTTP error (e.g. 400 Impossible Route or 500 API failure) or !json.success
    if (!res.ok || !json || !json.success) {
      const errorMsg = json?.error || `HTTP ${res.status}: Optimization Engine Failed`;
      
      if (outMarginLift) {
        outMarginLift.innerText = '0.0%';
        outMarginLift.className = 'result-margin-val text-rose';
      }
      if (outOptimizedCost) outOptimizedCost.innerText = '$0.00';
      if (outProjMargin) outProjMargin.innerText = '$0.00';
      if (outBaselineCost) outBaselineCost.innerText = '$0.00';
      if (outSlaRisk) {
        outSlaRisk.innerText = 'CRITICAL ERROR';
        outSlaRisk.style.color = '#f43f5e';
      }
      if (outJobId) outJobId.innerText = 'JOB: FAILED';
      if (outWaypointsContainer) {
        outWaypointsContainer.innerHTML = `
          <div class="timeline-step">
            <div class="step-title" style="color: #f43f5e;">Execution Aborted</div>
            <div class="step-desc" style="color: #f43f5e;">${errorMsg}</div>
          </div>
        `;
      }

      // Explicit red error inside "Optimization Synthesis" box
      if (outSynthesisText) {
        outSynthesisText.innerHTML = `<strong style="color: #f43f5e;"><i class="fa-solid fa-circle-exclamation"></i> OPTIMIZATION SYNTHESIS FAILED (${res.status}):</strong><br><span style="color: #f43f5e; font-weight: 500;">${errorMsg}</span>`;
      }

      showToast(`Optimization Failed: ${errorMsg}`, 'crit');
      await fetchBudgetStatus();
      return;
    }

    // Render success output to DOM
    renderSolverOutputDOM(json);

    const marginExp = json.marginExpansion || (json.result?.financials?.marginLiftPct !== undefined ? `${json.result.financials.marginLiftPct > 0 ? '+' : ''}${json.result.financials.marginLiftPct.toFixed(1)}%` : '--%');
    showToast(`Gemini Optimization Complete: ${marginExp} Net Margin Expansion!`, 'success');
    await fetchBudgetStatus();
  } catch (err) {
    if (outMarginLift) {
      outMarginLift.innerText = '0.0%';
      outMarginLift.className = 'result-margin-val text-rose';
    }
    if (outSynthesisText) {
      outSynthesisText.innerHTML = `<strong style="color: #f43f5e;"><i class="fa-solid fa-circle-exclamation"></i> NETWORK ERROR:</strong><br><span style="color: #f43f5e;">${err.message}</span>`;
    }
    showToast(`Optimization failed: ${err.message}`, 'crit');
  } finally {
    if (btnText) btnText.style.display = 'inline-flex';
    if (btnLoading) btnLoading.style.display = 'none';
    if (runBtn) runBtn.disabled = false;
  }
}

function renderSolverOutputDOM(json) {
  const { financials = {}, slaRiskLevel = 'LOW', reasoning = '', optimizedWaypoints = [] } = json.result || json;

  const outMarginLift = document.getElementById('out-margin-lift');
  const outOptimizedCost = document.getElementById('out-optimized-cost');
  const outSlaRisk = document.getElementById('out-sla-risk');
  const outSynthesisText = document.getElementById('out-synthesis-text');
  const outProjMargin = document.getElementById('out-projected-margin');
  const outBaselineCost = document.getElementById('out-baseline-cost');
  const outWaypointsContainer = document.getElementById('out-waypoints-container');
  const outJobId = document.getElementById('out-job-id');

  const marginExp = json.marginExpansion || (financials.marginLiftPct !== undefined ? `${financials.marginLiftPct > 0 ? '+' : ''}${financials.marginLiftPct.toFixed(1)}%` : '--%');
  
  if (outMarginLift) {
    outMarginLift.innerText = marginExp;
    outMarginLift.className = 'result-margin-val text-cyan';
  }

  if (outOptimizedCost) {
    outOptimizedCost.innerText = `$${Number(financials.optimizedCostUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  if (outProjMargin) {
    outProjMargin.innerText = `$${Number(financials.projectedMarginUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  if (outBaselineCost) {
    outBaselineCost.innerText = `$${Number(financials.baselineCostUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  if (outSlaRisk) {
    outSlaRisk.innerText = `${slaRiskLevel} (On-Time)`;
    outSlaRisk.style.color = 'var(--cyan)';
  }

  if (outJobId) {
    outJobId.innerText = `JOB: ${json.jobId || 'OPT-CONFIRMED'}`;
  }

  if (outSynthesisText) {
    outSynthesisText.innerText = reasoning || 'Autonomous route solution synthesized by Google Gemini 3.6 Flash.';
  }

  if (outWaypointsContainer) {
    outWaypointsContainer.innerHTML = '';
    if (optimizedWaypoints && optimizedWaypoints.length > 0) {
      optimizedWaypoints.forEach(wp => {
        const step = document.createElement('div');
        step.className = 'timeline-step';
        step.innerHTML = `
          <div class="step-title">${wp.waypoint}</div>
          <div class="step-desc">ETA: +${wp.etaMinutes}m • ${wp.action} • Fuel: ~${wp.fuelEstimatedLiters || 0}L</div>
        `;
        outWaypointsContainer.appendChild(step);
      });
    }
  }
}

/* ==========================================================================
   4. UTILITIES (Zulu Clock, Toast)
   ========================================================================== */
function initZuluClock() {
  const clockEl = document.getElementById('zuluTimePill');
  if (!clockEl) return;
  setInterval(() => {
    const now = new Date();
    clockEl.textContent = now.toUTCString().split(' ')[4] + ' UTC';
  }, 1000);
}

function showToast(msg, type = 'info') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast-msg ${type}`;

  const icon = type === 'success' ? 'fa-circle-check text-emerald' : 'fa-circle-info text-cyan';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;

  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
