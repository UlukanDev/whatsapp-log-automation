let adminToken = sessionStorage.getItem('admin_token') || null;
let allPersonnel = [];
let allLogs = [];
let selectedTraderFilter = 'ALL';

let breakdownDateFilter = 'all';
let breakdownTraderFilter = 'ALL';
let chartTimeframeFilter = 'all';
let currentChartType = 'bar';
let performanceChart = null;

let currentLogPage = 1;
const LOGS_PER_PAGE = 15;

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
});

// Admin Auth Initialization
function initAdminAuth() {
  try {
    const modal = document.getElementById('admin-login-modal');
    if (adminToken === 'admin_session_bayro3100') {
      if (modal) modal.classList.add('hidden');
      fetchAccountingData();
      fetchPersonnelPasswords();
    } else {
      if (modal) modal.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Auth initialization error:', err);
    document.getElementById('admin-login-modal')?.classList.remove('hidden');
  }
}

// Handle Admin Master Password Login
async function handleAdminLogin(e) {
  e.preventDefault();
  const passEl = document.getElementById('admin-master-password');
  const alertEl = document.getElementById('admin-login-alert');
  const btnSubmit = document.getElementById('btn-admin-login');

  const password = passEl ? passEl.value.trim() : '';

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Doğrulanıyor...';
  if (alertEl) alertEl.classList.add('hidden');

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (data && data.success) {
      adminToken = data.token;
      sessionStorage.setItem('admin_token', adminToken);
      document.getElementById('admin-login-modal')?.classList.add('hidden');
      fetchAccountingData();
      fetchPersonnelPasswords();
    } else {
      if (alertEl) {
        alertEl.textContent = (data && data.error) ? data.error : 'Hatalı Admin Şifresi!';
        alertEl.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (alertEl) {
      alertEl.textContent = 'Sunucuya bağlanılamadı.';
      alertEl.classList.remove('hidden');
    }
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
    if (tabAcc) tabAcc.classList.add('active');
    if (tabPass) tabPass.classList.remove('active');
    if (secAcc) { secAcc.classList.add('active'); secAcc.classList.remove('hidden'); }
    if (secPass) { secPass.classList.add('hidden'); secPass.classList.remove('active'); }
    fetchAccountingData();
  } else {
    if (tabPass) tabPass.classList.add('active');
    if (tabAcc) tabAcc.classList.remove('active');
    if (secPass) { secPass.classList.add('active'); secPass.classList.remove('hidden'); }
    if (secAcc) { secAcc.classList.add('hidden'); secAcc.classList.remove('active'); }
    fetchPersonnelPasswords();
  }
}

// Handle Breakdown Filter Changes (Date or Personnel)
function handleBreakdownFilterChange() {
  const dateEl = document.getElementById('breakdown-filter-date');
  const traderEl = document.getElementById('breakdown-filter-trader');

  if (dateEl) breakdownDateFilter = dateEl.value;
  if (traderEl) breakdownTraderFilter = traderEl.value;

  fetchAccountingData();
}

// Set Chart Timeframe (Daily / Weekly / Monthly / All)
function setChartTimeframe(tf) {
  chartTimeframeFilter = tf;

  const btns = {
    daily: document.getElementById('chart-btn-daily'),
    weekly: document.getElementById('chart-btn-weekly'),
    monthly: document.getElementById('chart-btn-monthly'),
    all: document.getElementById('chart-btn-all')
  };

  Object.keys(btns).forEach(key => {
    if (btns[key]) {
      if (key === tf) {
        btns[key].classList.add('active');
        btns[key].style.background = 'var(--primary-color)';
        btns[key].style.color = '#fff';
      } else {
        btns[key].classList.remove('active');
        btns[key].style.background = '';
        btns[key].style.color = '';
      }
    }
  });

  renderPerformanceChart(allLogs);
}

// Fetch Accounting Data & Logs History from Backend API
async function fetchAccountingData() {
  if (!adminToken) {
    document.getElementById('admin-login-modal')?.classList.remove('hidden');
    return;
  }

  try {
    const dateVal = document.getElementById('breakdown-filter-date')?.value || breakdownDateFilter || 'all';
    const traderVal = document.getElementById('breakdown-filter-trader')?.value || breakdownTraderFilter || 'ALL';

    const [accRes, logsRes] = await Promise.all([
      fetch(`/api/admin/accounting?timeRange=${encodeURIComponent(dateVal)}&trader=${encodeURIComponent(traderVal)}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }).catch(e => ({ ok: false, status: 500 })),
      fetch('/api/logs').catch(e => ({ ok: false, status: 500 }))
    ]);

    if (accRes.status === 401 || accRes.status === 403) {
      sessionStorage.removeItem('admin_token');
      adminToken = null;
      document.getElementById('admin-login-modal')?.classList.remove('hidden');
      return;
    }

    const accData = accRes.ok ? await accRes.json().catch(() => null) : null;
    const logsData = logsRes.ok ? await logsRes.json().catch(() => null) : null;

    if (accData && accData.success) {
      renderAccountingSummary(accData.summary);
      renderAdminBreakdown(accData.adminBreakdown, accData.summary.totalTrades);
    } else {
      renderAccountingSummary({ totalBuyAmount: 0, totalBuyPrice: 0, totalSoldAmount: 0, totalSoldPrice: 0, totalProfit: 0, totalTrades: 0 });
      renderAdminBreakdown([], 0);
    }

    if (logsData && logsData.success) {
      allLogs = logsData.logs || [];
      populateTraderFilterDropdown(allLogs);
      populateBreakdownTraderDropdown(allLogs);
      renderLogsTable();
      renderPerformanceChart(allLogs);
    } else {
      allLogs = [];
      renderLogsTable();
      renderPerformanceChart([]);
    }
  } catch (err) {
    console.error('Accounting data fetch error:', err);
    renderAccountingSummary({ totalBuyAmount: 0, totalBuyPrice: 0, totalSoldAmount: 0, totalSoldPrice: 0, totalProfit: 0, totalTrades: 0 });
    renderAdminBreakdown([], 0);
    renderLogsTable();
    renderPerformanceChart([]);
  }
}

// Populate Personnel Filter Dropdown for Breakdown Card
function populateBreakdownTraderDropdown(logs) {
  const selectEl = document.getElementById('breakdown-filter-trader');
  if (!selectEl) return;

  const currentVal = selectEl.value || breakdownTraderFilter || 'ALL';

  const traderSet = new Set();
  logs.forEach(l => {
    if (l.trader && l.trader.trim()) {
      traderSet.add(l.trader.trim());
    }
  });

  const traders = Array.from(traderSet).sort();

  let html = `<option value="ALL">👥 Tüm Adminler (Tümü)</option>`;
  traders.forEach(t => {
    html += `<option value="${escapeHtml(t)}">👤 ${escapeHtml(t)}</option>`;
  });

  selectEl.innerHTML = html;
  selectEl.value = traders.includes(currentVal) ? currentVal : 'ALL';
  breakdownTraderFilter = selectEl.value;
}

// Populate Personnel Filter Dropdown for Logs Table
function populateTraderFilterDropdown(logs) {
  const selectEl = document.getElementById('log-filter-trader');
  if (!selectEl) return;

  const currentVal = selectEl.value || selectedTraderFilter || 'ALL';

  const traderSet = new Set();
  logs.forEach(l => {
    if (l.trader && l.trader.trim()) {
      traderSet.add(l.trader.trim());
    }
  });

  const traders = Array.from(traderSet).sort();

  let html = `<option value="ALL">👥 Tüm Personeller (Tümü)</option>`;
  traders.forEach(t => {
    html += `<option value="${escapeHtml(t)}">👤 ${escapeHtml(t)}</option>`;
  });

  selectEl.innerHTML = html;
  selectEl.value = traders.includes(currentVal) ? currentVal : 'ALL';
  selectedTraderFilter = selectEl.value;
}

// Handle Trader Filter Select Change
function handleTraderFilterChange() {
  const selectEl = document.getElementById('log-filter-trader');
  selectedTraderFilter = selectEl.value;
  currentLogPage = 1;
  renderLogsTable();
}

// Handle Log Search Input Change
function handleLogSearchInput() {
  currentLogPage = 1;
  renderLogsTable();
}

// Filter Logs By Specific Trader
function filterLogsByTrader(traderName) {
  selectedTraderFilter = traderName;
  currentLogPage = 1;
  const selectEl = document.getElementById('log-filter-trader');
  if (selectEl) {
    selectEl.value = traderName;
  }
  renderLogsTable();

  // Scroll to logs table
  const logsCard = document.getElementById('logs-table-card');
  if (logsCard) {
    logsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Set Chart Type (Bar / Line)
function setChartType(type) {
  currentChartType = type;

  const barBtn = document.getElementById('chart-type-bar');
  const lineBtn = document.getElementById('chart-type-line');

  if (barBtn && lineBtn) {
    if (type === 'bar') {
      barBtn.classList.add('active');
      barBtn.style.background = 'var(--primary-accent)';
      barBtn.style.color = '#0b0f17';
      lineBtn.classList.remove('active');
      lineBtn.style.background = '';
      lineBtn.style.color = '';
    } else {
      lineBtn.classList.add('active');
      lineBtn.style.background = 'var(--primary-accent)';
      lineBtn.style.color = '#0b0f17';
      barBtn.classList.remove('active');
      barBtn.style.background = '';
      barBtn.style.color = '';
    }
  }

  renderPerformanceChart(allLogs);
}

// Render Chart.js Performance & Profit Dashboard
function renderPerformanceChart(logs) {
  const canvas = document.getElementById('performanceChartCanvas');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');

  // Filter logs by selected chart timeframe
  const now = Date.now();
  let filtered = logs || [];

  if (chartTimeframeFilter === 'daily') {
    const now = new Date();
    const trDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const startOfToday = new Date(trDateStr + 'T00:00:00+03:00');
    filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= startOfToday.getTime());
  } else if (chartTimeframeFilter === 'weekly') {
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= sevenDaysAgo);
  } else if (chartTimeframeFilter === 'monthly') {
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= thirtyDaysAgo);
  }

  // Aggregate stats per trader
  const statsByTrader = {};

  filtered.forEach(log => {
    const trader = (log.trader || 'Bilinmiyor').trim();
    if (!statsByTrader[trader]) {
      statsByTrader[trader] = {
        profit: 0,
        soldAmount: 0,
        buyAmount: 0
      };
    }
    const amt = parseFloat(log.amount) || 0;
    const prft = parseFloat(log.profit) || 0;

    if (log.type === 'BUY') {
      statsByTrader[trader].buyAmount += amt;
    } else if (log.type === 'SOLD') {
      statsByTrader[trader].soldAmount += amt;
      statsByTrader[trader].profit += prft;
    }
  });

  const labels = Object.keys(statsByTrader).sort();
  const profitData = labels.map(t => statsByTrader[t].profit);
  const soldData = labels.map(t => statsByTrader[t].soldAmount);
  const buyData = labels.map(t => statsByTrader[t].buyAmount);

  if (performanceChart) {
    performanceChart.destroy();
  }

  const isLine = currentChartType === 'line';

  performanceChart = new Chart(ctx, {
    type: currentChartType || 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['Veri Yok'],
      datasets: [
        {
          label: 'Net Kâr (TL)',
          data: labels.length > 0 ? profitData : [0],
          backgroundColor: isLine ? 'rgba(52, 211, 153, 0.15)' : 'rgba(52, 211, 153, 0.85)',
          borderColor: '#34d399',
          borderWidth: 2,
          borderRadius: isLine ? 0 : 6,
          fill: isLine,
          tension: 0.35,
          pointRadius: isLine ? 5 : 0,
          pointHoverRadius: isLine ? 7 : 0
        },
        {
          label: 'Satış Hacmi (bgl)',
          data: labels.length > 0 ? soldData : [0],
          backgroundColor: isLine ? 'rgba(96, 165, 250, 0.15)' : 'rgba(96, 165, 250, 0.85)',
          borderColor: '#60a5fa',
          borderWidth: 2,
          borderRadius: isLine ? 0 : 6,
          fill: isLine,
          tension: 0.35,
          pointRadius: isLine ? 5 : 0,
          pointHoverRadius: isLine ? 7 : 0
        },
        {
          label: 'Alış Hacmi (bgl)',
          data: labels.length > 0 ? buyData : [0],
          backgroundColor: isLine ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.85)',
          borderColor: '#c084fc',
          borderWidth: 2,
          borderRadius: isLine ? 0 : 6,
          fill: isLine,
          tension: 0.35,
          pointRadius: isLine ? 5 : 0,
          pointHoverRadius: isLine ? 7 : 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += Number(context.parsed.y).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
        }
      }
    }
  });
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
        <td colspan="6" class="text-center empty-state">Henüz muhasebe kaydı bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = breakdown.map(item => {
    const tradeShare = totalTradesCount > 0 ? ((item.totalTrades / totalTradesCount) * 100).toFixed(1) : 0;
    const profitFormatted = item.soldProfit >= 0 ? `+${formatNumber(item.soldProfit)} TL` : `${formatNumber(item.soldProfit)} TL`;
    const stockVal = parseFloat(item.currentStock) || 0;
    const stockBadge = stockVal < 0 
      ? `<span class="badge badge-error" style="font-size: 0.85rem;"><i class="fa-solid fa-arrow-trend-down"></i> ${formatNumber(stockVal)} bgl</span>` 
      : `<span class="badge badge-success" style="font-size: 0.85rem;"><i class="fa-solid fa-arrow-trend-up"></i> ${formatNumber(stockVal)} bgl</span>`;

    return `
      <tr style="cursor: pointer;" onclick="filterLogsByTrader('${escapeHtml(item.trader)}')" title="Tıkla ve ${escapeHtml(item.trader)} loglarını filtrele">
        <td style="font-weight: 600; color: #60a5fa;">
          <i class="fa-solid fa-user-tie"></i> ${escapeHtml(item.trader)}
        </td>
        <td>
          ${stockBadge}
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
            <div class="progress-text">
              <span class="progress-text-pill"><strong>${tradeShare}%</strong> (${item.totalTrades} işlem)</span>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Accounting Logs Table with Pagination
function renderLogsTable() {
  const tbody = document.getElementById('logs-tbody');
  const badgeEl = document.getElementById('active-log-filter-badge');
  const searchInput = document.getElementById('log-search-input');
  const searchQuery = (searchInput?.value || '').trim().toLowerCase();

  if (!tbody) return;

  let filteredLogs = selectedTraderFilter === 'ALL'
    ? allLogs
    : allLogs.filter(l => (l.trader || '').trim().toLowerCase() === selectedTraderFilter.trim().toLowerCase());

  if (searchQuery) {
    filteredLogs = filteredLogs.filter(l => {
      const isBuy = (l.type || 'BUY').toUpperCase() === 'BUY';
      const dateFormatted = l.timestamp ? new Date(l.timestamp).toLocaleString('tr-TR') : '';
      const trader = l.trader || 'Ulukan';
      const type = l.type || 'BUY';
      const amount = l.amount !== undefined ? String(l.amount) : '';
      const price = l.price !== undefined ? String(l.price) : '';
      const profit = l.profit !== undefined ? String(l.profit) : '';
      const info = l.info || '';

      const searchTarget = `${dateFormatted} ${l.timestamp || ''} ${trader} ${type} ${amount} ${price} ${profit} ${info}`.toLowerCase();
      return searchTarget.includes(searchQuery);
    });
  }

  if (badgeEl) {
    const filterParts = [];
    if (selectedTraderFilter !== 'ALL') {
      filterParts.push(`Personel: ${selectedTraderFilter}`);
    }
    if (searchQuery) {
      filterParts.push(`Arama: "${searchQuery}"`);
    }
    if (filterParts.length > 0) {
      badgeEl.textContent = `Filtre: ${filterParts.join(' | ')}`;
      badgeEl.classList.remove('hidden');
    } else {
      badgeEl.classList.add('hidden');
    }
  }

  const totalCount = filteredLogs.length;
  const totalPages = Math.ceil(totalCount / LOGS_PER_PAGE) || 1;

  if (currentLogPage > totalPages) currentLogPage = totalPages;
  if (currentLogPage < 1) currentLogPage = 1;

  const startIndex = (currentLogPage - 1) * LOGS_PER_PAGE;
  const endIndex = Math.min(startIndex + LOGS_PER_PAGE, totalCount);
  const pageLogs = filteredLogs.slice(startIndex, endIndex);

  updatePaginationControls(totalCount, totalPages, startIndex, endIndex);

  if (!pageLogs || pageLogs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center empty-state">İşlem logu bulunamadı.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = pageLogs.map(log => {
    const isBuy = (log.type || 'BUY').toUpperCase() === 'BUY';
    const typeBadge = isBuy
      ? `<span class="badge badge-success" style="font-size: 0.8rem;"><i class="fa-solid fa-cart-shopping"></i> BUY</span>`
      : `<span class="badge badge-warning" style="font-size: 0.8rem; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);"><i class="fa-solid fa-cash-register"></i> SOLD</span>`;

    const dateFormatted = log.timestamp ? new Date(log.timestamp).toLocaleString('tr-TR') : '-';
    
    let priceProfitText = '';
    if (isBuy) {
      priceProfitText = `<span>${formatNumber(log.price)} TL</span>`;
    } else {
      const prft = parseFloat(log.profit) || 0;
      priceProfitText = `<span style="color: ${prft >= 0 ? '#34d399' : '#f87171'}; font-weight: 600;">Kâr: ${prft >= 0 ? '+' : ''}${formatNumber(prft)} TL</span>`;
    }

    return `
      <tr>
        <td style="font-size: 0.82rem; color: var(--text-muted); font-family: var(--font-mono);">
          ${dateFormatted}
        </td>
        <td style="font-weight: 600; color: #60a5fa;">
          <i class="fa-solid fa-user-tie"></i> ${escapeHtml(log.trader || 'Ulukan')}
        </td>
        <td>
          ${typeBadge}
        </td>
        <td style="font-weight: 600;">
          ${formatNumber(log.amount)} bgl
        </td>
        <td>
          ${priceProfitText}
        </td>
        <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 200px; word-break: break-word;">
          ${escapeHtml(log.info || '-')}
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary" onclick="openEditLogModal('${escapeHtml(log.id)}')" title="Düzenle">
              ✏️ Düzenle
            </button>
            <button class="btn btn-sm btn-danger" onclick="handleDeleteLog('${escapeHtml(log.id)}')" title="Sil">
              🗑️ Sil
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Update Pagination Controls UI
function updatePaginationControls(totalCount, totalPages, startIndex, endIndex) {
  const totalEl = document.getElementById('pagination-total-count');
  const rangeEl = document.getElementById('pagination-range-info');
  const pageInfoEl = document.getElementById('pagination-page-info');
  const prevBtn = document.getElementById('btn-prev-page');
  const nextBtn = document.getElementById('btn-next-page');

  if (totalEl) totalEl.textContent = totalCount;
  if (rangeEl) rangeEl.textContent = totalCount > 0 ? `${startIndex + 1} - ${endIndex}` : '0 - 0';
  if (pageInfoEl) pageInfoEl.textContent = `Sayfa ${currentLogPage} / ${totalPages}`;

  if (prevBtn) prevBtn.disabled = currentLogPage <= 1;
  if (nextBtn) nextBtn.disabled = currentLogPage >= totalPages;
}

// Handle Log Table Page Navigation
function changeLogPage(delta) {
  currentLogPage += delta;
  renderLogsTable();
}

// Toggle Profit field visibility in Edit Log Modal
function toggleEditLogTypeFields() {
  const type = document.getElementById('edit-log-type').value;
  const profitGroup = document.getElementById('edit-log-profit-group');
  if (type === 'SOLD') {
    profitGroup.classList.remove('hidden');
  } else {
    profitGroup.classList.add('hidden');
  }
}

// Open Edit Log Modal
function openEditLogModal(logId) {
  const log = allLogs.find(l => String(l.id) === String(logId));
  if (!log) {
    alert('Log kaydı bulunamadı.');
    return;
  }

  document.getElementById('edit-log-id').value = log.id;
  document.getElementById('modal-edit-log-trader').textContent = log.trader || 'Personel';
  document.getElementById('edit-log-type').value = (log.type || 'BUY').toUpperCase();
  document.getElementById('edit-log-amount').value = log.amount || '';
  document.getElementById('edit-log-price').value = log.price || '';
  document.getElementById('edit-log-profit').value = log.profit || '';
  document.getElementById('edit-log-info').value = log.info || '';

  toggleEditLogTypeFields();

  const alertEl = document.getElementById('edit-log-alert');
  alertEl.className = 'alert hidden';
  document.getElementById('edit-log-modal').classList.remove('hidden');
}

// Close Edit Log Modal
function closeEditLogModal() {
  document.getElementById('edit-log-modal').classList.add('hidden');
}

// Handle Edit Log Form Submit
async function handleEditLogSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('edit-log-id').value;
  const type = document.getElementById('edit-log-type').value;
  const amount = document.getElementById('edit-log-amount').value;
  const price = document.getElementById('edit-log-price').value;
  const profit = document.getElementById('edit-log-profit').value;
  const info = document.getElementById('edit-log-info').value.trim();

  const alertEl = document.getElementById('edit-log-alert');
  const btnSubmit = document.getElementById('btn-edit-log-submit');

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

  try {
    const res = await fetch('/api/admin/edit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        id,
        type,
        amount,
        price,
        profit,
        info,
        adminToken
      })
    });

    const data = await res.json();

    if (data.success) {
      alertEl.className = 'alert alert-success';
      alertEl.textContent = data.message;
      fetchAccountingData();
      setTimeout(closeEditLogModal, 800);
    } else {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = data.error || 'Log güncellenemedi.';
    }
  } catch (err) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = 'Sunucu hatası oluştu.';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Güncelle & Kaydet';
  }
}

// Handle Delete Log Entry
async function handleDeleteLog(logId) {
  if (!confirm("Bu log kaydını silmek istediğinize emin misiniz? Muhasebe ve stok verileri güncellenecektir.")) {
    return;
  }

  try {
    const res = await fetch('/api/admin/delete-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        id: logId,
        adminToken
      })
    });

    const data = await res.json();

    if (data.success) {
      fetchAccountingData();
    } else {
      alert(`Hata: ${data.error}`);
    }
  } catch (err) {
    alert('Sunucu hatası oluştu.');
  }
}

// Fetch Personnel Passwords from Backend API
async function fetchPersonnelPasswords() {
  if (!adminToken) return;

  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).catch(e => ({ ok: false, status: 500 }));

    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('admin_token');
      adminToken = null;
      document.getElementById('admin-login-modal')?.classList.remove('hidden');
      return;
    }

    const data = res.ok ? await res.json().catch(() => null) : null;

    if (data && data.success) {
      allPersonnel = data.users || [];
      renderPersonnelTable(allPersonnel);
    } else {
      renderPersonnelTable([]);
    }
  } catch (err) {
    console.error('Personnel fetch error:', err);
    renderPersonnelTable([]);
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
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary" onclick="openPasswordModal('${escapeHtml(u.name)}')">
              <i class="fa-solid fa-pen-to-square"></i> Şifre Değiştir
            </button>
            <button class="btn btn-sm btn-danger" onclick="handleDeleteUser('${escapeHtml(u.name)}')">
              <i class="fa-solid fa-trash-can"></i> Sil
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open/Close Add User Modal
function openAddUserModal() {
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-pass').value = '';
  document.getElementById('add-user-alert').className = 'alert hidden';
  document.getElementById('add-user-modal').classList.remove('hidden');
}

function closeAddUserModal() {
  document.getElementById('add-user-modal').classList.add('hidden');
}

// Handle Add User Submit
async function handleAddUserSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('new-user-name').value.trim();
  const password = document.getElementById('new-user-pass').value.trim();
  const alertEl = document.getElementById('add-user-alert');
  const btnSubmit = document.getElementById('btn-add-user-submit');

  if (!name || !password) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = 'Personel ismi ve şifresi zorunludur.';
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ekleniyor...';

  try {
    const res = await fetch('/api/admin/add-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name, password, adminToken })
    });

    const data = await res.json();

    if (data.success) {
      alertEl.className = 'alert alert-success';
      alertEl.textContent = data.message;
      fetchPersonnelPasswords();
      setTimeout(closeAddUserModal, 1000);
    } else {
      alertEl.className = 'alert alert-error';
      alertEl.textContent = data.error || 'Personel eklenemedi.';
    }
  } catch (err) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = 'Sunucu hatası.';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-check"></i> Kaydet & Ekle';
  }
}

// Handle Delete User
async function handleDeleteUser(name) {
  if (!confirm(`'${name}' isimli personeli sistemden silmek istediğinize emin misiniz?`)) {
    return;
  }

  try {
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name, adminToken })
    });

    const data = await res.json();

    if (data.success) {
      fetchPersonnelPasswords();
    } else {
      alert(`Hata: ${data.error}`);
    }
  } catch (err) {
    alert('Sunucu hatası oluştu.');
  }
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
