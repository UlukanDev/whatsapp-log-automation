const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// WhatsApp Client State
let clientStatus = 'INITIALIZING'; // INITIALIZING, QR_READY, CONNECTED, DISCONNECTED
let currentQr = null;
let clientInfo = null;
const logsHistory = [];

// Initialize WhatsApp Web JS Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// Event: QR Code generated
client.on('qr', (qr) => {
  clientStatus = 'QR_READY';
  currentQr = qr;
  console.log('\n========================================');
  console.log(' [WhatsApp Bot] Lütfen aşağıdaki QR Kodunu okutun:');
  qrcodeTerminal.generate(qr, { small: true });
  console.log('========================================\n');
});

// Event: Client Ready
client.on('ready', () => {
  clientStatus = 'CONNECTED';
  currentQr = null;
  clientInfo = client.info ? {
    pushname: client.info.pushname,
    wid: client.info.wid.user,
    platform: client.info.platform
  } : { pushname: 'WhatsApp User' };

  console.log('🟢 [WhatsApp Bot] Başarıyla bağlandı! Hazır.');
});

// Event: Authentication failure
client.on('auth_failure', (msg) => {
  clientStatus = 'DISCONNECTED';
  currentQr = null;
  console.error('🔴 [WhatsApp Bot] Kimlik doğrulama hatası:', msg);
});

// Event: Disconnected
client.on('disconnected', (reason) => {
  clientStatus = 'DISCONNECTED';
  currentQr = null;
  clientInfo = null;
  console.log('🟡 [WhatsApp Bot] Bağlantı kesildi. Sebep:', reason);
  // Re-initialize after delay
  setTimeout(() => {
    client.initialize().catch(err => console.error('Yeniden başlatma hatası:', err));
  }, 5000);
});

// Start client initialization
client.initialize().catch(err => {
  console.error('WhatsApp Client Başlatma Hatası:', err);
});

// Helper: Format phone number to WhatsApp format (e.g., 905xxxxxxxxx -> 905xxxxxxxxx@c.us)
function formatWhatsAppNumber(phone) {
  let cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  if (!cleaned.endsWith('@c.us')) {
    // Default prefix for Turkey if started with 0 or 5 without country code
    if (cleaned.length === 10 && cleaned.startsWith('5')) {
      cleaned = '90' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('05')) {
      cleaned = '90' + cleaned.substring(1);
    }
    cleaned = `${cleaned}@c.us`;
  }
  return cleaned;
}

// Helper: Format log message for WhatsApp rich text
function formatLogMessage({ level, title, source, message, details }) {
  const levelEmojis = {
    INFO: 'ℹ️',
    SUCCESS: '✅',
    WARN: '⚠️',
    ERROR: '🚨'
  };

  const emoji = levelEmojis[level.toUpperCase()] || '📋';
  const timestamp = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  let text = `${emoji} *[${level.toUpperCase()}] ${title}*\n`;
  text += `⏱️ *Tarih:* ${timestamp}\n`;
  if (source) {
    text += `📍 *Kaynak:* ${source}\n`;
  }
  text += `\n📝 *Mesaj:*\n${message}\n`;

  if (details && details.trim()) {
    text += `\n🔍 *Detaylar / Log Payload:*\n\`\`\`\n${details.trim()}\n\`\`\``;
  }

  text += `\n\n_🤖 WhatsApp Log Otomasyonu ile gönderildi._`;
  return text;
}

// API Routes

// 1. Get Status and QR Code
app.get('/api/status', (req, res) => {
  res.json({
    status: clientStatus,
    qr: currentQr,
    clientInfo: clientInfo,
    timestamp: new Date().toISOString()
  });
});

// 2. Send Log via WhatsApp
app.post('/api/send-log', async (req, res) => {
  try {
    const { phone, level = 'INFO', title, source, message, details } = req.body;

    const targetPhone = phone || process.env.DEFAULT_TARGET_NUMBER;

    if (!targetPhone) {
      return res.status(400).json({
        success: false,
        error: 'Hedef telefon numarası belirtilmedi ve .env içinde Varsayılan Numara bulunamadı.'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Başlık (title) ve Mesaj (message) alanları zorunludur.'
      });
    }

    if (clientStatus !== 'CONNECTED') {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp istemcisi henüz bağlı değil. Lütfen QR kodunu okutun ve tekrar deneyin.'
      });
    }

    const formattedNumber = formatWhatsAppNumber(targetPhone);
    const formattedText = formatLogMessage({ level, title, source, message, details });

    // Send WhatsApp message
    const sendResult = await client.sendMessage(formattedNumber, formattedText);

    const logEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      recipient: formattedNumber.replace('@c.us', ''),
      level: level.toUpperCase(),
      title,
      source: source || 'Sistem',
      message,
      details,
      status: 'SENT',
      messageId: sendResult.id._serialized
    };

    logsHistory.unshift(logEntry);
    if (logsHistory.length > 100) logsHistory.pop(); // Keep last 100 logs

    console.log(`✅ [Log Sent] -> ${formattedNumber}: [${level}] ${title}`);

    return res.json({
      success: true,
      message: 'Log WhatsApp üzerinden başarıyla gönderildi.',
      log: logEntry
    });

  } catch (error) {
    console.error('❌ [Log Send Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Log gönderilirken sunucu hatası oluştu.'
    });
  }
});

// 3. Get Logs History
app.get('/api/logs', (req, res) => {
  res.json({
    success: true,
    total: logsHistory.length,
    logs: logsHistory
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 [Server] Sunucu http://localhost:${PORT} adresinde yayında.`);
  console.log(`📱 [Web UI] Arayüze erişmek için tarayıcıda http://localhost:${PORT} açabilirsiniz.`);
});
