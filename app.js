// app.js - Main Application Logic for Hotel Contract Rate Tracker
// Mock current date as requested by local time: 2026-06-05
const CURRENT_DATE = new Date('2026-06-05');

// ============================================================
// LOGIN SYSTEM
// ============================================================
const DEFAULT_PASSWORD = 'giftbox2026';
const PASSWORD_STORAGE_KEY = 'app_pw_hash_v2';

function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16);
}

function getStoredPasswordHash() {
  return localStorage.getItem(PASSWORD_STORAGE_KEY) || simpleHash(DEFAULT_PASSWORD);
}

function checkLogin() {
  return sessionStorage.getItem('is_logged_in') === 'true';
}

function initLoginSystem() {
  const overlay = document.getElementById('login-overlay');
  if (!overlay) return;
  
  // If already logged in this session, hide overlay
  if (checkLogin()) {
    overlay.style.display = 'none';
    return;
  }
  
  const form = document.getElementById('form-login');
  const errorDiv = document.getElementById('login-error');
  const pwInput = document.getElementById('login-password');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = pwInput.value;
    const storedHash = getStoredPasswordHash();
    
    if (simpleHash(password) === storedHash) {
      sessionStorage.setItem('is_logged_in', 'true');
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.4s ease';
      setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = ''; }, 400);
      errorDiv.style.display = 'none';
    } else {
      errorDiv.style.display = 'block';
      pwInput.value = '';
      pwInput.focus();
      // Shake animation
      const box = overlay.querySelector('.login-box');
      box.style.animation = 'none';
      box.offsetHeight; // reflow
      box.style.animation = 'shakeError 0.4s ease';
    }
  });
}

function initPasswordChangeListener() {
  const btn = document.getElementById('btn-change-password');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const newPw = document.getElementById('new-password').value.trim();
    const confirmPw = document.getElementById('confirm-password').value.trim();
    if (!newPw) { showToast('กรุณากรอกรหัสผ่านใหม่', true); return; }
    if (newPw.length < 6) { showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', true); return; }
    if (newPw !== confirmPw) { showToast('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบใหม่', true); return; }
    if (!confirm(`ยืนยันเปลี่ยนรหัสผ่านเป็น "${newPw}" ใช่หรือไม่?`)) return;
    localStorage.setItem(PASSWORD_STORAGE_KEY, simpleHash(newPw));
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    showToast('เปลี่ยนรหัสผ่านสำเร็จ! ผู้ใช้ทุกคนต้องใช้รหัสใหม่ในการเข้าสู่ระบบครั้งต่อไป!');
  });
}

// SQL Script template to create tables in Supabase Editor
const SUPABASE_SQL_SETUP_SCRIPT = `-- 1. CREATE LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  province TEXT NOT NULL,
  area TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE HOTELS TABLE
CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stars INTEGER DEFAULT 4,
  province TEXT NOT NULL,
  area TEXT NOT NULL,
  email TEXT NOT NULL,
  cc TEXT,
  lineId TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  hotelId TEXT REFERENCES hotels(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('main', 'promo')),
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,

  stayStartDate TEXT,
  stayEndDate TEXT,

  baseRate INTEGER NOT NULL,
  fileName TEXT,
  fileData TEXT,
  fileType TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL,
  travelAgentLicense TEXT NOT NULL,
  emailTemplate TEXT NOT NULL,
  companyDocs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY FOR CLIENT-SIDE PUBLIC ANON ACCESS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY ALLOWING PUBLIC ANON INSERT/SELECT/UPDATE/DELETE
DROP POLICY IF EXISTS "Allow anon select" ON locations;
CREATE POLICY "Allow anon select" ON locations FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON locations;
CREATE POLICY "Allow anon insert" ON locations FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update" ON locations;
CREATE POLICY "Allow anon update" ON locations FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete" ON locations;
CREATE POLICY "Allow anon delete" ON locations FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon select" ON hotels;
CREATE POLICY "Allow anon select" ON hotels FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON hotels;
CREATE POLICY "Allow anon insert" ON hotels FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update" ON hotels;
CREATE POLICY "Allow anon update" ON hotels FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete" ON hotels;
CREATE POLICY "Allow anon delete" ON hotels FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon select" ON contracts;
CREATE POLICY "Allow anon select" ON contracts FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON contracts;
CREATE POLICY "Allow anon insert" ON contracts FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update" ON contracts;
CREATE POLICY "Allow anon update" ON contracts FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete" ON contracts;
CREATE POLICY "Allow anon delete" ON contracts FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon select" ON settings;
CREATE POLICY "Allow anon select" ON settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert" ON settings;
CREATE POLICY "Allow anon insert" ON settings FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update" ON settings;
CREATE POLICY "Allow anon update" ON settings FOR UPDATE TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon delete" ON settings;
CREATE POLICY "Allow anon delete" ON settings FOR DELETE TO anon USING (true);
`;

// Global Application State
let locationsState = [];
let hotelsState = [];
let contractsState = [];
let settingsState = {
  companyName: 'บริษัท เที่ยวไทย จำกัด',
  travelAgentLicense: '11/09999',
  emailTemplate: '',
  companyDocs: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 0. Init Login system FIRST (before any other UI)
    initLoginSystem();
    
    // 1. Initialize DB and Seed sample data if empty
    await initDB();
    await seedInitialData();
    
    // 2. Load all states from active database (IndexedDB or Supabase)
    await refreshState();
    
    // 3. Initialize Navigation & Routing
    initNavigation();
    
    // 4. Initialize Forms and Event Listeners
    initFormListeners();
    initFilterListeners();
    initBackupListeners();
    initCloudSettingsListeners();
    initPasswordChangeListener();
    initAIListeners();
    
    // 5. Render active view & indicators
    updateCloudStatusUI();
    renderDashboard();
    populateSelectDropdowns();
    
    showToast('พร้อมทำงาน! ' + (isCloudEnabled() ? 'เชื่อมต่อระบบออนไลน์เรียลไทม์แล้ว' : 'รันในโหมดออฟไลน์'));
  } catch (error) {
    console.error('Initialization failed:', error);
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error, true);
  }
});

// Refresh State from DB (IndexedDB or Supabase depending on connection status)
async function refreshState() {
  locationsState = await getAllItems('locations');
  hotelsState = await getAllItems('hotels');
  contractsState = await getAllItems('contracts');
  
  // Sort data logically
  locationsState.sort((a, b) => a.province.localeCompare(b.province) || a.area.localeCompare(b.area));
  hotelsState.sort((a, b) => a.name.localeCompare(b.name));
  
  const settings = await getItem('settings', 'company_settings');
  if (settings) {
    settingsState = settings;
  }
}

// Update Cloud Status Badges in Sidebar and Settings Screen
function updateCloudStatusUI() {
  const badge = document.getElementById('cloud-badge');
  const settingsBadge = document.getElementById('supabase-status-badge');
  const disconnectBtn = document.getElementById('btn-disconnect-supabase');
  const saveBtn = document.getElementById('btn-save-supabase');
  const syncBtn = document.getElementById('btn-sync-to-cloud');
  const msgText = document.getElementById('supabase-connection-msg');
  
  if (isCloudEnabled()) {
    // Online state
    if (badge) badge.style.display = 'inline-block';
    
    if (settingsBadge) {
      settingsBadge.textContent = 'เชื่อมต่อสำเร็จ (Online)';
      settingsBadge.className = 'badge badge-success';
    }
    if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
    if (saveBtn) saveBtn.textContent = 'เชื่อมต่อสำเร็จแล้ว';
    if (syncBtn) syncBtn.removeAttribute('disabled');
    if (msgText) {
      msgText.innerHTML = '<span style="color:var(--color-success); font-weight:600;">✓ เชื่อมโยงคลาวด์สมบูรณ์</span> ข้อมูลจะอัปเดตเรียลไทม์กับทีมงานทั้งหมด';
    }
  } else {
    // Offline state
    if (badge) badge.style.display = 'none';
    
    if (settingsBadge) {
      settingsBadge.textContent = 'ใช้งานออฟไลน์ (Offline)';
      settingsBadge.className = 'badge badge-danger';
    }
    if (disconnectBtn) disconnectBtn.style.display = 'none';
    if (saveBtn) saveBtn.textContent = 'เชื่อมต่อและเปิดใช้ระบบคลาวด์';
    if (syncBtn) syncBtn.setAttribute('disabled', 'true');
    if (msgText) {
      msgText.textContent = '* หากเชื่อมต่อแล้ว ระบบจะสลับไปอ่าน-เขียนข้อมูลเรียลไทม์กับทุกคนโดยอัตโนมัติ';
    }
  }
}

// Navigation / Router Logic
function initNavigation() {
  const menuItems = document.querySelectorAll('.sidebar .menu-item');
  const pages = document.querySelectorAll('.main-content .page');
  
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetPageId = item.getAttribute('data-target');
      
      // Toggle active states
      menuItems.forEach(mi => mi.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));
      
      item.classList.add('active');
      const targetPage = document.getElementById(targetPageId);
      if (targetPage) {
        targetPage.classList.add('active');
      }
      
      // Page specific rendering triggers
      if (targetPageId === 'page-dashboard') {
        renderDashboard();
      } else if (targetPageId === 'page-hotels') {
        renderHotelsList();
      } else if (targetPageId === 'page-locations') {
        renderLocationsList();
      } else if (targetPageId === 'page-settings') {
        renderSettingsForm();
      } else if (targetPageId === 'page-analytics') {
        renderPriceAnalytics();
      } else if (targetPageId === 'page-ai') {
        // AI page: reset results
        document.getElementById('ai-placeholder').style.display = 'flex';
        document.getElementById('ai-results-section').style.display = 'none';
      }
    });
  });
}

// Utility: Show Toast Notification
function showToast(message, isError = false) {
  const toast = document.getElementById('toast-notify');
  const toastMsg = document.getElementById('toast-msg');
  
  toastMsg.textContent = message;
  
  if (isError) {
    toast.style.borderColor = 'var(--color-danger)';
    toast.querySelector('svg').style.stroke = 'var(--color-danger)';
  } else {
    toast.style.borderColor = 'var(--accent-purple)';
    toast.querySelector('svg').style.stroke = 'var(--accent-purple)';
  }
  
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

// Modal helper controls (global scope for inline HTML close buttons)
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
};

// Calculate Date Differences & Contract Status
function calculateContractStatus(contract) {
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  
  // Normalize date comparison
  const curDateStr = CURRENT_DATE.toISOString().split('T')[0];
  const endDateStr = contract.endDate;
  
  if (endDateStr < curDateStr) {
    return 'Expired';
  }
  
  // Calculate remaining days
  const timeDiff = end.getTime() - CURRENT_DATE.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (contract.type === 'main') {
    if (daysDiff <= 45 && daysDiff >= 0) {
      return 'Expiring'; // Expiring within 45 days
    }
  } else if (contract.type === 'promo') {
    if (daysDiff <= 7 && daysDiff >= 0) {
      return 'Expiring'; // Promo expiring within 7 days
    }
  }
  
  return 'Active';
}

// Helper: Get Active Contract Price & Details for a Hotel (as of current date)
function getHotelActiveRates(hotelId) {
  const hotelContracts = contractsState.filter(c => c.hotelId === hotelId);
  
  const curDateStr = CURRENT_DATE.toISOString().split('T')[0];
  
  // 1. Find active promotion first (Promotions take precedence for selling/pricing)
  const activePromo = hotelContracts.find(c => 
    c.type === 'promo' && 
    c.startDate <= curDateStr && 
    c.endDate >= curDateStr
  );
  
  // 2. Find active main contract
  const activeMain = hotelContracts.find(c => 
    c.type === 'main' && 
    c.startDate <= curDateStr && 
    c.endDate >= curDateStr
  );
  
  return {
    activePromoRate: activePromo ? activePromo.baseRate : null,
    activePromoContract: activePromo || null,
    activeMainRate: activeMain ? activeMain.baseRate : null,
    activeMainContract: activeMain || null
  };
}

// Populate dropdown select options dynamically
function populateSelectDropdowns() {
  const provinceSelects = [
    document.getElementById('dash-filter-province'),
    document.getElementById('hotels-filter-province'),
    document.getElementById('analytics-filter-province'),
    document.getElementById('hotel-province'),
    document.getElementById('ai-filter-province')
  ];
  
  // Get distinct provinces
  const provinces = [...new Set(locationsState.map(l => l.province))].sort();
  
  provinceSelects.forEach(select => {
    if (!select) return;
    
    // Keep first option (e.g. "ทุกจังหวัด" or "-- เลือกจังหวัด --")
    const firstOptText = select.options[0] ? select.options[0].textContent : '-- เลือกจังหวัด --';
select.innerHTML = `<option value="">${firstOptText}</option>`;
    
    provinces.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      select.appendChild(opt);
    });
  });
}

// Handle cascading province -> area selectors
function initFilterListeners() {
  // Hotels view cascading filters
  const hotelsProvince = document.getElementById('hotels-filter-province');
  const hotelsArea = document.getElementById('hotels-filter-area');
  
  hotelsProvince.addEventListener('change', () => {
    const selectedProv = hotelsProvince.value;
    hotelsArea.innerHTML = '<option value="">ทุกพื้นที่</option>';
    
    if (selectedProv) {
      const filteredAreas = locationsState
        .filter(l => l.province === selectedProv)
        .map(l => l.area);
      
      filteredAreas.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        hotelsArea.appendChild(opt);
      });
    }
    renderHotelsList();
  });
  
  hotelsArea.addEventListener('change', renderHotelsList);
  
  const searchInput = document.getElementById('hotels-search');
  searchInput.addEventListener('input', renderHotelsList);
  
  // Dashboard view filter listener
  document.getElementById('dash-filter-province').addEventListener('change', renderDashboard);
  document.getElementById('dash-filter-promo-status').addEventListener('change', renderDashboard);
  
  // Analytics cascading filters
  const analyticsProvince = document.getElementById('analytics-filter-province');
  const analyticsArea = document.getElementById('analytics-filter-area');
  
  analyticsProvince.addEventListener('change', () => {
    const selectedProv = analyticsProvince.value;
    analyticsArea.innerHTML = '<option value="">เลือกพื้นที่ท่องเที่ยว</option>';
    
    if (selectedProv) {
      const filteredAreas = locationsState
        .filter(l => l.province === selectedProv)
        .map(l => l.area);
      
      filteredAreas.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        analyticsArea.appendChild(opt);
      });
    }
    renderPriceAnalytics();
  });
  
  analyticsArea.addEventListener('change', renderPriceAnalytics);
  
  // Hotel form cascading selector (modal)
  const formProvince = document.getElementById('hotel-province');
  const formArea = document.getElementById('hotel-area');
  
  formProvince.addEventListener('change', () => {
    const selectedProv = formProvince.value;
    formArea.innerHTML = '<option value="">-- เลือกพื้นที่ย่อย --</option>';
    
    if (selectedProv) {
      const filteredAreas = locationsState
        .filter(l => l.province === selectedProv)
        .map(l => l.area);
      
      filteredAreas.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        formArea.appendChild(opt);
      });
    }
  });
}

// Render Dashboard View
function renderDashboard() {
  const filterProv = document.getElementById('dash-filter-province').value;
  const filterPromo = document.getElementById('dash-filter-promo-status').value;
  
  // Apply province filtering to hotels
  let filteredHotels = hotelsState;
  if (filterProv) {
    filteredHotels = filteredHotels.filter(h => h.province === filterProv);
  }
  
  // 1. Calculate and render Statistics
  const totalHotelsCount = filteredHotels.length;
  document.getElementById('stat-total-hotels').textContent = totalHotelsCount;
  
  let activeContractsCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  
  const hotelRowsData = filteredHotels.map(hotel => {
    const rates = getHotelActiveRates(hotel.id);
    const contracts = contractsState.filter(c => c.hotelId === hotel.id);
    
    // Check main contract status
    let activeMainContract = rates.activeMainContract;
    if (activeMainContract) {
      activeContractsCount++;
    }
    
    // Calculate alert tallies from all contracts of this hotel
    contracts.forEach(contract => {
      const status = calculateContractStatus(contract);
      if (status === 'Expiring') {
        expiringSoonCount++;
      } else if (status === 'Expired') {
        expiredCount++;
      }
    });
    
    const hasPromoActive = rates.activePromoRate !== null;
    
    return {
      hotel,
      rates,
      hasPromoActive
    };
  });
  
  // Apply promotion filter to the table view
  let displayedRows = hotelRowsData;
  if (filterPromo === 'has_promo') {
    displayedRows = displayedRows.filter(r => r.hasPromoActive);
  } else if (filterPromo === 'no_promo') {
    displayedRows = displayedRows.filter(r => !r.hasPromoActive);
  }
  
  // Update general dashboard stats counter (using all contracts in scope of filtered hotels)
  document.getElementById('stat-active-contracts').textContent = activeContractsCount;
  document.getElementById('stat-expiring-soon').textContent = expiringSoonCount;
  document.getElementById('stat-expired').textContent = expiredCount;
  
  // Render Hotels List Table
  const tbody = document.getElementById('dash-hotels-tbody');
  tbody.innerHTML = '';
  
  if (displayedRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">ไม่พบข้อมูลโรงแรมในระบบตามตัวกรองที่เลือก</td></tr>`;
  } else {
    displayedRows.forEach(({ hotel, rates, hasPromoActive }) => {
      const tr = document.createElement('tr');
      
      const starText = '★'.repeat(hotel.stars);
      const mainRateText = rates.activeMainRate ? `${Number(rates.activeMainRate).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท` : '-';
      const promoRateText = rates.activePromoRate ? `${Number(rates.activePromoRate).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท` : '-';
      
      const promoBadge = hasPromoActive 
        ? `<span class="badge badge-success">มีโปรโมชั่น</span>` 
        : `<span class="badge badge-warning">ไม่มีโปรโมชั่น</span>`;
      
      tr.innerHTML = `
        <td class="hotel-name-cell">${hotel.name}</td>
        <td><span class="stars-container" style="color:var(--color-warning);">${starText}</span></td>
        <td>${hotel.province} / ${hotel.area}</td>
        <td style="font-weight:600;">${mainRateText}</td>
        <td style="color:var(--accent-blue); font-weight:700;">${promoRateText}</td>
        <td>${promoBadge}</td>
        <td>
          <button class="btn btn-secondary btn-icon" onclick="viewHotelDetails('${hotel.id}')" title="ดูรายละเอียด/ประวัติ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  // 2. Render Notifications / Alerts Pane
  renderDashboardAlerts();
}

// Render Dashboard Alerts Panel
function renderDashboardAlerts() {
  const alertsContainer = document.getElementById('dash-alerts-container');
  alertsContainer.innerHTML = '';
  
  const activeAlerts = [];
  
  // Evaluate all contracts to build alerts
  contractsState.forEach(contract => {
    const hotel = hotelsState.find(h => h.id === contract.hotelId);
    if (!hotel) return;
    
    const status = calculateContractStatus(contract);
    
    if (status === 'Expiring' || status === 'Expired') {
      const end = new Date(contract.endDate);
      const timeDiff = end.getTime() - CURRENT_DATE.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      activeAlerts.push({
        contract,
        hotel,
        status,
        daysDiff,
        endDate: contract.endDate
      });
    }
  });
  
  // Sort alerts: Expired first, then Expiring soonest (lowest daysDiff)
  activeAlerts.sort((a, b) => {
    if (a.status === 'Expired' && b.status !== 'Expired') return -1;
    if (a.status !== 'Expired' && b.status === 'Expired') return 1;
    return a.daysDiff - b.daysDiff;
  });
  
  if (activeAlerts.length === 0) {
    alertsContainer.innerHTML = `
      <div class="no-alerts">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div style="font-size:13px; font-weight:500;">สัญญาอยู่ในสถานะปกติทั้งหมด</div>
      </div>
    `;
    return;
  }
  
  activeAlerts.forEach(({ contract, hotel, status, daysDiff, endDate }) => {
    const item = document.createElement('div');
    const isMain = contract.type === 'main';
    const typeLabel = isMain ? 'สัญญาหลัก' : 'โปรโมชั่น';
    
    let badgeClass = 'warning';
    let alertClass = 'warning';
    let descText = '';
    
    if (status === 'Expired') {
      badgeClass = 'danger';
      alertClass = 'danger';
      descText = `หมดอายุแล้วเมื่อ ${formatDateThai(endDate)}`;
    } else {
      descText = `หมดอายุในอีก ${daysDiff} วัน (${formatDateThai(endDate)})`;
    }
    
    item.className = `alert-item ${alertClass}`;
    item.innerHTML = `
      <div class="alert-content">
        <div>
          <div class="alert-item-title">${hotel.name}</div>
          <div class="alert-item-desc">${typeLabel} • ${descText}</div>
        </div>
      </div>
      <div>
        <span class="alert-badge ${badgeClass}" style="margin-right:8px;">${status === 'Expired' ? 'หมดอายุ' : 'ใกล้หมด'}</span>
        <button class="alert-action-btn" onclick="initiateRenewal('${contract.id}')">ต่อสัญญา</button>
      </div>
    `;
    alertsContainer.appendChild(item);
  });
}

// Render Hotels List in Directory View
function renderHotelsList() {
  const search = document.getElementById('hotels-search').value.toLowerCase();
  const prov = document.getElementById('hotels-filter-province').value;
  const area = document.getElementById('hotels-filter-area').value;
  
  let filtered = hotelsState;
  
  if (search) {
    filtered = filtered.filter(h => h.name.toLowerCase().includes(search));
  }
  if (prov) {
    filtered = filtered.filter(h => h.province === prov);
  }
  if (area) {
    filtered = filtered.filter(h => h.area === area);
  }
  
  const tbody = document.getElementById('hotels-tbody');
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px;">ไม่พบข้อมูลโรงแรมในระบบ</td></tr>`;
    return;
  }
  
  filtered.forEach(hotel => {
    const tr = document.createElement('tr');
    const starText = '★'.repeat(hotel.stars);
    
    // Find active rates
    const rates = getHotelActiveRates(hotel.id);
    let activeContractText = '';
    if (rates.activeMainRate) {
      activeContractText += `<div style="font-weight:600;">Main: ${Number(rates.activeMainRate).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บ.</div>`;
    }
    if (rates.activePromoRate) {
      activeContractText += `<div style="color:var(--accent-blue);font-weight:600;">Promo: ${Number(rates.activePromoRate).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บ.</div>`;
    }
    if (!activeContractText) {
      activeContractText = '<span style="color:var(--text-muted);">ไม่มีสัญญาแอคทีฟ</span>';
    }
    
    const contactName = hotel.email ? hotel.email.split('@')[0] : 'เซลล์';
    const lineText = hotel.lineId ? `<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Line: ${hotel.lineId}</div>` : '';
    
    tr.innerHTML = `
      <td class="hotel-name-cell">${hotel.name}</td>
      <td><span class="stars-container">${starText}</span></td>
      <td>${hotel.province}</td>
      <td>${hotel.area}</td>
      <td>${contactName}</td>
      <td>
        <div style="font-size:12px;font-weight:500;">${hotel.email || '-'}</div>
        ${lineText}
      </td>
      <td>${activeContractText}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-icon" onclick="viewHotelDetails('${hotel.id}')" title="รายละเอียด & ประวัติสัญญา">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button class="btn btn-secondary btn-icon" onclick="editHotel('${hotel.id}')" title="แก้ไขโปรไฟล์">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn btn-danger btn-icon" onclick="deleteHotelClick('${hotel.id}')" title="ลบโรงแรม">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Locations List View
function renderLocationsList() {
  const tbody = document.getElementById('locations-tbody');
  tbody.innerHTML = '';
  
  if (locationsState.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:30px;">ยังไม่มีพื้นที่ท่องเที่ยวใดในระบบ</td></tr>`;
    return;
  }
  
  locationsState.forEach(loc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${loc.province}</td>
      <td>${loc.area}</td>
      <td>
        <button class="btn btn-danger btn-icon" onclick="deleteLocationClick('${loc.id}')" title="ลบพื้นที่ย่อย">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render Settings Form View
function renderSettingsForm() {
  document.getElementById('set-company-name').value = settingsState.companyName || '';
  document.getElementById('set-license-no').value = settingsState.travelAgentLicense || '';
  document.getElementById('set-email-template').value = settingsState.emailTemplate || '';
  
  // Supabase Fields
  document.getElementById('set-supabase-url').value = localStorage.getItem('supabase_url') || '';
  document.getElementById('set-supabase-key').value = localStorage.getItem('supabase_anon_key') || '';
  document.getElementById('supabase-sql-script').value = SUPABASE_SQL_SETUP_SCRIPT;
  
  renderSettingsDocsList();
  updateCloudStatusUI();
}

function renderSettingsDocsList() {
  const docContainer = document.getElementById('company-doc-list');
  docContainer.innerHTML = '';
  
  const docs = settingsState.companyDocs || [];
  if (docs.length === 0) {
    docContainer.innerHTML = `<span style="font-size:11px;color:var(--text-muted);">ยังไม่ได้อัปโหลดเอกสารบริษัท</span>`;
    return;
  }
  
  docs.forEach((doc, idx) => {
    const item = document.createElement('div');
    item.className = 'doc-attach-item';
    item.innerHTML = `
      <div class="doc-attach-name">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span>${doc.name}</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button type="button" class="btn btn-secondary btn-icon" onclick="downloadBase64File('${doc.data}', '${doc.name}')" title="ดาวน์โหลดไฟล์">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
        </button>
        <button type="button" class="btn btn-danger btn-icon" onclick="deleteSettingsDoc(${idx})" title="ลบไฟล์">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    docContainer.appendChild(item);
  });
}

// Render Price Analytics
function renderPriceAnalytics() {
  const prov = document.getElementById('analytics-filter-province').value;
  const area = document.getElementById('analytics-filter-area').value;
  
  const placeholder = document.getElementById('analytics-placeholder');
  const contentView = document.getElementById('analytics-content-view');
  
  if (!prov || !area) {
    placeholder.style.display = 'flex';
    contentView.style.display = 'none';
    return;
  }
  
  placeholder.style.display = 'none';
  contentView.style.display = 'block';
  
  // Find hotels in this area
  const areaHotels = hotelsState.filter(h => h.province === prov && h.area === area);
  
  const tbody = document.getElementById('analysis-tbody');
  tbody.innerHTML = '';
  
  const chartContainer = document.getElementById('price-bar-chart');
  chartContainer.innerHTML = '';
  
  if (areaHotels.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">ไม่พบข้อมูลโรงแรมในพื้นที่ท่องเที่ยวนี้</td></tr>`;
    document.getElementById('analysis-cheapest-hotel').textContent = '-';
    document.getElementById('analysis-cheapest-price').textContent = '0 บาท';
    document.getElementById('analysis-expensive-hotel').textContent = '-';
    document.getElementById('analysis-expensive-price').textContent = '0 บาท';
    document.getElementById('analysis-average-price').textContent = '0 บาท';
    document.getElementById('analysis-hotel-count').textContent = 'จากทั้งหมด 0 โรงแรม';
    return;
  }
  
  // Resolve active price rate for each hotel
  const analysisData = areaHotels.map(hotel => {
    const rates = getHotelActiveRates(hotel.id);
    
    const mainPrice = rates.activeMainRate;
    const promoPrice = rates.activePromoRate;
    const activePrice = mainPrice || promoPrice;
    
    let priceType = promoPrice ? 'Promo' : (mainPrice ? 'Main' : '');
    let statusText = promoPrice ? 'โปรโมชั่น' : (mainPrice ? 'ปกติ' : 'ไม่มีสัญญา');
    
    if (!activePrice) return null;
    
    return {
      hotel,
      price: mainPrice || promoPrice,
      mainPrice,
      promoPrice,
      priceType,
      statusText
    };
  }).filter(item => item !== null);
  
  // Sort from cheapest to most expensive
  analysisData.sort((a, b) => a.price - b.price);
  
  if (analysisData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">ยังไม่มีสัญญาราคาห้องพักที่เปิดใช้งานอยู่ ณ ช่วงนี้ในพื้นที่ดังกล่าว</td></tr>`;
    return;
  }
  
  // Metrics calculation
    const cheapestItem = analysisData[0];
    const expensiveItem = analysisData[analysisData.length - 1];

    const cheapestPrice = cheapestItem.price;
    const expensivePrice = expensiveItem.price;

    const sumPrice = analysisData.reduce((sum, item) => sum + (item.mainPrice || item.price), 0);
    const avgPrice = Math.round(sumPrice / analysisData.length);

    document.getElementById('analysis-cheapest-hotel').textContent = cheapestItem.hotel.name;
    document.getElementById('analysis-cheapest-price').textContent = `${Number(cheapestPrice).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
    document.getElementById('analysis-expensive-hotel').textContent = expensiveItem.hotel.name;
    document.getElementById('analysis-expensive-price').textContent = `${Number(expensivePrice).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
    document.getElementById('analysis-average-price').textContent = `${Number(avgPrice).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`;
    document.getElementById('analysis-hotel-count').textContent = `จากทั้งหมด ${analysisData.length} โรงแรมที่มีราคาแอคทีฟ`;

    // Render Comparison Table rows
    analysisData.forEach(item => {
        const tr = document.createElement('tr');
        const priceDiff = item.price - cheapestPrice;

        let diffText = '';
        if (priceDiff === 0) {
            diffText = `<span style="color:var(--color-success); font-weight:600;">ต่ำสุด</span>`;
        } else {
            diffText = `<span style="color:var(--color-warning);">+${Number(priceDiff).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>`;
        }

        tr.innerHTML = `
            <td class="hotel-name-cell">${item.hotel.name}</td>
            <td>${'★'.repeat(item.hotel.stars)}</td>
            <td style="font-weight:600;">${Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บ.</td>
            <td>${diffText}</td>
            <td><span class="badge ${item.priceType === 'Promo' ? 'badge-info' : 'badge-success'}">${item.statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
  
  // Render Custom SVG-based Bar Chart (responsive)
  const maxVal = Math.max(...analysisData.map(item => Math.max(item.mainPrice || 0, item.promoPrice || 0))) * 1.1 || 1000;
  
  // Add chart grid lines & y-axis
const yAxisDiv = document.createElement('div');
  yAxisDiv.className = 'chart-y-axis';
  yAxisDiv.innerHTML = `
    <div>${Number(maxVal).toLocaleString('th-TH')} บ.</div>
    <div>${Number(maxVal / 2).toLocaleString('th-TH')} บ.</div>
    <div>0 บ.</div>
  `;
  chartContainer.appendChild(yAxisDiv);
  
  // วาดเส้นกริดไลน์
  const gridLine50 = document.createElement('div');
  gridLine50.className = 'chart-grid-line';
  gridLine50.style.bottom = '155px';
  chartContainer.appendChild(gridLine50);
  
  const gridLine100 = document.createElement('div');
  gridLine100.className = 'chart-grid-line';
  gridLine100.style.bottom = '280px';
  chartContainer.appendChild(gridLine100);
  
  // ลูปสร้างแท่งกราฟแบบซ้อนกัน
  const total = analysisData.length;
  analysisData.forEach((item, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-bar-wrapper';
    
    // คำนวณสีตามตำแหน่ง: ถูก=เขียว, กลาง=เหลือง, แพง=แดง
    function getBarColorClass(idx, tot) {
      const ratio = tot > 1 ? idx / (tot - 1) : 0;
      if (ratio <= 0.25) return 'cheap';
      if (ratio <= 0.55) return 'mid';
      if (ratio <= 0.8) return 'pricey';
      return 'expensive';
    }
    const barColorClass = getBarColorClass(index, total);
    
    // คำนวณความสูงหลอดราคาปกติ (Main)
    const mainPriceVal = item.mainPrice || item.price;
    const maxVal2 = Math.max(...analysisData.map(d => Math.max(d.mainPrice || 0, d.promoPrice || 0, d.price || 0))) * 1.15 || 1000;
    const mainPercent = Math.round((mainPriceVal / maxVal2) * 100);
    const mainBarHeight = Math.max(8, Math.round(mainPercent * 2.2));
    
    // คำนวณความสูงหลอดราคาโปรโมชั่น (Promo) (ถ้ามี)
    let promoHtml = '';
    const promoVal = item.promoPrice;
    if (promoVal) {
      const promoPercent = Math.round((promoVal / maxVal2) * 100);
      const promoBarHeight = Math.max(5, Math.round(promoPercent * 2.2));
      
      promoHtml = `
        <div class="chart-bar-promo-inside" style="height:${promoBarHeight}px; opacity:0.85;" title="ราคาโปรโมชั่น: ${Number(promoVal).toLocaleString('th-TH')} บาท">
          <span class="promo-inside-value">${Number(promoVal).toLocaleString('th-TH')}</span>
        </div>
      `;
    }
    
    wrapper.innerHTML = `
      <span class="chart-bar-value" style="font-weight: 600; color: var(--text-secondary);">
        ${Number(mainPriceVal).toLocaleString('th-TH')}
      </span>
      <div class="chart-bar ${barColorClass}" style="height:${mainBarHeight}px; position: relative;" title="${item.hotel.name}: ${Number(mainPriceVal).toLocaleString('th-TH')} บาท">
        ${promoHtml}
      </div>
      <span class="chart-bar-label" title="${item.hotel.name}">${item.hotel.name}</span>
    `;
    chartContainer.appendChild(wrapper);
  });
}

// Initiate Contract Renewal (Email Generator trigger)
async function initiateRenewal(contractId) {
  const contract = contractsState.find(c => c.id === contractId);
  if (!contract) return;
  
  const hotel = hotelsState.find(h => h.id === contract.hotelId);
  if (!hotel) return;
  
  // Prepare Email Template variables
  let bodyText = settingsState.emailTemplate || '';
  bodyText = bodyText.replace(/{hotelName}/g, hotel.name);
  bodyText = bodyText.replace(/{companyName}/g, settingsState.companyName);
  bodyText = bodyText.replace(/{licenseNumber}/g, settingsState.travelAgentLicense);
  
  const typeLabel = contract.type === 'main' ? 'Main Contract' : 'Promotion';
  let subjectText = settingsState.emailSubject || 'ขอความอนุเคราะห์ต่อสัญญาอัตราห้องพัก - {hotelName}';
  subjectText = subjectText.replace(/{hotelName}/g, hotel.name || '');
  subjectText = subjectText.replace(/{companyName}/g, settingsState.companyName || '');
  subjectText = subjectText.replace(/{contractType}/g, typeLabel);
  
  // Pre-fill fields in Email modal
  document.getElementById('email-to').value = hotel.email || '';
  document.getElementById('email-cc').value = hotel.cc || '';
  document.getElementById('email-subject').value = subjectText;
  document.getElementById('email-body').value = bodyText;
  document.getElementById('email-renewal-target-hotel').textContent = `สัญญาที่อ้างอิง: ${hotel.name} (${typeLabel} หมดอายุวันที่: ${formatDateThai(contract.endDate)})`;
  
  // Populate company documents in the attachment info sidebar
  const docsList = document.getElementById('email-attached-docs-list');
  docsList.innerHTML = '';
  
  if (settingsState.companyDocs && settingsState.companyDocs.length > 0) {
    settingsState.companyDocs.forEach(doc => {
      const item = document.createElement('div');
      item.className = 'doc-attach-item';
      item.innerHTML = `
        <div class="doc-attach-name">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span style="max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${doc.name}">${doc.name}</span>
        </div>
        <button type="button" class="btn btn-secondary btn-icon" onclick="downloadBase64File('${doc.data}', '${doc.name}')" title="ดาวน์โหลดไฟล์แนบ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
        </button>
      `;
      docsList.appendChild(item);
    });
  } else {
    docsList.innerHTML = `<span style="font-size:11px;color:var(--text-muted);">ยังไม่มีเอกสารบริษัทแนบในหน้าตั้งค่า</span>`;
  }
  
  // Setup Send Event Listeners with updated fields
  const triggerGmail = document.getElementById('btn-send-gmail');
  const triggerOutlook = document.getElementById('btn-send-outlook');
  
  // Remove old listeners by replacing nodes
  const newGmailBtn = triggerGmail.cloneNode(true);
  const newOutlookBtn = triggerOutlook.cloneNode(true);
  
  triggerGmail.parentNode.replaceChild(newGmailBtn, triggerGmail);
  triggerOutlook.parentNode.replaceChild(newOutlookBtn, triggerOutlook);
  
  newGmailBtn.addEventListener('click', () => sendEmailAction('gmail', contract.id));
  newOutlookBtn.addEventListener('click', () => sendEmailAction('outlook', contract.id));
  
  // Close any details modal and open email modal
  closeModal('modal-hotel-details');
  openModal('modal-email-renewal');
}

// Perform Email Send (Redirecting to Gmail Web or Outlook mailto client)
async function sendEmailAction(clientType, contractId) {
  const to = document.getElementById('email-to').value;
  const cc = document.getElementById('email-cc').value;
  const subject = document.getElementById('email-subject').value;
  const body = document.getElementById('email-body').value;
  
  // Copy body to clipboard as fallback/convenience
  try {
    await navigator.clipboard.writeText(body);
    showToast('คัดลอกเนื้อความจดหมายลงคลิปบอร์ดแล้ว!');
  } catch (err) {
    console.warn('Could not copy to clipboard:', err);
  }
  
  let targetUrl = '';
  
  if (clientType === 'gmail') {
    targetUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  } else {
    targetUrl = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  
  // Open mail composer in new window/tab
  window.open(targetUrl, '_blank');
  
  // Log / Update status in DB if contract exists
  const contract = contractsState.find(c => c.id === contractId);
  if (contract) {
    contract.status = 'Renewing'; // Update in memory
    await putItem('contracts', contract); // Update in DB
    await refreshState();
  }
  
  closeModal('modal-email-renewal');
  renderDashboard();
  showToast('เปิดหน้าต่างเขียนจดหมายขอต่อสัญญาแล้ว!');
}

// Form Event Listeners Setup
function initFormListeners() {
  
  // 1. Form: Add/Edit Location
  const formLocation = document.getElementById('form-location');
  formLocation.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const province = document.getElementById('loc-province').value.trim();
    const area = document.getElementById('loc-area').value.trim();
    
    if (!province || !area) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', true);
      return;
    }
    
    // Check if location already exists
    const duplicate = locationsState.find(l => 
      l.province.toLowerCase() === province.toLowerCase() && 
      l.area.toLowerCase() === area.toLowerCase()
    );
    
    if (duplicate) {
      showToast('มีพื้นที่นี้ในระบบอยู่แล้ว', true);
      return;
    }
    
    const newLoc = {
      id: 'loc-' + Date.now(),
      province,
      area
    };
    
    await putItem('locations', newLoc);
    await refreshState();
    
    // Reset form & reload views
    formLocation.reset();
    renderLocationsList();
    populateSelectDropdowns();
    showToast('บันทึกพื้นที่ย่อยสำเร็จ!');
  });
  
  // 2. Form: Add/Edit Hotel
  const formHotel = document.getElementById('form-hotel');
  formHotel.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const id = document.getElementById('hotel-id').value;
    const name = document.getElementById('hotel-name').value.trim();
    const stars = parseInt(document.getElementById('hotel-stars').value);
    const province = document.getElementById('hotel-province').value;
    const area = document.getElementById('hotel-area').value;
    const email = document.getElementById('hotel-sales-email').value.trim();
    const cc = document.getElementById('hotel-sales-cc').value.trim();
    const lineId = document.getElementById('hotel-line-id').value.trim();
    
    if (!name || !province || !area) {
      showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', true);
      return;
    }
    
    const hotelData = {
      id: id || 'hotel-' + Date.now(),
      name,
      stars,
      province,
      area,
      email,
      cc,
      lineId
    };
    
    await putItem('hotels', hotelData);
    await refreshState();
    
    formHotel.reset();
    closeModal('modal-hotel');
    renderHotelsList();
    renderDashboard();
    
    showToast(id ? 'ปรับปรุงข้อมูลโรงแรมสำเร็จ!' : 'บันทึกข้อมูลโรงแรมใหม่สำเร็จ!');
  });
  
  // Event: Add Hotel Button clicked
  document.getElementById('btn-add-hotel').addEventListener('click', () => {
    document.getElementById('hotel-id').value = '';
    document.getElementById('hotel-modal-title').textContent = 'เพิ่มโรงแรมใหม่';
    document.getElementById('form-hotel').reset();
    document.getElementById('hotel-area').innerHTML = '<option value="">-- กรุณาเลือกจังหวัดก่อน --</option>';
    openModal('modal-hotel');
  });
  
  // 3. Form: Add/Edit Contract
  const formContract = document.getElementById('form-contract');
  let contractAttachedFileBase64 = null;
  let contractAttachedFileName = null;
  let contractAttachedFileType = null;
  
  // Show/hide Stay Date section based on contract type
  const contractTypeSelect = document.getElementById('contract-type');
  const stayDateSection = document.getElementById('stay-date-section');
  contractTypeSelect.addEventListener('change', () => {
    if (contractTypeSelect.value === 'promo') {
      stayDateSection.classList.add('visible');
    } else {
      stayDateSection.classList.remove('visible');
      document.getElementById('contract-stay-start').value = '';
      document.getElementById('contract-stay-end').value = '';
    }
  });
  
  // Drag zone file drop listeners
  const dropzone = document.getElementById('contract-file-dropzone');
  const fileInput = document.getElementById('contract-file');
  
  fileInput.addEventListener('change', (e) => {
    handleContractFileSelect(e.target.files[0]);
  });
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-purple)';
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    if (e.dataTransfer.files.length > 0) {
      handleContractFileSelect(e.dataTransfer.files[0]);
    }
  });
  
  // Image compression via Canvas API
  function compressImage(file, callback) {
    const maxDim = 1600;
    const quality = 0.72;
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let w = img.width, h = img.height;
        if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
        if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedData = canvas.toDataURL('image/jpeg', quality);
        // Rename to .jpg if needed
        const newName = file.name.replace(/\.(png|webp|bmp|gif)$/i, '.jpg');
        callback(compressedData, newName);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  
  function handleContractFileSelect(file) {
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    // PDF size check: reject if > 2MB
    if (isPdf && file.size > 2 * 1024 * 1024) {
      document.getElementById('pdf-warning-popup').classList.add('active');
      document.getElementById('contract-file').value = '';
      return;
    }
    
    // Auto-compress images
    if (isImage) {
      showToast('กำลังบีบอัดรูปภาพอัตโนมัติ...');
      compressImage(file, (compressedData, newName) => {
        contractAttachedFileBase64 = compressedData;
        contractAttachedFileName = newName;
        contractAttachedFileType = 'image/jpeg';
        document.getElementById('contract-uploaded-file-name').textContent = `${newName} (บีบอัดแล้ว)`;
        document.getElementById('contract-uploaded-file-info').style.display = 'flex';
        showToast('แนบไฟล์สัญญาและบีบอัดอัตโนมัติแล้ว!');
      });
      return;
    }
    
    // Normal read (for PDF <= 2MB)
    const reader = new FileReader();
    reader.onload = function(event) {
      contractAttachedFileBase64 = event.target.result;
      contractAttachedFileName = file.name;
      contractAttachedFileType = file.type;
      document.getElementById('contract-uploaded-file-name').textContent = file.name;
      document.getElementById('contract-uploaded-file-info').style.display = 'flex';
      showToast('แนบไฟล์สัญญาห้องพักแล้ว!');
    };
    reader.readAsDataURL(file);
  }
  
  // Remove attached contract file
  document.getElementById('btn-remove-contract-file').addEventListener('click', () => {
    contractAttachedFileBase64 = null;
    contractAttachedFileName = null;
    contractAttachedFileType = null;
    
    document.getElementById('contract-file').value = '';
    document.getElementById('contract-uploaded-file-info').style.display = 'none';
    showToast('เอาไฟล์แนบออกแล้ว');
  });
  
  // Submit new contract form
  formContract.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const hotelId = document.getElementById('contract-hotel-id').value;
    const type = document.getElementById('contract-type').value;
    const rate = parseFloat(document.getElementById('contract-rate').value);
    const startDate = document.getElementById('contract-start').value;
    const endDate = document.getElementById('contract-end').value;
    const stayStartDate = document.getElementById('contract-stay-start').value;
    const stayEndDate = document.getElementById('contract-stay-end').value;
    
    if (!startDate || !endDate || isNaN(rate)) {
      showToast('กรุณากรอกระยะเวลาสัญญาและราคาเริ่มต้น', true);
      return;
    }
    
    if (startDate > endDate) {
      showToast('วันที่สิ้นสุดสัญญาต้องไม่อยู่ก่อนหน้าวันเริ่มต้น', true);
      return;
    }
    
    const newContract = {
      id: 'contract-' + Date.now(),
      hotelId,
      type,
      startDate,
      endDate,
      stayStartDate: stayStartDate || '',
      stayEndDate: stayEndDate || '',
      baseRate: rate,
      fileName: contractAttachedFileName || '',
      fileData: contractAttachedFileBase64 || '',
      fileType: contractAttachedFileType || '',
      status: 'Active'
    };
    
    await putItem('contracts', newContract);
    await refreshState();
    
    // Reset
    formContract.reset();
    contractAttachedFileBase64 = null;
    contractAttachedFileName = null;
    contractAttachedFileType = null;
    document.getElementById('contract-uploaded-file-info').style.display = 'none';
    document.getElementById('stay-date-section').classList.remove('visible');
    
    closeModal('modal-contract');
    
    // Just refresh data — do NOT reopen hotel-details modal
    renderHotelsList();
    renderDashboard();
    
    showToast('สร้างสัญญาค่าห้องพักใหม่เข้าระบบสำเร็จ!');
  });
  
  // 4. Form: Settings
  const formSettings = document.getElementById('form-settings');
  
  // Company doc upload listener
  const settingsDropzone = document.getElementById('company-doc-dropzone');
  const settingsFileInput = document.getElementById('set-company-file');
  
  settingsFileInput.addEventListener('change', (e) => {
    handleSettingsDocUpload(e.target.files[0]);
  });
  
  settingsDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    settingsDropzone.style.borderColor = 'var(--accent-purple)';
  });
  
  settingsDropzone.addEventListener('dragleave', () => {
    settingsDropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  });
  
  settingsDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    settingsDropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    if (e.dataTransfer.files.length > 0) {
      handleSettingsDocUpload(e.dataTransfer.files[0]);
    }
  });
  
  function handleSettingsDocUpload(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const newDoc = {
        name: file.name,
        data: event.target.result,
        type: file.type
      };
      
      settingsState.companyDocs = settingsState.companyDocs || [];
      settingsState.companyDocs.push(newDoc);
      
      renderSettingsDocsList();
      showToast('อัปโหลดและบันทึกเอกสารของบริษัทแล้ว!');
    };
    reader.readAsDataURL(file);
  }
  
  // Global reference function to delete settings documents
  window.deleteSettingsDoc = function(index) {
    if (confirm('คุณต้องการลบเอกสารรับรองบริษัทนี้ใช่หรือไม่?')) {
      settingsState.companyDocs.splice(index, 1);
      renderSettingsDocsList();
      showToast('ลบเอกสารสำเร็จ');
    }
  };
  
  // Save settings
  formSettings.addEventListener('submit', async (event) => {
    event.preventDefault();

    const companyName = document.getElementById('set-company-name').value.trim();
    const travelAgentLicense = document.getElementById('set-license-no').value.trim();
    const emailTemplate = document.getElementById('set-email-template').value;
    // 1. ดึงข้อมูลหัวข้อเรื่องอีเมลจากกล่องรับค่าที่เราเพิ่งเพิ่มเข้าไปใหม่
    const emailSubject = document.getElementById('email-subject-input').value.trim();

    settingsState.companyName = companyName;
    settingsState.travelAgentLicense = travelAgentLicense;
    settingsState.emailTemplate = emailTemplate;
    // 2. เก็บหัวเรื่องอีเมลเข้าตัวแปรส่วนกลาง (State) เพื่อรอเซฟลงฐานข้อมูล
    settingsState.emailSubject = emailSubject;

    await putItem('settings', {
        id: 'company_settings',
        ...settingsState
    });

    await refreshState();
    showToast('บันทึกการตั้งค่าบริษัทและแม่แบบเมลเรียบร้อย!');
});
}

// Settings: Cloud Sync Configuration Listeners
function initCloudSettingsListeners() {
  const saveCloudBtn = document.getElementById('btn-save-supabase');
  const disconnectCloudBtn = document.getElementById('btn-disconnect-supabase');
  const syncCloudBtn = document.getElementById('btn-sync-to-cloud');
  const copySqlBtn = document.getElementById('btn-copy-sql');
  
  // 1. Connect & Save
  saveCloudBtn.addEventListener('click', async () => {
    const url = document.getElementById('set-supabase-url').value.trim();
    const key = document.getElementById('set-supabase-key').value.trim();
    
    if (!url || !key) {
      showToast('กรุณากรอก URL และ Anon Key ให้ครบถ้วน', true);
      return;
    }
    
    saveCloudBtn.textContent = 'กำลังตรวจสอบการเชื่อมต่อ...';
    saveCloudBtn.setAttribute('disabled', 'true');
    
    const testResult = await testSupabaseConnection(url, key);
    
    saveCloudBtn.removeAttribute('disabled');
    
    if (testResult === 'CONNECTED' || testResult === 'TABLES_MISSING') {
      // Save keys in localStorage
      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_anon_key', key);
      
      // Init
      initSupabase('https://cdufyjctkyruxyvyuwgl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdWZ5amN0a3lydXh5dnl1d2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDM3ODYsImV4cCI6MjA5NjIxOTc4Nn0.CW7qUvlBw6ucPXmcyj1vkhDC-sXvxNN0UGQSIAf3mDo');
      updateCloudStatusUI();
      
      if (testResult === 'TABLES_MISSING') {
        showToast('เชื่อมต่อ API สำเร็จ! แต่ยังไม่มีโครงสร้างตารางข้อมูลในคลาวด์ โปรดนำสคริปต์ SQL ด้านล่างไปรัน', true);
      } else {
        showToast('เชื่อมต่อ Supabase Cloud Database สำเร็จ! ระบบออนไลน์แล้ว');
      }
      
      // Load cloud data
      await refreshState();
      renderDashboard();
      populateSelectDropdowns();
    } else {
      showToast('ไม่สามารถเชื่อมต่อได้! โปรดตรวจสอบ URL, Key และสัญญาณอินเทอร์เน็ต', true);
      saveCloudBtn.textContent = 'เชื่อมต่อและเปิดใช้ระบบคลาวด์';
    }
  });
  
  // 2. Disconnect
  disconnectCloudBtn.addEventListener('click', async () => {
    if (confirm('คุณต้องการปิดการใช้งานระบบคลาวด์ออนไลน์ และกลับไปใช้ข้อมูลออฟไลน์ในเครื่องใช่หรือไม่?')) {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
      
      initSupabase(null, null);
      updateCloudStatusUI();
      
      showToast('ปิดระบบคลาวด์แล้ว สลับกลับมาใช้งานฐานข้อมูลออฟไลน์ในเครื่อง');
      
      // Reload local data
      await refreshState();
      renderDashboard();
      populateSelectDropdowns();
    }
  });
  
  // 3. Sync local data to cloud (Migration)
  syncCloudBtn.addEventListener('click', async () => {
    if (!isCloudEnabled()) return;
    
    if (!confirm('ยืนยันย้ายข้อมูลเดิมในเครื่องนี้ขึ้นระบบคลาวด์? (ข้อมูลที่ชื่อซ้ำกันจะได้รับการอัปเดต/เขียนทับในคลาวด์)')) {
      return;
    }
    
    syncCloudBtn.textContent = 'กำลังจัดเตรียมข้อมูล...';
    syncCloudBtn.setAttribute('disabled', 'true');
    
    try {
      // Read directly from local IndexedDB (without Supabase intercepting)
      // We temporarily bypass client or use native indexedDB values which are in local memory states loaded on offline startup
      // To guarantee we sync localIndexedDB, we fetch all items from local variables which were refreshed or we read them directly.
      // Since local states are loaded, we can upload them
      
      // 1. Sync locations
      showToast('กำลังย้ายข้อมูลพื้นที่ท่องเที่ยว...');
      for (const loc of locationsState) {
        // Force write to supabase using supabase client
        await supabaseClient.from('locations').upsert(loc);
      }
      
      // 2. Sync hotels
      showToast('กำลังย้ายข้อมูลโรงแรม...');
      for (const hotel of hotelsState) {
        await supabaseClient.from('hotels').upsert(hotel);
      }
      
      // 3. Sync contracts
      showToast('กำลังย้ายเอกสารสัญญาทั้งหมด (อาจใช้เวลาเนื่องจากมีไฟล์แนบ)...');
      for (const contract of contractsState) {
        await supabaseClient.from('contracts').upsert(contract);
      }
      
      // 4. Sync Settings
      showToast('กำลังย้ายการตั้งค่าจดหมายและใบอนุญาต...');
      await supabaseClient.from('settings').upsert({
        id: 'company_settings',
        ...settingsState
      });
      
      showToast('การย้ายข้อมูลขึ้นระบบคลาวด์เรียบร้อยสมบูรณ์!');
      
      // Refresh
      await refreshState();
      renderDashboard();
      populateSelectDropdowns();
    } catch (err) {
      console.error('Migration failed:', err);
      showToast('การซิงก์ข้อมูลล้มเหลว: ' + err.message, true);
    } finally {
      syncCloudBtn.textContent = 'อัปโหลดข้อมูลเดิมในเครื่องขึ้นระบบคลาวด์ (Sync Data to Cloud)';
      syncCloudBtn.removeAttribute('disabled');
    }
  });
  
  // 4. Copy SQL
  copySqlBtn.addEventListener('click', async () => {
    try {
      const sqlText = document.getElementById('supabase-sql-script').value;
      await navigator.clipboard.writeText(sqlText);
      showToast('คัดลอกสคริปต์ SQL ลงคลิปบอร์ดแล้ว! นำไปวางใน SQL Editor ของ Supabase ได้เลย');
    } catch (err) {
      showToast('ไม่สามารถคัดลอกได้โดยอัตโนมัติ', true);
    }
  });
}

// View Hotel Details & Contract History Modal
window.viewHotelDetails = function(hotelId) {
  const hotel = hotelsState.find(h => h.id === hotelId);
  if (!hotel) return;
  
  const hotelContracts = contractsState.filter(c => c.hotelId === hotelId);
  
  // Sort contracts: newer start date first
  hotelContracts.sort((a, b) => b.startDate.localeCompare(a.startDate));
  
  // Set modal text info
  document.getElementById('detail-hotel-name').textContent = hotel.name;
  document.getElementById('detail-hotel-location').textContent = `${hotel.province} / ${hotel.area}`;
  document.getElementById('detail-hotel-email').textContent = hotel.email || '-';
  document.getElementById('detail-hotel-cc').textContent = hotel.cc || '-';
  document.getElementById('detail-hotel-line').textContent = hotel.lineId || '-';
  
  // Stars rendering
  const starsContainer = document.getElementById('detail-hotel-stars');
  starsContainer.innerHTML = '★'.repeat(hotel.stars);
  
  // Render timeline cards
  const timeline = document.getElementById('detail-contract-timeline');
  timeline.innerHTML = '';
  
  if (hotelContracts.length === 0) {
    timeline.innerHTML = `<span style="font-size:12px;color:var(--text-muted);">ยังไม่มีประวัติการอัปโหลดหรือสร้างสัญญากับโรงแรมนี้</span>`;
  } else {
    hotelContracts.forEach(contract => {
      const status = calculateContractStatus(contract);
      const isMain = contract.type === 'main';
      const typeText = isMain ? 'Main Contract' : 'Promotion Rates';
      
      let dotColor = 'active';
      let statusBadge = `<span class="badge badge-success">แอคทีฟ</span>`;
      
      if (status === 'Expired') {
        dotColor = 'danger';
        statusBadge = `<span class="badge badge-danger">หมดอายุ</span>`;
      } else if (status === 'Expiring') {
        dotColor = 'warning';
        statusBadge = `<span class="badge badge-warning">ใกล้หมดอายุ</span>`;
      }
      
      const fileLink = contract.fileData 
        ? `<button class="btn btn-secondary btn-icon" onclick="viewBase64File('${contract.fileData}', '${contract.fileName}')" title="ดูไฟล์แนบสัญญา"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>`
        : `<span style="font-size:11px;color:var(--text-muted);">ไม่มีไฟล์แนบ</span>`;
        
      const item = document.createElement('div');
      item.className = 'contract-timeline-item';
      item.innerHTML = `
        <div class="contract-timeline-dot ${dotColor}"></div>
        <div class="contract-timeline-card">
          <div class="contract-timeline-header">
            <div class="contract-timeline-title" style="font-weight:700;">${typeText}</div>
            ${statusBadge}
          </div>
          <div class="contract-timeline-dates">
            ${contract.type === 'promo'
              ? 'ช่วงจอง'
              : 'ระยะเวลา'}:
            ${formatDateThai(contract.startDate)}
            ถึง
            ${formatDateThai(contract.endDate)}
          </div>

          ${contract.type === 'promo' &&
            contract.stayStartDate &&
            contract.stayEndDate ? `
          <div class="contract-timeline-stay">
            ช่วงเข้าพัก: ${formatDateThai(contract.stayStartDate)}
            ถึง
            ${formatDateThai(contract.stayEndDate)}
          </div>
          ` : ''}

          <div class="contract-timeline-rate">
            ราคาห้องเริ่มต้น: ${Number(contract.baseRate).toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} บาท
          </div>
          <div class="contract-timeline-actions">
            ${fileLink}
            <button class="btn btn-danger btn-icon" onclick="deleteContractClick('${contract.id}', '${hotel.id}')" title="ลบสัญญา">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
      timeline.appendChild(item);
    });
  }
  
  // Set details action buttons
  const addContractBtn = document.getElementById('btn-detail-add-contract');
  const sendEmailBtn = document.getElementById('btn-detail-send-email');
  
  // Re-bind actions
  const newAddBtn = addContractBtn.cloneNode(true);
  const newEmailBtn = sendEmailBtn.cloneNode(true);
  
  addContractBtn.parentNode.replaceChild(newAddBtn, addContractBtn);
  sendEmailBtn.parentNode.replaceChild(newEmailBtn, sendEmailBtn);
  
  newAddBtn.addEventListener('click', () => {
    document.getElementById('contract-id').value = '';
    document.getElementById('contract-hotel-id').value = hotel.id;
    document.getElementById('contract-hotel-display-name').textContent = hotel.name;
    document.getElementById('form-contract').reset();
    document.getElementById('contract-uploaded-file-info').style.display = 'none';
    
    // Suggest standard 1 year dates for Main
    const todayStr = CURRENT_DATE.toISOString().split('T')[0];
    const nextYear = new Date(CURRENT_DATE);
    nextYear.setFullYear(CURRENT_DATE.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];
    
    document.getElementById('contract-start').value = todayStr;
    document.getElementById('contract-end').value = nextYearStr;
    
    openModal('modal-contract');
  });
  
  newEmailBtn.addEventListener('click', () => {
    const latestContract = hotelContracts[0];
    if (latestContract) {
      initiateRenewal(latestContract.id);
    } else {
      const mockContract = { id: '', hotelId: hotel.id, type: 'main', endDate: CURRENT_DATE.toISOString().split('T')[0] };
      initiateRenewal(mockContract.id);
    }
  });
  
  openModal('modal-hotel-details');
};

// Edit Hotel profile
window.editHotel = function(hotelId) {
  const hotel = hotelsState.find(h => h.id === hotelId);
  if (!hotel) return;
  
  document.getElementById('hotel-id').value = hotel.id;
  document.getElementById('hotel-modal-title').textContent = 'แก้ไขข้อมูลโรงแรม';
  document.getElementById('hotel-name').value = hotel.name;
  document.getElementById('hotel-stars').value = hotel.stars;
  
  document.getElementById('hotel-province').value = hotel.province;
  
  // Re-build areas dropdown for modal
  const areaSelect = document.getElementById('hotel-area');
  areaSelect.innerHTML = '<option value="">-- เลือกพื้นที่ย่อย --</option>';
  
  const filteredAreas = locationsState
    .filter(l => l.province === hotel.province)
    .map(l => l.area);
  
  filteredAreas.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    if (a === hotel.area) opt.selected = true;
    areaSelect.appendChild(opt);
  });
  
  document.getElementById('hotel-sales-email').value = hotel.email || '';
  document.getElementById('hotel-sales-cc').value = hotel.cc || '';
  document.getElementById('hotel-line-id').value = hotel.lineId || '';
  
  openModal('modal-hotel');
};

// Delete Hotel
window.deleteHotelClick = async function(hotelId) {
  const hotel = hotelsState.find(h => h.id === hotelId);
  if (!hotel) return;
  
  if (confirm(`คุณต้องการลบโรงแรม "${hotel.name}" และข้อมูลราคาสัญญาที่เกี่ยวข้องทั้งหมดใช่หรือไม่?`)) {
    await deleteItem('hotels', hotelId);
    
    const relatedContracts = contractsState.filter(c => c.hotelId === hotelId);
    for (const contract of relatedContracts) {
      await deleteItem('contracts', contract.id);
    }
    
    await refreshState();
    renderHotelsList();
    renderDashboard();
    
    showToast(`ลบโรงแรม "${hotel.name}" สำเร็จ!`);
  }
};

// Delete Location
window.deleteLocationClick = async function(locId) {
  const loc = locationsState.find(l => l.id === locId);
  if (!loc) return;
  
  if (confirm(`คุณต้องการลบพื้นที่ "${loc.province} - ${loc.area}" ใช่หรือไม่?\n(คำแนะนำ: การลบอาจส่งผลต่อฟิลเตอร์รายงานของโรงแรมในพื้นที่นี้)`)) {
    await deleteItem('locations', locId);
    await refreshState();
    renderLocationsList();
    populateSelectDropdowns();
    showToast('ลบพื้นที่สำเร็จ!');
  }
};

// Delete Contract
window.deleteContractClick = async function(contractId, hotelId) {
  if (confirm('คุณแน่ใจว่าต้องการลบสัญญานี้ออกจากระบบใช่หรือไม่?')) {
    await deleteItem('contracts', contractId);
    await refreshState();
    
    viewHotelDetails(hotelId);
    renderHotelsList();
    renderDashboard();
    
    showToast('ลบสัญญาเรียบร้อย!');
  }
};

// File Helper: Download Base64 File to Local Storage
window.downloadBase64File = function(base64Data, filename) {
  if (!base64Data) {
    showToast('ไม่มีไฟล์ข้อมูลในระบบ', true);
    return;
  }
  
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`ดาวน์โหลดไฟล์ "${filename}" สำเร็จ!`);
};

// Backup System: Export JSON
function initBackupListeners() {
  document.getElementById('btn-export-db').addEventListener('click', async () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        locations: locationsState,
        hotels: hotelsState,
        contracts: contractsState,
        settings: settingsState
      };
      
      const jsonStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
      
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `hotel_contracts_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('สำรองไฟล์ข้อมูลฐานข้อมูล (Export JSON) สำเร็จ!');
    } catch (err) {
      showToast('ไม่สามารถสำรองข้อมูลได้: ' + err, true);
    }
  });
  
  // Backup System: Import JSON
  const fileInput = document.getElementById('import-db-file');
  document.getElementById('btn-trigger-import').addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('คำเตือน: การนำเข้าข้อมูลไฟล์ใหม่จะเขียนทับฐานข้อมูลเดิมทั้งหมด! ต้องการดำเนินการต่อใช่หรือไม่?')) {
      fileInput.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const imported = JSON.parse(e.target.result);
        
        if (!imported.locations || !imported.hotels || !imported.contracts || !imported.settings) {
          throw new Error('โครงสร้างไฟล์สำรองไม่ถูกต้อง');
        }
        
        await clearStore('locations');
        await clearStore('hotels');
        await clearStore('contracts');
        await clearStore('settings');
        
        for (const loc of imported.locations) {
          await putItem('locations', loc);
        }
        for (const hotel of imported.hotels) {
          await putItem('hotels', hotel);
        }
        for (const contract of imported.contracts) {
          await putItem('contracts', contract);
        }
        await putItem('settings', imported.settings);
        
        showToast('กู้คืนฐานข้อมูลจากไฟล์สำรองสำเร็จ! กำลังรีโหลด...');
        setTimeout(() => {
          location.reload();
        }, 1500);
        
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการนำเข้าไฟล์: ' + err.message, true);
        fileInput.value = '';
      }
    };
    reader.readAsText(file);
  });
}

// Utility: Format Date to Thai locale (e.g. 05 มิ.ย. 2569)
function formatDateThai(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const monthsThai = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  
  const day = parseInt(parts[2]);
  const month = monthsThai[parseInt(parts[1]) - 1];
  const year = parseInt(parts[0]) + 543; // Convert to Buddhist Era (B.E.)
  
  return `${day} ${month} ${year}`;
}

// ============================================================
// FILE VIEWER (Eye Icon)
// ============================================================
window.viewBase64File = function(base64Data, filename) {
  if (!base64Data) {
    showToast('ไม่มีไฟล์ข้อมูลในระบบ', true);
    return;
  }
  
  const viewer = document.getElementById('file-viewer-overlay');
  const titleEl = document.getElementById('file-viewer-title');
  const contentEl = document.getElementById('file-viewer-content');
  const downloadBtn = document.getElementById('btn-file-viewer-download');
  
  titleEl.textContent = filename || 'ไฟล์แนบสัญญา';
  contentEl.innerHTML = '';
  
  // Set up download button
  downloadBtn.onclick = () => downloadBase64File(base64Data, filename);
  
  // Determine MIME type
  const mimeType = base64Data.split(';')[0].split(':')[1] || '';
  
  if (mimeType === 'application/pdf') {
    try {
      const byteString = atob(base64Data.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); }
      const blob = new Blob([ab], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      
      const iframe = document.createElement('iframe');
      iframe.src = blobUrl + '#toolbar=1&navpanes=1';
      iframe.style.cssText = 'width:100%;height:100%;min-height:640px;border:none;';
      contentEl.appendChild(iframe);
    } catch(e) {
      // Fallback
      const iframe = document.createElement('iframe');
      iframe.src = base64Data;
      iframe.style.cssText = 'width:100%;height:100%;min-height:640px;border:none;';
      contentEl.appendChild(iframe);
    }
  } else if (mimeType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = base64Data;
    img.alt = filename;
    contentEl.appendChild(img);
  } else {
    contentEl.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-secondary);">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:48px;height:48px;stroke:var(--text-muted);display:block;margin:0 auto 16px;">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้<br>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="downloadBase64File('${base64Data}', '${filename}')">ดาวน์โหลดไฟล์แทน</button>
    </div>`;
  }
  
  viewer.classList.add('active');
};

window.closeFileViewer = function() {
  document.getElementById('file-viewer-overlay').classList.remove('active');
  document.getElementById('file-viewer-content').innerHTML = '';
};

// ============================================================
// PDF SIZE WARNING POPUP
// ============================================================
window.closePdfWarning = function() {
  document.getElementById('pdf-warning-popup').classList.remove('active');
};

// ============================================================
// DOWNLOAD ALL DOCS (Email Modal)
// ============================================================
function initDownloadAllDocsListener() {
  const btn = document.getElementById('btn-download-all-docs');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const docs = settingsState.companyDocs || [];
    if (docs.length === 0) {
      showToast('ยังไม่มีเอกสารบริษัทในระบบ กรุณาเพิ่มในหน้าตั้งค่า', true);
      return;
    }
    docs.forEach((doc, idx) => {
      setTimeout(() => {
        downloadBase64File(doc.data, doc.name);
      }, idx * 400); // Stagger downloads
    });
    showToast(`ดาวน์โหลดไฟล์ทั้งหมด ${docs.length} ไฟล์แล้ว!`);
  });
}

// ============================================================
// AI HOTEL INSIGHTS
// ============================================================
function initAIListeners() {
  initDownloadAllDocsListener();
  
  const analyzeBtn = document.getElementById('btn-ai-analyze');
  if (!analyzeBtn) return;
  
  analyzeBtn.addEventListener('click', () => {
    const province = document.getElementById('ai-filter-province').value;
    const type = document.getElementById('ai-hotel-type').value;
    const stars = document.getElementById('ai-hotel-stars').value;
    
    if (!province) {
      showToast('กรุณาเลือกจังหวัดก่อน', true);
      return;
    }
    
    renderAIInsights(province, type, stars);
  });
}

function renderAIInsights(province, type, stars) {
  const placeholder = document.getElementById('ai-placeholder');
  const resultsSection = document.getElementById('ai-results-section');
  const grid = document.getElementById('ai-insight-grid');
  const provinceBadge = document.getElementById('ai-result-province-badge');
  const existingTbody = document.getElementById('ai-existing-tbody');
  const existingCount = document.getElementById('ai-existing-count');
  
  placeholder.style.display = 'none';
  resultsSection.style.display = 'block';
  provinceBadge.textContent = province;
  
  // Build search cards based on type
  const searchTemplates = buildSearchTemplates(province, type, stars);
  
  grid.innerHTML = '';
  searchTemplates.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'ai-hotel-card';
    
    const linksHtml = card.links.map(link => `
      <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="ai-search-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        ${link.label}
      </a>
    `).join('');
    
    cardEl.innerHTML = `
      <div class="ai-hotel-tag ${card.tagClass}">${card.tag}</div>
      <div class="ai-hotel-name">${card.title}</div>
      <div class="ai-hotel-desc">${card.desc}</div>
      <div class="ai-search-links">${linksHtml}</div>
    `;
    grid.appendChild(cardEl);
  });
  
  // Show existing hotels in province
  const existingHotels = hotelsState.filter(h => h.province === province);
  existingCount.textContent = `${existingHotels.length} โรงแรม`;
  existingTbody.innerHTML = '';
  
  if (existingHotels.length === 0) {
    existingTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">ยังไม่มีโรงแรมในจังหวัด ${province} ในระบบ</td></tr>`;
  } else {
    existingHotels.forEach(hotel => {
      const rates = getHotelActiveRates(hotel.id);
      const tr = document.createElement('tr');
      const rateText = rates.activeMainRate ? `${Number(rates.activeMainRate).toLocaleString('th-TH')} บ.` : '-';
      const contractStatus = rates.activeMainRate ? `<span class="badge badge-success">แอคทีฟ</span>` : `<span class="badge badge-danger">ไม่มีสัญญา</span>`;
      tr.innerHTML = `
        <td class="hotel-name-cell">${hotel.name}</td>
        <td>${'★'.repeat(hotel.stars)}</td>
        <td>${hotel.area}</td>
        <td style="font-weight:600;">${rateText}</td>
        <td>${contractStatus}</td>
      `;
      existingTbody.appendChild(tr);
    });
  }
}

function buildSearchTemplates(province, type, stars) {
  const starsLabel = stars ? `${stars} ดาว` : '';
  const starsQuery = stars ? `${stars} star` : '';
  const encodeProv = encodeURIComponent(province);
  
  const templates = [];
  
  // Template 1: Newly opened hotels
  if (type === 'all' || type === 'new') {
    templates.push({
      tagClass: 'new',
      tag: '✨ เปิดใหม่',
      title: `โรงแรมเปิดใหม่ใน${province} ${starsLabel}`,
      desc: `ค้นหาโรงแรมที่เพิ่งเปิดตัวใน${province} ในปี 2024-2026 เพื่อติดต่อขอสัญญาอัตราห้องพัก`,
      links: [
        {
          label: 'Google Search',
          url: `https://www.google.com/search?q=โรงแรมเปิดใหม่+${encodeProv}+${starsQuery}+2025+2026`
        },
        {
          label: 'Agoda',
          url: `https://www.agoda.com/th-th/search?city=${encodeProv}&sort=ranking&filters=new`
        },
        {
          label: 'Booking.com',
          url: `https://www.booking.com/searchresults.th.html?ss=${encodeProv}&order=class`
        }
      ]
    });
  }
  
  // Template 2: Trending/popular hotels
  if (type === 'all' || type === 'trending') {
    templates.push({
      tagClass: 'trending',
      tag: '🔥 กำลังมาแรง',
      title: `โรงแรมยอดนิยม Trending ใน${province}`,
      desc: `ค้นหาโรงแรมที่กำลังได้รับความนิยมและมีรีวิวดีใน${province} ในช่วงนี้`,
      links: [
        {
          label: 'Google Trends',
          url: `https://www.google.com/search?q=โรงแรมยอดนิยม+${encodeProv}+2025+${starsQuery}`
        },
        {
          label: 'TripAdvisor',
          url: `https://www.tripadvisor.com/Search?q=${encodeProv}+hotel+${starsQuery}`
        },
        {
          label: 'Pantip',
          url: `https://pantip.com/search?q=โรงแรม+${encodeProv}+แนะนำ`
        }
      ]
    });
  }
  
  // Template 3: Recently renovated
  if (type === 'all' || type === 'renovated') {
    templates.push({
      tagClass: 'renovated',
      tag: '🔨 รีโนเวทใหม่',
      title: `โรงแรมปรับปรุงใหม่ใน${province}`,
      desc: `ค้นหาโรงแรมที่เพิ่งรีโนเวทหรือปรับปรุงใน${province} ซึ่งมักจะมีราคาสัญญาที่น่าสนใจ`,
      links: [
        {
          label: 'Google Search',
          url: `https://www.google.com/search?q=โรงแรม+รีโนเวท+${encodeProv}+2025+${starsQuery}`
        },
        {
          label: 'Facebook',
          url: `https://www.facebook.com/search/pages/?q=โรงแรม${encodeProv}รีโนเวท`
        }
      ]
    });
  }
  
  // Template 4: Not in system yet (compare with existing)
  const existingNames = hotelsState.filter(h => h.province === province).map(h => h.name);
  templates.push({
    tagClass: 'popular',
    tag: '📊 ยังไม่มีในระบบ',
    title: `ค้นหาโรงแรมใน${province}ที่ยังไม่ได้ทำสัญญา`,
    desc: `มีโรงแรมใน${province} ในระบบ ${existingNames.length} แห่งแล้ว ลองค้นหาโรงแรมอื่นๆ ที่ยังไม่ได้ทำสัญญากับเรา`,
    links: [
      {
        label: 'Google Maps',
        url: `https://www.google.com/maps/search/โรงแรม+${encodeProv}+${starsQuery}`
      },
      {
        label: 'Expedia TH',
        url: `https://www.expedia.co.th/Hotels-${encodeProv}.d.Travel-Guide-Hotels`
      },
      {
        label: 'Hotels.com',
        url: `https://th.hotels.com/search.do?q-destination=${encodeProv}`
      }
    ]
  });
  
  // Template 5: Room rate research
  templates.push({
    tagClass: 'trending',
    tag: '💰 วิเคราะห์ราคา',
    title: `ราคาห้องพักโรงแรมใน${province}`,
    desc: `เปรียบเทียบราคาห้องพัก${starsLabel}ใน${province} เพื่อวิเคราะห์ระดับราคาที่เหมาะสมในการเจรจาสัญญา`,
    links: [
      {
        label: 'Google Hotels',
        url: `https://www.google.com/travel/hotels/${encodeProv}`
      },
      {
        label: 'Agoda ราคา',
        url: `https://www.agoda.com/th-th/search?city=${encodeProv}&sort=price&star=${stars || ''}`
      }
    ]
  });
  
  return templates;
}

// Add shake animation to CSS dynamically
(function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shakeError {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-10px); }
      40% { transform: translateX(10px); }
      60% { transform: translateX(-6px); }
      80% { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(style);
})();

