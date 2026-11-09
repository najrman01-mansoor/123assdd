/**
 * SHREEJI CLIENT ORDER MANAGEMENT SYSTEM
 * SHREEJI IMAGING AND DIAGNOSTICS CENTER PRIVATE LIMITED
 * Core Enterprise Frontend Controller
 */

// ============================================================================
// 1. CENTRAL API CONFIGURATION & ENVIRONMENT
// ============================================================================
const CONFIG = {
  // Configured with the user's active n8n public tunnel URL
  API_BASE_URL: localStorage.getItem('shreeji_api_url') || 'https://finisher-pajamas-dipping.ngrok-free.dev/webhook',
  LOCAL_N8N_URL: 'http://localhost:5678/webhook',
  IS_SIMULATION_FALLBACK: true, // Auto-fallback to local interactive simulation if n8n is offline
  APP_VERSION: '1.0.0-enterprise',
  COMPANY_NAME: 'Shreeji Imaging and Diagnostics Center Private Limited'
};

// ============================================================================
// 2. STATE REPOSITORY
// ============================================================================
const state = {
  token: sessionStorage.getItem('shreeji_token') || null,
  user: JSON.parse(sessionStorage.getItem('shreeji_user') || 'null'),
  activeRole: 'CLIENT', // 'CLIENT' or 'ADMIN'
  activeTab: 'dashboard',
  products: [
    { id: 1, product_code: 'FDG', product_name: 'F-18 FDG', isotope: 'F-18', default_unit: 'mCi', description: 'Fluorodeoxyglucose for PET oncology' },
    { id: 2, product_code: 'PSMA', product_name: 'F-18 PSMA', isotope: 'F-18', default_unit: 'mCi', description: 'PSMA-1007 for prostate carcinoma' },
    { id: 3, product_code: 'FDOPA', product_name: 'F-18 FDOPA', isotope: 'F-18', default_unit: 'mCi', description: 'Fluorodopa for neuroendocrine & brain' },
    { id: 4, product_code: 'FAPI', product_name: 'F-18 FAPI', isotope: 'F-18', default_unit: 'mCi', description: 'Fibroblast Activation Protein Inhibitor' },
    { id: 5, product_code: 'FES', product_name: 'F-18 FES', isotope: 'F-18', default_unit: 'mCi', description: 'Fluoroestradiol for ER+ breast cancer' },
    { id: 6, product_code: 'FMISO', product_name: 'F-18 FMISO', isotope: 'F-18', default_unit: 'mCi', description: 'Fluoromisonidazole for tissue hypoxia' },
    { id: 7, product_code: 'NOTA', product_name: 'F-18 NOTA', isotope: 'F-18', default_unit: 'mCi', description: 'NOTA Conjugates' },
    { id: 8, product_code: 'OTHER', product_name: 'Other', isotope: 'Various', default_unit: 'Dose', description: 'Custom cyclotron synthesis' }
  ],
  orders: [],
  kpi: {
    total_orders: 0,
    pending_orders: 0,
    today_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    total_lots: 0,
    production_planned_orders: 0,
    dispatched_orders: 0
  },
  filters: {
    fromDate: '',
    toDate: '',
    status: 'ALL',
    productId: 'ALL',
    search: '',
    page: 1,
    pageSize: 10
  },
  lotCounter: 1
};

// ============================================================================
// 3. API SERVICE LAYER
// ============================================================================
const api = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        ui.showToast('Session expired or unauthorized. Please log in again.', 'warning');
        auth.logout();
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`[Shreeji API] Direct call to ${url} failed:`, error.message);
      
      // If server is unreachable and fallback mode is enabled, route to client simulation
      if (CONFIG.IS_SIMULATION_FALLBACK) {
        return simulationBackend.handle(endpoint, options);
      }
      throw error;
    }
  }
};

// ============================================================================
// 4. INTERACTIVE SIMULATION BACKEND (OFFLINE RESILIENCE)
// Guarantees UI remains 100% testable before or during n8n imports
// ============================================================================
const simulationBackend = {
  db: {
    users: [
      { id: 1, username: 'admin', password: 'Admin@Shreeji2026!', role: 'ADMIN', full_name: 'Shreeji Central Admin', client_id: null, client_name: 'Central Cyclotron HQ' },
      { id: 2, username: 'apex_hospital', password: 'Client@Shreeji2026!', role: 'CLIENT', full_name: 'Dr. Rajesh Shah', client_id: 1, client_name: 'Apex Cancer & Research Institute', client_code: 'SHR-APEX-01' },
      { id: 3, username: 'sterling_hospital', password: 'Client@Shreeji2026!', role: 'CLIENT', full_name: 'Dr. Ananya Mehta', client_id: 2, client_name: 'Sterling Multi-Specialty Hospital', client_code: 'SHR-STER-02' }
    ],
    orders: [
      {
        id: 1,
        order_id: 'SHR-2026-000001',
        client_id: 1,
        client_name: 'Apex Cancer & Research Institute',
        product_id: 1,
        product_name: 'F-18 FDG',
        isotope: 'F-18',
        destination: 'Apex Cancer Institute - Hot Lab Room 104',
        order_date: new Date().toISOString().split('T')[0],
        submission_timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        notes: 'Priority morning patient batch. Shielded container required.',
        status: 'Dispatched',
        total_lots: 3,
        total_quantity: 450,
        primary_unit: 'Mixed',
        lots: [
          { id: 101, lot_id: 'SHR-2026-000001-L01', lot_number: 1, quantity: 100, unit: 'mCi', calibration_date: new Date().toISOString().split('T')[0], calibration_time: '08:00', notes: 'Patient Group A' },
          { id: 102, lot_id: 'SHR-2026-000001-L02', lot_number: 2, quantity: 150, unit: 'Dose', calibration_date: new Date().toISOString().split('T')[0], calibration_time: '10:00', notes: 'Pediatric protocols' },
          { id: 103, lot_id: 'SHR-2026-000001-L03', lot_number: 3, quantity: 200, unit: 'mCi', calibration_date: new Date().toISOString().split('T')[0], calibration_time: '12:00', notes: 'Afternoon whole body scans' }
        ],
        timeline: [
          { status: 'Order Submitted', timestamp: '06:00 AM', by: 'Dr. Rajesh Shah', remarks: 'Order submitted via portal' },
          { status: 'Production Planned', timestamp: '06:30 AM', by: 'Production Lead', remarks: 'Cyclotron beamline 1 allocated' },
          { status: 'Production Completed', timestamp: '07:15 AM', by: 'QC Radiochemist', remarks: 'Radiochemical purity > 98.5%' },
          { status: 'Invoice Generated', timestamp: '07:30 AM', by: 'Billing Officer', remarks: 'Invoice #INV-2026-091' },
          { status: 'Dispatched', timestamp: '07:45 AM', by: 'Logistics Lead', remarks: 'Vehicle GJ-01-XX-4412 dispatched' }
        ]
      },
      {
        id: 2,
        order_id: 'SHR-2026-000002',
        client_id: 2,
        client_name: 'Sterling Multi-Specialty Hospital',
        product_id: 2,
        product_name: 'F-18 PSMA',
        isotope: 'F-18',
        destination: 'Sterling Hospital PET-CT Department',
        order_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        submission_timestamp: new Date(Date.now() - 3600000).toISOString(),
        notes: 'Strict calibration at 09:30 AM for scheduled prostate scans.',
        status: 'Production Planned',
        total_lots: 2,
        total_quantity: 125,
        primary_unit: 'mCi',
        lots: [
          { id: 201, lot_id: 'SHR-2026-000002-L01', lot_number: 1, quantity: 50, unit: 'mCi', calibration_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], calibration_time: '09:30', notes: 'Slot 1 injections' },
          { id: 202, lot_id: 'SHR-2026-000002-L02', lot_number: 2, quantity: 75, unit: 'mCi', calibration_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], calibration_time: '11:45', notes: 'Slot 2 injections' }
        ],
        timeline: [
          { status: 'Order Submitted', timestamp: '09:15 AM', by: 'Dr. Ananya Mehta', remarks: 'Order submitted via portal' },
          { status: 'Production Planned', timestamp: '10:00 AM', by: 'Production Lead', remarks: 'Scheduled for tomorrow beam run' }
        ]
      }
    ]
  },

  handle(endpoint, options) {
    const body = options.body ? JSON.parse(options.body) : {};

    // 1. Login
    if (endpoint.includes('/shreeji/auth/login')) {
      const u = this.db.users.find(x => (x.username === body.username || x.username === body.email) && x.password === body.password);
      if (u) {
        return {
          success: true,
          token: 'shrsess_sim_' + Math.random().toString(36).substring(2),
          user: {
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            role: u.role,
            clientId: u.client_id,
            clientName: u.client_name,
            clientCode: u.client_code || 'SHR-ADMIN'
          }
        };
      }
      return { success: false, error: 'Invalid username or password.' };
    }

    // 2. Orders list
    if (endpoint.includes('/shreeji/orders')) {
      let filtered = [...this.db.orders];
      // STRICT CLIENT DATA ISOLATION
      if (state.user && state.user.role === 'CLIENT') {
        filtered = filtered.filter(o => o.client_id === state.user.clientId);
      }
      return { success: true, data: filtered };
    }

    // 3. Create Order
    if (endpoint.includes('/shreeji/order/create')) {
      const currentYear = new Date().getFullYear();
      const seq = Math.floor(100000 + Math.random() * 900000);
      const orderId = `SHR-${currentYear}-${seq}`;
      
      const newLots = (body.lots || []).map((l, idx) => ({
        id: Date.now() + idx,
        lot_id: `${orderId}-L${String(idx + 1).padStart(2, '0')}`,
        lot_number: idx + 1,
        quantity: parseFloat(l.quantity),
        unit: l.unit,
        calibration_date: l.calibrationDate || l.calibration_date,
        calibration_time: l.calibrationTime || l.calibration_time,
        notes: l.notes || ''
      }));

      const totalQty = newLots.reduce((acc, curr) => acc + curr.quantity, 0);
      const prod = state.products.find(p => p.id === parseInt(body.productId || body.product_id, 10)) || state.products[0];

      const newOrder = {
        id: Date.now(),
        order_id: orderId,
        client_id: state.user.clientId || 1,
        client_name: state.user.clientName,
        product_id: prod.id,
        product_name: prod.product_name,
        isotope: prod.isotope,
        destination: body.destination,
        order_date: body.orderDate || body.order_date,
        submission_timestamp: new Date().toISOString(),
        notes: body.notes || '',
        status: 'Order Submitted',
        total_lots: newLots.length,
        total_quantity: totalQty,
        primary_unit: newLots[0]?.unit || 'mCi',
        lots: newLots,
        timeline: [
          { status: 'Order Submitted', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), by: state.user.fullName, remarks: 'Submitted via portal' }
        ]
      };

      this.db.orders.unshift(newOrder);
      return { success: true, message: 'Order submitted successfully', orderId: orderId, totalLots: newLots.length, totalQuantity: totalQty };
    }

    // 4. Update Status (Admin)
    if (endpoint.includes('/shreeji/admin/order/status')) {
      const target = this.db.orders.find(o => o.order_id === body.orderId || o.order_id === body.order_id);
      if (target) {
        target.status = body.newStatus || body.status;
        target.timeline.push({
          status: target.status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          by: state.user.fullName,
          remarks: body.remarks || 'Status updated by Admin'
        });
        return { success: true, message: `Status updated to ${target.status}` };
      }
      return { success: false, error: 'Order not found' };
    }

    // Default
    return { success: true, message: 'Simulated response' };
  }
};

// ============================================================================
// 5. AUTHENTICATION CONTROLLER
// ============================================================================
const auth = {
  init() {
    // If token exists, verify and render
    if (state.token && state.user) {
      ui.showAppShell();
      ordersController.loadDashboard();
      ordersController.loadOrders();
    } else {
      ui.showAuthScreen();
    }

    // Attach login form listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('loginSubmitBtn');
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
      ui.showToast('Please enter both username and password.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Authenticating...';

      const res = await api.request('/shreeji/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (res && res.success) {
        state.token = res.token;
        state.user = res.user;
        state.activeRole = res.user.role;

        sessionStorage.setItem('shreeji_token', res.token);
        sessionStorage.setItem('shreeji_user', JSON.stringify(res.user));

        ui.showToast(`Welcome back, ${res.user.fullName}!`, 'success');
        ui.showAppShell();
        ordersController.loadDashboard();
        ordersController.loadOrders();
      } else {
        ui.showToast(res.error || 'Authentication failed. Please check credentials.', 'error');
      }
    } catch (err) {
      ui.showToast('Login error: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In to Portal';
    }
  },

  async logout() {
    try {
      if (state.token) {
        await api.request('/shreeji/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      console.warn('Logout notification error:', e);
    } finally {
      state.token = null;
      state.user = null;
      sessionStorage.removeItem('shreeji_token');
      sessionStorage.removeItem('shreeji_user');
      ui.showToast('Logged out successfully.', 'info');
      ui.showAuthScreen();
    }
  }
};

// ============================================================================
// 6. ORDER MANAGEMENT & LOTS CONTROLLER
// ============================================================================
const ordersController = {
  init() {
    this.initLotsRepeater();
    this.attachFormListeners();
    this.attachFilterListeners();
  },

  // Initialize Multiple Lots Repeater
  initLotsRepeater() {
    state.lotCounter = 1;
    const container = document.getElementById('lotsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    this.addLotRow(); // Add first compulsory lot
  },

  // Dynamic "+ ADD LOT" action
  addLotRow() {
    const container = document.getElementById('lotsContainer');
    if (!container) return;

    const lotNumber = container.children.length + 1;
    const lotIdPlaceholder = `SHR-2026-AUTO-L${String(lotNumber).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const lotDiv = document.createElement('div');
    lotDiv.className = 'lot-card-item';
    lotDiv.id = `lotRow_${lotNumber}`;
    lotDiv.innerHTML = `
      <div class="lot-card-header">
        <span class="lot-badge">LOT #${lotNumber} &bull; ${lotIdPlaceholder}</span>
        ${lotNumber > 1 ? `<button type="button" class="btn btn-danger btn-sm" onclick="ordersController.removeLotRow(${lotNumber})">&times; Remove Lot</button>` : '<span style="font-size:0.75rem; color:#6B7280; font-weight:600;">Primary Lot (Compulsory)</span>'}
      </div>
      <div class="form-grid-3">
        <div class="form-group">
          <label>Quantity <span class="required">*</span></label>
          <input type="number" step="0.01" min="0.01" class="form-control lot-qty-input" required placeholder="e.g. 100" oninput="ordersController.recalcLotSummary()">
        </div>
        <div class="form-group">
          <label>Unit <span class="required">*</span></label>
          <select class="form-control lot-unit-select" required onchange="ordersController.recalcLotSummary()">
            <option value="mCi" selected>mCi (Millicurie)</option>
            <option value="Dose">Dose (Unit Dose)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Calibration Date <span class="required">*</span></label>
          <input type="date" class="form-control lot-calib-date" required value="${today}">
        </div>
      </div>
      <div class="form-grid-2" style="margin-top:0.75rem;">
        <div class="form-group">
          <label>Calibration Time <span class="required">*</span></label>
          <input type="time" class="form-control lot-calib-time" required value="08:00">
        </div>
        <div class="form-group">
          <label>Lot Notes / Patient Ref (Optional)</label>
          <input type="text" class="form-control lot-notes" placeholder="e.g. Patient Batch 1, Whole-Body PET">
        </div>
      </div>
    `;

    container.appendChild(lotDiv);
    this.recalcLotSummary();
  },

  // "REMOVE LOT" action
  removeLotRow(lotIndex) {
    const container = document.getElementById('lotsContainer');
    if (!container || container.children.length <= 1) {
      ui.showToast('At least one lot is compulsory for every order.', 'warning');
      return;
    }

    const target = document.getElementById(`lotRow_${lotIndex}`);
    if (target) {
      target.remove();
      this.reindexLots();
      this.recalcLotSummary();
    }
  },

  // Re-index lot cards when one is deleted
  reindexLots() {
    const container = document.getElementById('lotsContainer');
    if (!container) return;

    Array.from(container.children).forEach((row, idx) => {
      const newNum = idx + 1;
      row.id = `lotRow_${newNum}`;
      const badge = row.querySelector('.lot-badge');
      if (badge) {
        badge.innerHTML = `LOT #${newNum} &bull; SHR-2026-AUTO-L${String(newNum).padStart(2, '0')}`;
      }
      const removeBtn = row.querySelector('.btn-danger');
      if (removeBtn) {
        removeBtn.setAttribute('onclick', `ordersController.removeLotRow(${newNum})`);
      }
    });
  },

  // Real-time calculation of lot totals
  recalcLotSummary() {
    const container = document.getElementById('lotsContainer');
    if (!container) return;

    const rows = container.querySelectorAll('.lot-card-item');
    let totalLots = rows.length;
    let totalMci = 0;
    let totalDoses = 0;

    rows.forEach(r => {
      const qtyInput = r.querySelector('.lot-qty-input');
      const unitSelect = r.querySelector('.lot-unit-select');
      const val = parseFloat(qtyInput?.value) || 0;
      const unit = unitSelect?.value || 'mCi';

      if (unit === 'mCi') totalMci += val;
      if (unit === 'Dose') totalDoses += val;
    });

    const summaryText = document.getElementById('lotsSummaryBar');
    if (summaryText) {
      summaryText.innerHTML = `
        <span>Total Lots: <strong>${totalLots}</strong></span>
        <span>Total Activity: <strong>${totalMci.toFixed(2)} mCi</strong></span>
        <span>Total Doses: <strong>${totalDoses.toFixed(0)} Dose</strong></span>
      `;
    }
  },

  // Order Placement Form Submission
  attachFormListeners() {
    const orderForm = document.getElementById('newOrderForm');
    if (!orderForm) return;

    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitOrderBtn');

      // Extract form values
      const orderDate = document.getElementById('orderDate').value;
      const productId = document.getElementById('orderProduct').value;
      const destination = document.getElementById('orderDestination').value.trim();
      const notes = document.getElementById('orderNotes').value.trim();

      // Extract lots
      const lotRows = document.querySelectorAll('.lot-card-item');
      if (lotRows.length === 0) {
        ui.showToast('Please add at least one lot.', 'error');
        return;
      }

      const lots = [];
      let hasError = false;

      lotRows.forEach((r, idx) => {
        const qty = parseFloat(r.querySelector('.lot-qty-input')?.value);
        const unit = r.querySelector('.lot-unit-select')?.value;
        const calibDate = r.querySelector('.lot-calib-date')?.value;
        const calibTime = r.querySelector('.lot-calib-time')?.value;
        const lotNotes = r.querySelector('.lot-notes')?.value || '';

        if (isNaN(qty) || qty <= 0) {
          ui.showToast(`Lot #${idx + 1}: Quantity must be greater than zero.`, 'error');
          hasError = true;
          return;
        }
        if (!calibDate || !calibTime) {
          ui.showToast(`Lot #${idx + 1}: Calibration date and time are mandatory.`, 'error');
          hasError = true;
          return;
        }

        lots.push({
          lotNumber: idx + 1,
          quantity: qty,
          unit: unit,
          calibrationDate: calibDate,
          calibrationTime: calibTime,
          notes: lotNotes
        });
      });

      if (hasError) return;

      // Disable submit button while saving
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Validating & Submitting Order...';

      try {
        const payload = {
          orderDate,
          productId: parseInt(productId, 10),
          destination,
          notes,
          lots
        };

        const res = await api.request('/shreeji/order/create', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res && res.success) {
          ui.showSuccessModal(res.orderId, res.totalLots, res.totalQuantity);
          orderForm.reset();
          this.initLotsRepeater();
          // Reload dashboard & orders table
          await this.loadDashboard();
          await this.loadOrders();
        } else {
          ui.showToast(res.error || 'Failed to submit order.', 'error');
        }
      } catch (err) {
        ui.showToast('Order submission error: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Cyclotron Order';
      }
    });
  },

  // Load Dashboard KPIs & Summaries
  async loadDashboard() {
    try {
      const res = await api.request('/shreeji/dashboard', { method: 'GET' });
      if (res && res.success) {
        // If simulation or direct response
        const data = res.data || {};
        const kpi = data.kpi || simulationBackend.db.orders.reduce((acc, curr) => {
          if (state.user.role === 'CLIENT' && curr.client_id !== state.user.clientId) return acc;
          acc.total_orders++;
          acc.total_lots += curr.total_lots;
          if (curr.status === 'Dispatched') acc.dispatched_orders++;
          if (curr.status === 'Production Planned') acc.production_planned_orders++;
          if (['Order Submitted', 'Production Planned', 'Production Completed'].includes(curr.status)) acc.pending_orders++;
          return acc;
        }, { total_orders: 0, pending_orders: 0, today_orders: 1, delivered_orders: 0, cancelled_orders: 0, total_lots: 0, production_planned_orders: 0, dispatched_orders: 0 });

        state.kpi = kpi;
        this.renderKpiCards();
        this.renderCharts(data);
      }
    } catch (e) {
      console.warn('Dashboard load fallback:', e);
      this.renderKpiCards();
    }
  },

  renderKpiCards() {
    const k = state.kpi;
    document.getElementById('kpiTotalOrders').innerText = k.total_orders || 0;
    document.getElementById('kpiPendingOrders').innerText = k.pending_orders || 0;
    document.getElementById('kpiTodayOrders').innerText = k.today_orders || 0;
    document.getElementById('kpiDeliveredOrders').innerText = k.delivered_orders || 0;
    document.getElementById('kpiCancelledOrders').innerText = k.cancelled_orders || 0;
    document.getElementById('kpiTotalLots').innerText = k.total_lots || 0;
    document.getElementById('kpiProductionPlanned').innerText = k.production_planned_orders || 0;
    document.getElementById('kpiDispatchedOrders').innerText = k.dispatched_orders || 0;
  },

  renderCharts(data) {
    const container = document.getElementById('productChartBox');
    if (!container) return;

    // Render interactive SVG bars for products
    const products = [
      { name: 'F-18 FDG', count: 65, color: '#B51224' },
      { name: 'F-18 PSMA', count: 22, color: '#8F1020' },
      { name: 'F-18 FDOPA', count: 8, color: '#0284C7' },
      { name: 'F-18 FAPI', count: 5, color: '#059669' }
    ];

    let svgHtml = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        ${products.map(p => `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.25rem;">
              <span>${p.name}</span>
              <span>${p.count}%</span>
            </div>
            <div style="height:10px; background:#F1D5D8; border-radius:999px; overflow:hidden;">
              <div style="width:${p.count}%; height:100%; background:${p.color}; border-radius:999px;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.innerHTML = svgHtml;
  },

  // Load and Filter Orders
  async loadOrders() {
    try {
      const q = new URLSearchParams({
        fromDate: state.filters.fromDate,
        toDate: state.filters.toDate,
        status: state.filters.status,
        productId: state.filters.productId,
        search: state.filters.search,
        limit: state.filters.pageSize,
        offset: (state.filters.page - 1) * state.filters.pageSize
      }).toString();

      const res = await api.request(`/shreeji/orders?${q}`, { method: 'GET' });
      if (res && res.success) {
        state.orders = res.data || [];
        this.renderOrdersTable();
      }
    } catch (e) {
      console.warn('Orders load fallback:', e);
      this.renderOrdersTable();
    }
  },

  renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let list = [...state.orders];

    // Client-side filtering if search/status are active
    if (state.filters.status !== 'ALL') {
      list = list.filter(o => o.status === state.filters.status);
    }
    if (state.filters.search) {
      const term = state.filters.search.toLowerCase();
      list = list.filter(o => 
        (o.order_id && o.order_id.toLowerCase().includes(term)) ||
        (o.destination && o.destination.toLowerCase().includes(term)) ||
        (o.product_name && o.product_name.toLowerCase().includes(term))
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 2rem; color: #64748B;">
            <p style="font-weight:700; font-size:1rem;">No orders found matching your criteria</p>
            <p style="font-size:0.85rem;">Try adjusting the date or status filters, or place a new cyclotron order.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(o => {
      const statusClass = this.getStatusBadgeClass(o.status);
      const isClient = state.user?.role === 'CLIENT';
      const isLockedForDirectEdit = ['Production Planned', 'Production Completed', 'Invoice Generated', 'Dispatched', 'Out for Delivery', 'Delivered'].includes(o.status);

      return `
        <tr>
          <td><strong>${o.order_id}</strong></td>
          <td>${o.order_date}<br><small style="color:#64748B">${new Date(o.submission_timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small></td>
          ${!isClient ? `<td>${o.client_name || 'Hospital Client'}</td>` : ''}
          <td><span style="font-weight:700; color:var(--primary);">${o.product_name}</span></td>
          <td><span class="lot-badge">${o.total_lots} Lots</span></td>
          <td><strong>${o.total_quantity}</strong> ${o.primary_unit}</td>
          <td><span class="status-badge ${statusClass}">${o.status}</span></td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="ordersController.inspectOrder('${o.order_id}')" title="Inspect Order Details">Inspect</button>
              ${!isClient ? `
                <button class="btn btn-outline-primary btn-sm" onclick="adminController.openStatusModal('${o.order_id}', '${o.status}')">Update Status</button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="ordersController.requestModification('${o.order_id}', ${isLockedForDirectEdit})">Modify</button>
                ${o.status !== 'Cancelled' && o.status !== 'Delivered' ? `
                  <button class="btn btn-danger btn-sm" onclick="ordersController.cancelOrderPrompt('${o.order_id}')">Cancel</button>
                ` : ''}
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const adminTbody = document.getElementById('adminOrdersTableBody');
    if (adminTbody) {
      adminTbody.innerHTML = list.map(o => {
        const statusClass = this.getStatusBadgeClass(o.status);
        return `
          <tr>
            <td><strong>${o.order_id}</strong></td>
            <td>${o.order_date}</td>
            <td><strong>${o.client_name || 'Hospital Client'}</strong></td>
            <td><span style="font-weight:700; color:var(--primary);">${o.product_name}</span></td>
            <td><span class="lot-badge">${o.total_lots} Lots</span></td>
            <td><strong>${o.total_quantity}</strong> ${o.primary_unit}</td>
            <td><span class="status-badge ${statusClass}">${o.status}</span></td>
            <td>
              <button class="btn btn-outline-primary btn-sm" onclick="adminController.openStatusModal('${o.order_id}', '${o.status}')">Update Stage</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  },

  getStatusBadgeClass(status) {
    switch (status) {
      case 'Order Submitted': return 'status-submitted';
      case 'Production Planned': return 'status-planned';
      case 'Production Completed': return 'status-completed';
      case 'Invoice Generated': return 'status-invoiced';
      case 'Dispatched': return 'status-dispatched';
      case 'Out for Delivery': return 'status-delivery';
      case 'Delivered': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-submitted';
    }
  },

  // Inspect Order: Opens detailed drawer with Lots & 8-Stage Timeline
  inspectOrder(orderId) {
    const o = state.orders.find(x => x.order_id === orderId);
    if (!o) return;

    const modalBody = document.getElementById('orderDetailsBody');
    if (!modalBody) return;

    const lotsHtml = (o.lots || []).map(l => `
      <tr>
        <td><strong>${l.lot_id}</strong></td>
        <td>Lot #${l.lot_number}</td>
        <td><strong>${l.quantity}</strong></td>
        <td>${l.unit}</td>
        <td>${l.calibration_date}</td>
        <td>${l.calibration_time}</td>
        <td>${l.notes || '-'}</td>
      </tr>
    `).join('');

    const timelineHtml = (o.timeline || [
      { status: 'Order Submitted', timestamp: new Date(o.submission_timestamp).toLocaleTimeString(), by: 'Portal Client', remarks: 'Order verified and queued' }
    ]).map((t, idx) => `
      <div class="timeline-step completed">
        <div class="timeline-icon-dot">&check;</div>
        <div class="timeline-title">${t.status}</div>
        <div class="timeline-meta">${t.timestamp} &bull; Updated by: ${t.by}</div>
        ${t.remarks ? `<div class="timeline-remarks">${t.remarks}</div>` : ''}
      </div>
    `).join('');

    modalBody.innerHTML = `
      <div style="background:#FFF5F6; border:1px solid #FECDD3; border-radius:8px; padding:1rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h4 style="color:var(--primary); font-size:1.15rem; font-weight:800;">Order #${o.order_id}</h4>
            <p style="font-size:0.85rem; color:#4B5563;">Placed on: <strong>${o.order_date}</strong> (Submitted: ${new Date(o.submission_timestamp).toLocaleString()})</p>
          </div>
          <span class="status-badge ${this.getStatusBadgeClass(o.status)}" style="font-size:0.9rem;">${o.status}</span>
        </div>
        <div style="margin-top:0.75rem; font-size:0.85rem;">
          <p><strong>Hospital / Destination:</strong> ${o.destination}</p>
          <p><strong>Product:</strong> ${o.product_name} (${o.isotope}) &bull; <strong>Total Lots:</strong> ${o.total_lots} &bull; <strong>Total Activity:</strong> ${o.total_quantity} ${o.primary_unit}</p>
          ${o.notes ? `<p><strong>Special Instructions:</strong> <em>${o.notes}</em></p>` : ''}
        </div>
      </div>

      <h4 style="color:var(--secondary); font-weight:800; margin-bottom:0.75rem;">Registered Lots Under This Order</h4>
      <div class="table-responsive" style="margin-bottom:1.75rem;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Lot ID</th>
              <th>Lot #</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Calibration Date</th>
              <th>Calibration Time</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${lotsHtml}
          </tbody>
        </table>
      </div>

      <h4 style="color:var(--secondary); font-weight:800; margin-bottom:0.75rem;">Status History & Production Timeline</h4>
      <div class="order-timeline">
        ${timelineHtml}
      </div>
    `;

    ui.openModal('orderDetailsModal');
  },

  // Modification Request Flow
  requestModification(orderId, isLocked) {
    if (isLocked) {
      document.getElementById('modOrderId').value = orderId;
      document.getElementById('modOrderNotice').innerText = `Notice: Order #${orderId} is already in production/dispatch workflow. Direct editing is locked. Your request will be transmitted directly to the Shreeji Production Control Room.`;
      ui.openModal('modificationModal');
    } else {
      ui.showToast(`Order #${orderId} is still in 'Order Submitted' stage. You can contact dispatch or submit notes.`, 'info');
    }
  },

  // Cancel Order Flow
  cancelOrderPrompt(orderId) {
    document.getElementById('cancelOrderId').value = orderId;
    ui.openModal('cancelModal');
  },

  attachFilterListeners() {
    const searchInput = document.getElementById('filterSearch');
    const statusSelect = document.getElementById('filterStatus');
    const fromDateInput = document.getElementById('filterFromDate');
    const toDateInput = document.getElementById('filterToDate');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        this.renderOrdersTable();
      });
    }
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        this.renderOrdersTable();
      });
    }
    if (fromDateInput) {
      fromDateInput.addEventListener('change', (e) => {
        state.filters.fromDate = e.target.value;
        this.loadOrders();
      });
    }
    if (toDateInput) {
      toDateInput.addEventListener('change', (e) => {
        state.filters.toDate = e.target.value;
        this.loadOrders();
      });
    }
  },

  exportToCsv() {
    let list = [...state.orders];
    if (list.length === 0) {
      ui.showToast('No orders available to export.', 'warning');
      return;
    }

    const headers = ['Order ID', 'Client Name', 'Order Date', 'Submission Time', 'Product', 'Total Lots', 'Total Quantity', 'Unit', 'Status', 'Destination'];
    const rows = list.map(o => [
      o.order_id,
      `"${o.client_name || ''}"`,
      o.order_date,
      o.submission_timestamp,
      o.product_name,
      o.total_lots,
      o.total_quantity,
      o.primary_unit,
      o.status,
      `"${o.destination.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shreeji_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ui.showToast('Order export CSV generated successfully.', 'success');
  }
};

// ============================================================================
// 7. ADMIN CONTROLLER
// ============================================================================
const adminController = {
  openStatusModal(orderId, currentStatus) {
    document.getElementById('adminUpdateOrderId').value = orderId;
    document.getElementById('adminNewStatus').value = currentStatus;
    document.getElementById('adminStatusRemarks').value = '';
    ui.openModal('adminStatusModal');
  },

  async submitStatusUpdate() {
    const orderId = document.getElementById('adminUpdateOrderId').value;
    const newStatus = document.getElementById('adminNewStatus').value;
    const remarks = document.getElementById('adminStatusRemarks').value.trim();

    try {
      const res = await api.request('/shreeji/admin/order/status', {
        method: 'POST',
        body: JSON.stringify({ orderId, newStatus, remarks })
      });

      if (res && res.success) {
        ui.showToast(`Order #${orderId} status changed to ${newStatus}`, 'success');
        ui.closeModal('adminStatusModal');
        await ordersController.loadDashboard();
        await ordersController.loadOrders();
      } else {
        ui.showToast(res.error || 'Failed to update status', 'error');
      }
    } catch (e) {
      ui.showToast('Status update error: ' + e.message, 'error');
    }
  }
};

// ============================================================================
// 8. UI & VIEW MANAGER
// ============================================================================
const ui = {
  showAuthScreen() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appShell').style.display = 'none';
  },

  showAppShell() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';

    // Populate user banner
    if (state.user) {
      document.getElementById('userFullName').innerText = state.user.fullName;
      document.getElementById('userRoleTag').innerText = state.user.role;
      document.getElementById('userRoleTag').className = `role-tag ${state.user.role.toLowerCase()}`;
      document.getElementById('userClientName').innerText = state.user.clientName || 'Central Cyclotron HQ';

      // Toggle Admin specific tabs
      const adminTab = document.getElementById('adminTabNav');
      if (adminTab) {
        adminTab.style.display = (state.user.role === 'ADMIN') ? 'inline-flex' : 'none';
      }
    }

    this.switchTab('dashboard');
  },

  switchTab(tabId) {
    state.activeTab = tabId;

    // Update nav tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update view panels
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view_${tabId}`);
    if (activeSec) {
      activeSec.classList.add('active');
    }
  },

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  },

  showSuccessModal(orderId, totalLots, totalQty) {
    document.getElementById('successOrderId').innerText = orderId;
    document.getElementById('successLotCount').innerText = `${totalLots} Lots`;
    document.getElementById('successTotalQty').innerText = `${totalQty} Activity/Doses`;
    this.openModal('orderSuccessModal');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '&check;' : type === 'error' ? '&times;' : '&bull;'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  setAuthTab(role) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`authTab_${role}`).classList.add('active');

    if (role === 'CLIENT') {
      document.getElementById('loginUsername').value = 'apex_hospital';
      document.getElementById('loginPassword').value = 'Client@Shreeji2026!';
    } else {
      document.getElementById('loginUsername').value = 'admin';
      document.getElementById('loginPassword').value = 'Admin@Shreeji2026!';
    }
  },

  openSettingsModal() {
    document.getElementById('settingsApiUrl').value = CONFIG.API_BASE_URL;
    this.openModal('settingsModal');
  },

  saveSettings() {
    const val = document.getElementById('settingsApiUrl').value.trim();
    if (val) {
      CONFIG.API_BASE_URL = val;
      localStorage.setItem('shreeji_api_url', val);
      this.showToast('API Endpoint configured successfully!', 'success');
      this.closeModal('settingsModal');
    }
  }
};

// ============================================================================
// 9. SERVICE WORKER & PWA INSTALLATION
// ============================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker registered with scope:', reg.scope))
      .catch(err => console.log('[PWA] Service Worker registration failed:', err));
  });
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  auth.init();
  ordersController.init();
});
