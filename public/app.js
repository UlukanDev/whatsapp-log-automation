let allLogs = [];

// DOM Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTraderSelection();
  loadLogsHistory();
  updatePreview();
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

// Build formatted message string
function generateFormattedMessage() {
  const type = document.getElementById('trade-type').value;
  const amount = document.getElementById('amount').value || '0';
  const price = document.getElementById('price').value || '0';
  const profit = document.getElementById('profit')?.value || '0';
  const trader = document.getElementById('trader-select')?.value || 'Ebubekir';
  const info = document.getElementById('info')?.value.trim();

  let message = '';
  if (type === 'BUY') {
    message = `🔒 BUY: ${amount}bgl\n💥 PRICE: ${price}tl\n👤 TRADER: ${trader}`;
  } else {
    message = `🔒 SOLD: ${amount}bgl\n💸 PROFİT: ${profit}tl\n👤 TRADER: ${trader}`;
  }

  if (info) {
    message += `\nℹ️ INFO: ${info}`;
  }

  return message;
}

// Live Preview Update
function updatePreview() {
  const previewEl = document.getElementById('message-preview');
  if (!previewEl) return;
  previewEl.textContent = generateFormattedMessage();
}

// Handle Form Submission (WhatsApp Scheme Redirection)
function handleSendLog(e) {
  e.preventDefault();

  const type = document.getElementById('trade-type').value;
  const amount = document.getElementById('amount').value.trim();
  const price = document.getElementById('price').value.trim();
  const profit = document.getElementById('profit')?.value.trim() || '';
  const trader = document.getElementById('trader-select')?.value || 'Ebubekir';
  const info = document.getElementById('info').value.trim();

  const formattedText = generateFormattedMessage();
  const encodedText = encodeURIComponent(formattedText);

  // WhatsApp Deep Link / Scheme URL
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  // Save entry to local history
  const logEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    timestamp: new Date().toISOString(),
    trader: trader,
    type: type,
    amount: amount,
    price: price,
    profit: type === 'SOLD' ? profit : undefined,
    info: info,
    formattedText: formattedText,
    status: 'REDIRECTED'
  };

  saveLogEntry(logEntry);

  showAlert('alert-success', `<i class="fa-solid fa-circle-check"></i> Ticaret logu hazırlandı! WhatsApp açılıyor...`);

  // Trigger WhatsApp Deep Link
  window.open(whatsappUrl, '_blank');
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

// Load logs history from LocalStorage
function loadLogsHistory() {
  try {
    const stored = localStorage.getItem('bgl_logs_history');
    if (stored) {
      allLogs = JSON.parse(stored);
    } else {
      allLogs = [];
    }
  } catch (err) {
    allLogs = [];
  }
  renderLogsTable(allLogs);
}

// Save log entry to LocalStorage
function saveLogEntry(entry) {
  allLogs.unshift(entry);
  if (allLogs.length > 100) allLogs.pop(); // Keep last 100 logs
  try {
    localStorage.setItem('bgl_logs_history', JSON.stringify(allLogs));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
  renderLogsTable(allLogs);
}

// Clear all history from LocalStorage
function clearLogsHistory() {
  if (confirm('Tüm gönderim geçmişini temizlemek istediğinize emin misiniz?')) {
    allLogs = [];
    localStorage.removeItem('bgl_logs_history');
    renderLogsTable(allLogs);
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
          <span class="badge badge-success"><i class="fa-brands fa-whatsapp"></i> WhatsApp</span>
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
