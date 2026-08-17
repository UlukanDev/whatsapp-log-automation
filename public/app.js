let currentStatus = null;
let allLogs = [];
let loggedUser = localStorage.getItem('logged_user') || null;

// DOM Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
  fetchPersonnelDropdown();
  initAuthCheck();
  checkStatus();
  fetchLogs();
  updatePreview();
  
  // Auto polling status every 3 seconds
  setInterval(checkStatus, 3000);

  // Manual status refresh button
  document.getElementById('btn-refresh-status')?.addEventListener('click', checkStatus);
});

// Fetch Personnel Users from backend to dynamically populate selects
async function fetchPersonnelDropdown() {
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success && data.users) {
      populateUserDropdowns(data.users);
    }
  } catch (err) {
    console.error('Failed to fetch personnel dropdown users:', err);
  }
}

function populateUserDropdowns(usersList) {
  const modalSelect = document.getElementById('modal-personel-select');
  const formSelect = document.getElementById('trader-select');

  if (modalSelect) {
    const currentVal = modalSelect.value;
    modalSelect.innerHTML = '<option value="">-- Personel Seçiniz --</option>' + 
      usersList.map(u => `<option value="${escapeHtml(u)}">👤 ${escapeHtml(u)}</option>`).join('');
    if (currentVal) modalSelect.value = currentVal;
  }

  if (formSelect) {
    formSelect.innerHTML = '<option value="">-- Giriş Yapınız --</option>' + 
      usersList.map(u => `<option value="${escapeHtml(u)}">👤 ${escapeHtml(u)}</option>`).join('');
    if (loggedUser) {
      formSelect.value = loggedUser;
      formSelect.disabled = true;
    }
  }
}

// Auth Check & Session Persistence
function initAuthCheck() {
  const loginModal = document.getElementById('login-modal');
  const userBar = document.getElementById('user-session-bar');
  const loggedNameEl = document.getElementById('logged-user-name');
  const traderSelect = document.getElementById('trader-select');

  if (loggedUser) {
    loginModal?.classList.add('hidden');
    userBar?.classList.remove('hidden');
    if (loggedNameEl) loggedNameEl.textContent = loggedUser;
    if (traderSelect) {
      traderSelect.value = loggedUser;
      traderSelect.disabled = true; // Lock trader input to logged user
    }
    fetchUserStock();
  } else {
    loginModal?.classList.remove('hidden');
    userBar?.classList.add('hidden');
    if (traderSelect) {
      traderSelect.value = '';
    }
  }
  updatePreview();
  fetchLogs();
}

// Fetch Personal Stock Balance
async function fetchUserStock() {
  if (!loggedUser) return;
  try {
    const res = await fetch(`/api/stock?trader=${encodeURIComponent(loggedUser)}`);
    const data = await res.json();
    if (data.success) {
      updateStockBadgeUI(data.stock);
    }
  } catch (err) {
    console.error('Stock fetch error:', err);
  }
}

// Update Stock Badge UI
function updateStockBadgeUI(stockVal) {
  const badge = document.getElementById('user-stock-badge');
  const valEl = document.getElementById('user-stock-value');
  if (!badge || !valEl) return;

  const num = parseFloat(stockVal) || 0;
  const formatted = num.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  valEl.textContent = `${formatted} bgl`;

  if (num < 0) {
    badge.className = 'stock-badge stock-negative';
  } else {
    badge.className = 'stock-badge stock-positive';
  }
}

// Handle Personnel Login Form Submit
async function handleLoginSubmit(e) {
  e.preventDefault();
  const selectEl = document.getElementById('modal-personel-select');
  const passEl = document.getElementById('modal-password');
  const alertEl = document.getElementById('login-alert');
  const btnSubmit = document.getElementById('btn-login-submit');

  const name = selectEl.value;
  const password = passEl.value;

  if (!name || !password) {
    alertEl.textContent = 'Lütfen personel seçimi yapın ve şifrenizi girin.';
    alertEl.classList.remove('hidden');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Giriş Yapılıyor...';
  alertEl.classList.add('hidden');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();

    if (data.success) {
      loggedUser = data.user.name;
      localStorage.setItem('logged_user', loggedUser);
      initAuthCheck();
      passEl.value = '';
    } else {
      alertEl.textContent = data.error || 'Hatalı şifre!';
      alertEl.classList.remove('hidden');
    }
  } catch (err) {
    alertEl.textContent = 'Sunucuya bağlanılamadı.';
    alertEl.classList.remove('hidden');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Oturum Aç';
  }
}

// Handle Personnel Logout
function handleLogout() {
  localStorage.removeItem('logged_user');
  loggedUser = null;
  initAuthCheck();
}

function handleTraderChange() {
  updatePreview();
}

// Trade Type Switcher (BUY / SOLD)
function setTradeType(type) {
  const hiddenInput = document.getElementById('trade-type');
  const btnBuy = document.getElementById('btn-type-buy');
  const btnSold = document.getElementById('btn-type-sold');
  
  const priceGroup = document.getElementById('price-group');
  const priceInput = document.getElementById('price');
  
  const soldRow = document.getElementById('sold-mode-row');
  const buyPriceInput = document.getElementById('buyPrice');
  const sellPriceInput = document.getElementById('sellPrice');
  
  const profitGroup = document.getElementById('profit-group');

  hiddenInput.value = type;

  if (type === 'BUY') {
    btnBuy.className = 'type-btn active-buy';
    btnSold.className = 'type-btn';
    
    priceGroup.classList.remove('hidden');
    priceInput.required = true;
    
    soldRow.classList.add('hidden');
    buyPriceInput.required = false;
    sellPriceInput.required = false;
    
    profitGroup.classList.add('hidden');
    document.getElementById('profit').value = '';
  } else {
    btnBuy.className = 'type-btn';
    btnSold.className = 'type-btn active-sold';
    
    priceGroup.classList.add('hidden');
    priceInput.required = false;
    
    soldRow.classList.remove('hidden');
    buyPriceInput.required = true;
    sellPriceInput.required = true;
    
    profitGroup.classList.remove('hidden');
    calculateProfit();
  }

  updatePreview();
}

// Automatic Profit Calculator for SOLD mode: (Satış Fiyatı - Alış Fiyatı) * Miktar
function calculateProfit() {
  const type = document.getElementById('trade-type').value;
  if (type !== 'SOLD') return;

  const amount = parseFloat(document.getElementById('amount').value);
  const buyPrice = parseFloat(document.getElementById('buyPrice').value);
  const sellPrice = parseFloat(document.getElementById('sellPrice').value);

  const profitInput = document.getElementById('profit');

  if (!isNaN(amount) && !isNaN(buyPrice) && !isNaN(sellPrice) && amount > 0) {
    const totalProfit = (sellPrice - buyPrice) * amount;
    profitInput.value = Number(totalProfit.toFixed(2));
  } else {
    profitInput.value = '';
  }

  updatePreview();
}

// Live Preview Update
function updatePreview() {
  const type = document.getElementById('trade-type').value;
  const amount = document.getElementById('amount').value || '0';
  const price = document.getElementById('price').value || '0';
  const profit = document.getElementById('profit').value || '0';
  const trader = loggedUser || '[Seçilmedi]';
  const rawInfo = document.getElementById('info').value.trim();

  const previewEl = document.getElementById('message-preview');
  if (!previewEl) return;

  let infoText = rawInfo;
  if (type === 'SOLD') {
    const buyPriceVal = document.getElementById('buyPrice')?.value.trim();
    const sellPriceVal = document.getElementById('sellPrice')?.value.trim();
    if (buyPriceVal && sellPriceVal) {
      const rangeTag = `(${buyPriceVal}-${sellPriceVal})`;
      infoText = rawInfo ? `${rawInfo} ${rangeTag}` : rangeTag;
    }
  }

  let previewText = '';
  if (type === 'BUY') {
    previewText = `🔒 BUY: ${amount}bgl\n💥 PRICE: ${price}tl`;
    if (infoText) {
      previewText += `\nℹ️ INFO: ${infoText}`;
    }
    previewText += `\n👤 ADMİN: ${trader}`;
  } else {
    previewText = `🔒 SOLD: ${amount}bgl\n💸 PROFİT: ${profit}tl`;
    if (infoText) {
      previewText += `\nℹ️ INFO: ${infoText}`;
    }
    previewText += `\n👤 ADMİN: ${trader}`;
  }

  previewEl.textContent = previewText;
}

// Check WhatsApp Client Status
async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    
    currentStatus = data.status;
    updateStatusUI(data);

  } catch (error) {
    console.error('Status fetch error:', error);
    updateStatusBadge('DISCONNECTED', 'Sunucu Çevrimdışı');
  }
}

// Update UI elements based on status payload
function updateStatusUI(data) {
  const { status, qr, clientInfo, lastDisconnectReason } = data;

  const qrContainer = document.getElementById('qr-container');
  const deviceInfo = document.getElementById('device-info');
  const qrWrapper = document.getElementById('qrcode-canvas');
  const qrSpinner = document.getElementById('qr-spinner');
  const qrMessage = document.getElementById('qr-message');
  const reasonBox = document.getElementById('disconnect-reason-box');
  const reasonTextEl = document.getElementById('disconnect-reason-text');

  if (lastDisconnectReason && (status === 'DISCONNECTED' || status === 'INITIALIZING' || status === 'QR_READY')) {
    if (reasonTextEl) reasonTextEl.textContent = lastDisconnectReason;
    if (reasonBox) reasonBox.classList.remove('hidden');
  } else {
    if (reasonBox) reasonBox.classList.add('hidden');
  }

  switch (status) {
    case 'INITIALIZING':
      updateStatusBadge('INITIALIZING', 'WhatsApp Başlatılıyor...');
      qrContainer.classList.remove('hidden');
      deviceInfo.classList.add('hidden');
      qrSpinner.classList.remove('hidden');
      qrWrapper.innerHTML = '';
      qrMessage.textContent = 'WhatsApp Web botu başlatılıyor, lütfen bekleyin...';
      break;

    case 'QR_READY':
      updateStatusBadge('QR_READY', 'Admin QR Kod Bekleniyor');
      qrContainer.classList.remove('hidden');
      deviceInfo.classList.add('hidden');
      qrSpinner.classList.add('hidden');
      qrMessage.textContent = 'Admin: Lütfen WhatsApp mobil uygulamanızdan bu QR kodu taratın.';
      
      if (qr) {
        renderQRCode(qr);
      }
      break;

    case 'CONNECTED':
      updateStatusBadge('CONNECTED', 'WhatsApp Bot Bağlı & Hazır');
      qrContainer.classList.add('hidden');
      deviceInfo.classList.remove('hidden');
      
      if (clientInfo) {
        document.getElementById('device-name').textContent = clientInfo.pushname || 'Admin Oturumu';
        document.getElementById('device-phone').textContent = clientInfo.wid ? `+${clientInfo.wid}` : 'Oturum Aktif';
      }
      break;

    case 'DISCONNECTED':
    default:
      updateStatusBadge('DISCONNECTED', lastDisconnectReason || 'Bağlantı Kesildi');
      qrContainer.classList.remove('hidden');
      deviceInfo.classList.add('hidden');
      qrSpinner.classList.add('hidden');
      qrWrapper.innerHTML = '';
      qrMessage.textContent = lastDisconnectReason ? `Bağlantı kesildi: ${lastDisconnectReason}` : 'WhatsApp bağlantısı kopuk. Yeniden bağlanılıyor...';
      break;
  }
}

// Render QR Code using qrcodejs
function renderQRCode(qrString) {
  const qrWrapper = document.getElementById('qrcode-canvas');
  
  if (qrWrapper.dataset.qr === qrString) return;
  
  qrWrapper.innerHTML = '';
  qrWrapper.dataset.qr = qrString;

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrWrapper, {
      text: qrString,
      width: 180,
      height: 180,
      colorDark: "#0b0f17",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrWrapper.textContent = 'QR kütüphanesi yüklenemedi.';
  }
}

// Update Status Badge UI
function updateStatusBadge(type, message) {
  const badge = document.getElementById('status-badge');
  const text = document.getElementById('status-text');

  badge.className = 'status-badge';
  
  switch (type) {
    case 'INITIALIZING':
      badge.classList.add('status-initializing');
      break;
    case 'QR_READY':
      badge.classList.add('status-qr');
      break;
    case 'CONNECTED':
      badge.classList.add('status-connected');
      break;
    case 'DISCONNECTED':
    default:
      badge.classList.add('status-disconnected');
      break;
  }

  text.textContent = message;
}

// Handle Form Submission (Send Trade Log via Server Bot)
async function handleSendLog(e) {
  e.preventDefault();

  const btnSubmit = document.getElementById('btn-submit');
  const alertEl = document.getElementById('form-alert');

  if (!loggedUser) {
    showAlert('alert-error', `<i class="fa-solid fa-lock"></i> Oturumunuz kapalı. Lütfen önce giriş yapın.`);
    initAuthCheck();
    return;
  }

  const type = document.getElementById('trade-type').value;
  let priceVal = '';
  const buyPriceVal = document.getElementById('buyPrice')?.value.trim() || '';
  const sellPriceVal = document.getElementById('sellPrice')?.value.trim() || '';

  if (type === 'BUY') {
    priceVal = document.getElementById('price').value.trim();
  } else {
    priceVal = sellPriceVal || document.getElementById('price').value.trim();
  }

  let effectiveInfo = document.getElementById('info').value.trim();
  if (type === 'SOLD' && buyPriceVal !== '' && sellPriceVal !== '') {
    const rangeTag = `(${buyPriceVal}-${sellPriceVal})`;
    if (!effectiveInfo.includes(rangeTag)) {
      effectiveInfo = effectiveInfo ? `${effectiveInfo} ${rangeTag}` : rangeTag;
    }
  }

  const payload = {
    trader: loggedUser,
    type,
    amount: document.getElementById('amount').value.trim(),
    price: priceVal,
    buyPrice: buyPriceVal,
    sellPrice: sellPriceVal,
    profit: document.getElementById('profit')?.value.trim() || '',
    info: effectiveInfo
  };

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...';
  alertEl.className = 'alert hidden';

  try {
    const res = await fetch('/api/send-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      showAlert('alert-success', `<i class="fa-solid fa-circle-check"></i> Ticaret logu WhatsApp grubuna başarıyla gönderildi!`);
      fetchLogs(); // refresh log table
      fetchUserStock(); // real-time stock balance update
    } else {
      showAlert('alert-error', `<i class="fa-solid fa-triangle-exclamation"></i> ${data.error}`);
    }

  } catch (err) {
    showAlert('alert-error', `<i class="fa-solid fa-circle-xmark"></i> Sunucu ile iletişim kurulamadı: ${err.message}`);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> WhatsApp Grubuna Gönder';
  }
}

// Show alert message in form
function showAlert(typeClass, htmlContent) {
  const alertEl = document.getElementById('form-alert');
  alertEl.className = `alert ${typeClass}`;
  alertEl.innerHTML = htmlContent;
}

// Reset form
function resetForm() {
  document.getElementById('log-form').reset();
  initAuthCheck();
  setTradeType('BUY');
  updatePreview();
  document.getElementById('form-alert').className = 'alert hidden';
}

// Fetch logs history from server
async function fetchLogs() {
  try {
    const url = loggedUser ? `/api/logs?user=${encodeURIComponent(loggedUser)}` : '/api/logs';
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      allLogs = data.logs;
      renderLogsTable(allLogs);
    }
  } catch (error) {
    console.error('Fetch logs error:', error);
  }
}

// Filter logs by search term
function filterLogs() {
  const query = document.getElementById('search-log').value.toLowerCase();
  const filtered = allLogs.filter(log => 
    (log.type && log.type.toLowerCase().includes(query)) ||
    (log.trader && log.trader.toLowerCase().includes(query)) ||
    (log.formattedText && log.formattedText.toLowerCase().includes(query)) ||
    (log.info && log.info.toLowerCase().includes(query))
  );
  renderLogsTable(filtered);
}

// Render logs table rows
function renderLogsTable(logs) {
  const tbody = document.getElementById('logs-tbody');

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center empty-state">
          <i class="fa-regular fa-folder-open"></i> Henüz gönderilmiş ticaret logu bulunmuyor.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const dateFormatted = new Date(log.timestamp).toLocaleString('tr-TR');
    const isBuy = log.type === 'BUY';
    const typeBadge = isBuy 
      ? '<span class="badge badge-success"><i class="fa-solid fa-lock"></i> BUY</span>' 
      : '<span class="badge badge-error"><i class="fa-solid fa-lock"></i> SOLD</span>';

    const numbersText = isBuy 
      ? `<strong>${escapeHtml(log.amount)} bgl</strong> / ${escapeHtml(log.price)} tl` 
      : `<strong>${escapeHtml(log.amount)} bgl</strong> / Kâr: <span style="color: #34d399; font-weight: 600;">${escapeHtml(log.profit)} tl</span>`;

    const traderName = log.trader || 'Ulukan';

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 0.8rem; color: var(--text-muted);">${dateFormatted}</td>
        <td>${typeBadge}</td>
        <td style="font-weight: 600; font-size: 0.875rem; color: #60a5fa;"><i class="fa-solid fa-user-check"></i> ${escapeHtml(traderName)}</td>
        <td>${numbersText}</td>
        <td>
          <pre class="details-preview">${escapeHtml(log.formattedText || '')}</pre>
        </td>
        <td>
          <span class="badge badge-success"><i class="fa-solid fa-check-double"></i> Sent</span>
        </td>
      </tr>
    `;
  }).join('');
}

// Utility: HTML escaper
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
