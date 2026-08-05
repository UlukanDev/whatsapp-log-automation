let currentStatus = null;
let allLogs = [];

// DOM Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTraderSelection();
  checkStatus();
  fetchLogs();
  updatePreview();
  
  // Auto polling status every 3 seconds
  setInterval(checkStatus, 3000);

  // Manual status refresh button
  document.getElementById('btn-refresh-status')?.addEventListener('click', checkStatus);
});

// Trader Selection & LocalStorage Persistence
function initTraderSelection() {
  const savedTrader = localStorage.getItem('trader_name');
  const traderSelect = document.getElementById('trader-select');
  if (savedTrader && traderSelect) {
    traderSelect.value = savedTrader;
  }
}

function handleTraderChange() {
  const traderSelect = document.getElementById('trader-select');
  if (traderSelect) {
    if (traderSelect.value) {
      traderSelect.classList.remove('input-error');
    }
    localStorage.setItem('trader_name', traderSelect.value);
    updatePreview();
  }
}

// Trade Type Switcher (BUY / SOLD)
function setTradeType(type) {
  const hiddenInput = document.getElementById('trade-type');
  const btnBuy = document.getElementById('btn-type-buy');
  const btnSold = document.getElementById('btn-type-sold');
  const profitGroup = document.getElementById('profit-group');

  hiddenInput.value = type;

  if (type === 'BUY') {
    btnBuy.className = 'type-btn active-buy';
    btnSold.className = 'type-btn';
    profitGroup.classList.add('hidden');
    document.getElementById('profit').value = '';
  } else {
    btnBuy.className = 'type-btn';
    btnSold.className = 'type-btn active-sold';
    profitGroup.classList.remove('hidden');
  }

  updatePreview();
}

// Live Preview Update
function updatePreview() {
  const type = document.getElementById('trade-type').value;
  const amount = document.getElementById('amount').value || '0';
  const price = document.getElementById('price').value || '0';
  const profit = document.getElementById('profit').value || '0';
  const traderSelect = document.getElementById('trader-select');
  const trader = (traderSelect && traderSelect.value) ? traderSelect.value : '[Seçilmedi]';
  const info = document.getElementById('info').value.trim();

  const previewEl = document.getElementById('message-preview');
  if (!previewEl) return;

  let previewText = '';
  if (type === 'BUY') {
    previewText = `🔒 BUY: ${amount}bgl\n💥 PRICE: ${price}tl`;
    if (info) {
      previewText += `\nℹ️ INFO: ${info}`;
    }
    previewText += `\n👤 ADMİN: ${trader}`;
  } else {
    previewText = `🔒 SOLD: ${amount}bgl\n💸 PROFİT: ${profit}tl`;
    if (info) {
      previewText += `\nℹ️ INFO: ${info}`;
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
  const { status, qr, clientInfo } = data;

  const qrContainer = document.getElementById('qr-container');
  const deviceInfo = document.getElementById('device-info');
  const qrWrapper = document.getElementById('qrcode-canvas');
  const qrSpinner = document.getElementById('qr-spinner');
  const qrMessage = document.getElementById('qr-message');

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
      updateStatusBadge('DISCONNECTED', 'Bağlantı Kesildi');
      qrContainer.classList.remove('hidden');
      deviceInfo.classList.add('hidden');
      qrSpinner.classList.add('hidden');
      qrWrapper.innerHTML = '';
      qrMessage.textContent = 'WhatsApp bağlantısı kopuk. Yeniden bağlanılıyor...';
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
  const traderSelect = document.getElementById('trader-select');
  const traderValue = traderSelect?.value ? traderSelect.value.trim() : '';

  // Validation: Trader must be selected
  if (!traderValue) {
    showAlert('alert-error', `<i class="fa-solid fa-triangle-exclamation"></i> Lütfen işlemi yapan personeli (Trader) seçiniz!`);
    if (traderSelect) {
      traderSelect.classList.add('input-error');
      traderSelect.focus();
    }
    return;
  }

  traderSelect?.classList.remove('input-error');

  const payload = {
    trader: traderValue,
    type: document.getElementById('trade-type').value,
    amount: document.getElementById('amount').value.trim(),
    price: document.getElementById('price').value.trim(),
    profit: document.getElementById('profit')?.value.trim() || '',
    info: document.getElementById('info').value.trim()
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
  initTraderSelection();
  setTradeType('BUY');
  updatePreview();
  document.getElementById('form-alert').className = 'alert hidden';
}

// Fetch logs history from server
async function fetchLogs() {
  try {
    const res = await fetch('/api/logs');
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

    const traderName = log.trader || 'Ebubekir';

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
