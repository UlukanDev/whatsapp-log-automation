let adminToken = sessionStorage.getItem('admin_token') || null;
let allPersonnel = [];

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
});

// Admin Auth Initialization
function initAdminAuth() {
  const modal = document.getElementById('admin-login-modal');
  if (adminToken === 'admin_session_bayro3100') {
    modal.classList.add('hidden');
    fetchAccountingData();
    fetchPersonnelPasswords();
  } else {
    modal.classList.remove('hidden');
  }
}

// Handle Admin Master Password Login
async function handleAdminLogin(e) {
  e.preventDefault();
  const passEl = document.getElementById('admin-master-password');
  const alertEl = document.getElementById('admin-login-alert');
  const btnSubmit = document.getElementById('btn-admin-login');

  const password = passEl.value.trim();

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Doğrulanıyor...';
  alertEl.classList.add('hidden');

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (data.success) {
      adminToken = data.token;
      sessionStorage.setItem('admin_token', adminToken);
      document.getElementById('admin-login-modal').classList.add('hidden');
      fetchAccountingData();
      fetchPersonnelPasswords();
    } else {
      alertEl.textContent = data.error || 'Hatalı Admin Şifresi!';
      alertEl.classList.remove('hidden');
    }
  } catch (err) {
    alertEl.textContent = 'Sunucuya bağlanılamadı.';
    alertEl.classList.remove('hidden');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Panele Giriş Yap';
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('admin_token');
  adminToken = null;
  location.reload();
}

// Switch Dashboard Tabs
function switchTab(tabName) {
  const tabAcc = document.getElementById('tab-accounting');
  const tabPass = document.getElementById('tab-passwords');
  const secAcc = document.getElementById('section-accounting');
  const secPass = document.getElementById('section-passwords');

  if (tabName === 'accounting') {
    tabAcc.classList.add('active');
    tabPass.classList.remove('active');
    secAcc.classList.add('active');
    secAcc.classList.remove('hidden');
    secPass.classList.add('hidden');
    secPass.classList.remove('active');
    fetchAccountingData();
  } else {
    tabPass.classList.add('active');
    tabAcc.classList.remove('active');
    secPass.classList.add('active');
    secPass.classList.remove('hidden');
    secAcc.classList.add('hidden');
    secAcc.classList.remove('active');
    fetchPersonnelPasswords();
  }
}

// Fetch Accounting Data from Backend API
async function fetchAccountingData() {
  if (!adminToken) return;

  try {
    const res = await fetch('/api/admin/accounting', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const data = await res.json();

    if (data.success) {
      renderAccountingSummary(data.summary);
      renderAdminBreakdown(data.adminBreakdown, data.summary.totalTrades);
    }
  } catch (err) {
    console.error('Accounting data fetch error:', err);
  }
}

// Render Top Stat Cards
function renderAccountingSummary(summary) {
  document.getElementById('stat-buy-bgl').textContent = `${formatNumber(summary.totalBuyAmount)} bgl`;
  document.getElementById('stat-buy-tl').textContent = `${formatNumber(summary.totalBuyPrice)} TL harcandı`;

  document.getElementById('stat-sold-bgl').textContent = `${formatNumber(summary.totalSoldAmount)} bgl`;
  document.getElementById('stat-sold-tl').textContent = `${formatNumber(summary.totalSoldPrice)} TL tahsil edildi`;

  const profitEl = document.getElementById('stat-net-profit');
  profitEl.textContent = `${summary.totalProfit >= 0 ? '+' : ''}${formatNumber(summary.totalProfit)} TL`;
  profitEl.className = summary.totalProfit >= 0 ? 'text-green' : 'text-red';

  document.getElementById('stat-total-trades').textContent = `${summary.totalTrades} adet işlem kaydı`;
}

// Render Admin Breakdown Table
function renderAdminBreakdown(breakdown, totalTradesCount) {
  const tbody = document.getElementById('accounting-tbody');

  if (!breakdown || breakdown.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center empty-state">Henüz muhasebe kaydı bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = breakdown.map(item => {
    const tradeShare = totalTradesCount > 0 ? ((item.totalTrades / totalTradesCount) * 100).toFixed(1) : 0;
    const profitFormatted = item.soldProfit >= 0 ? `+${formatNumber(item.soldProfit)} TL` : `${formatNumber(item.soldProfit)} TL`;

    return `
      <tr>
        <td style="font-weight: 600; color: #60a5fa;">
          <i class="fa-solid fa-user-tie"></i> ${escapeHtml(item.trader)}
        </td>
        <td>
          <strong>${item.buyCount} işlem</strong> (${formatNumber(item.buyAmount)} bgl / ${formatNumber(item.buyPrice)} TL)
        </td>
        <td>
          <strong>${item.soldCount} işlem</strong> (${formatNumber(item.soldAmount)} bgl)
        </td>
        <td style="font-weight: 700; color: ${item.soldProfit >= 0 ? '#34d399' : '#f87171'};">
          ${profitFormatted}
        </td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${tradeShare}%;"></div>
            <span class="progress-text">${tradeShare}% (${item.totalTrades} işlem)</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Fetch Personnel Passwords from Backend API
async function fetchPersonnelPasswords() {
  if (!adminToken) return;

  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const data = await res.json();

    if (data.success) {
      allPersonnel = data.users;
      renderPersonnelTable(allPersonnel);
    }
  } catch (err) {
    console.error('Personnel fetch error:', err);
  }
}

// Render Personnel Password Management Table
function renderPersonnelTable(users) {
  const tbody = document.getElementById('passwords-tbody');

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center empty-state">Kayıtlı personel bulunamadı.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map((u, idx) => {
    const dateFormatted = u.updatedAt ? new Date(u.updatedAt).toLocaleString('tr-TR') : 'Varsayılan';

    return `
      <tr>
        <td style="font-weight: 600; color: #f1f5f9;">
          <i class="fa-solid fa-user-shield"></i> ${escapeHtml(u.name)}
        </td>
        <td><span class="badge badge-info">${escapeHtml(u.role || 'Trader')}</span></td>
        <td>
          <div class="password-toggle-box">
            <span id="pass-mask-${idx}" class="font-mono">••••••••</span>
            <span id="pass-text-${idx}" class="font-mono hidden">${escapeHtml(u.password)}</span>
            <button class="btn-icon" onclick="togglePassVisibility(${idx})" title="Göster/Gizle">
              <i id="pass-icon-${idx}" class="fa-solid fa-eye"></i>
            </button>
          </div>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${dateFormatted}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openPasswordModal('${escapeHtml(u.name)}')">
            <i class="fa-solid fa-pen-to-square"></i> Şifre Değiştir
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Toggle password text visibility
function togglePassVisibility(idx) {
  const mask = document.getElementById(`pass-mask-${idx}`);
  const text = document.getElementById(`pass-text-${idx}`);
  const icon = document.getElementById(`pass-icon-${idx}`);

  if (mask.classList.contains('hidden')) {
    mask.classList.remove('hidden');
    text.classList.add('hidden');
    icon.className = 'fa-solid fa-eye';
  } else {
    mask.classList.add('hidden');
    text.classList.remove('hidden');
    icon.className = 'fa-solid fa-eye-slash';
  }
}

// Open Password Update Modal
function openPasswordModal(name) {
  document.getElementById('modal-update-user-name').textContent = name;
  document.getElementById('update-target-user').value = name;
  document.getElementById('new-user-password').value = '';
  document.getElementById('update-pass-alert').className = 'alert hidden';
  document.getElementById('update-pass-modal').classList.remove('hidden');
}

function closePasswordModal() {
  document.getElementById('update-pass-modal').classList.add('hidden');
}

// Handle Password Update Form Submit
async function handlePasswordUpdateSubmit(e) {
  e.preventDefault();
  const targetUser = document.getElementById('update-target-user').value;
  const newPassword = document.getElementById('new-user-password').value.trim();
  const alertEl = document.getElementById('update-pass-alert');
  const btnSubmit = document.getElementById('btn-update-pass-submit');

  if (!newPassword) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = 'Lütfen yeni bir şifre giriniz.';
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Güncelleniyor...';

  try {
    const res = await fetch('/api/admin/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: targetUser,
        newPassword,
        adminToken
      })
    });

    const data = await res.json();

    if (data.success) {
      alertEl.className = 'alert alert-success';
      alertEl.textContent = data.message;
      fetchPersonnelPasswords();
      setTimeout(closePasswordModal, 1200);
    } else {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = data.error || 'Şifre güncellenemedi.';
    }
  } catch (err) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = 'Sunucu hatası oluştu.';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Güncelle & Kaydet';
  }
}

// Helpers
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
