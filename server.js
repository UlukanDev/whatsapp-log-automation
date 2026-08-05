const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const path = require('path');

const fs = require('fs');

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
let cachedGroups = [];
const logsHistory = [];
const TARGET_GROUP_ID = process.env.TARGET_GROUP_ID || '120363288734876760@g.us';

// Helper: Auto-detect system Chrome / Edge executable on Windows
function getSystemChromePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

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
  console.log(`🎯 [Hedef Log Grubu]: \x1b[32m${TARGET_GROUP_ID}\x1b[0m\n`);
});

// Event: Message Created (Gelen ve Giden Mesajlar - Sadece Hedef Grup)
client.on('message_create', async (msg) => {
  try {
    const isOutgoing = msg.fromMe;
    let chatId = isOutgoing ? msg.to : msg.from;

    let chatName = 'Bilinmiyor';
    try {
      const chat = await msg.getChat();
      if (chat) {
        chatName = chat.name || chatName;
        if (chat.id && chat.id._serialized) {
          chatId = chat.id._serialized;
        }
      }
    } catch (e) {
      // Fallback
    }

    // Filtre: Sadece hedef grup ID'si (120363288734876760@g.us) olan mesajları terminale bas
    if (chatId !== TARGET_GROUP_ID && msg.from !== TARGET_GROUP_ID && msg.to !== TARGET_GROUP_ID) {
      return;
    }

    const typeTag = isOutgoing ? '\x1b[33m📤 [Giden Mesaj]\x1b[0m' : '\x1b[36m📩 [Gelen Mesaj]\x1b[0m';
    const content = msg.body || (msg.hasMedia ? '[Medya/Görsel]' : '');

    console.log(`${typeTag} \x1b[1mSohbet:\x1b[0m \x1b[35m${chatName}\x1b[0m | \x1b[1mSohbet ID:\x1b[0m \x1b[32m${chatId}\x1b[0m | \x1b[1mİçerik:\x1b[0m ${content}`);
  } catch (err) {
    console.error('⚠️ [Mesaj İşleme Hatası]:', err.message);
  }
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
  cachedGroups = [];
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

// Helper: Format phone number or group ID to WhatsApp format
function formatWhatsAppNumber(phone) {
  const trimmed = String(phone).trim();
  // Group ID (@g.us) or direct chat ID (@c.us) check
  if (trimmed.endsWith('@g.us') || trimmed.endsWith('@c.us')) {
    return trimmed;
  }
  let cleaned = trimmed.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.length === 10 && cleaned.startsWith('5')) {
    cleaned = '90' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('05')) {
    cleaned = '90' + cleaned.substring(1);
  }
  return `${cleaned}@c.us`;
}

// Helper: Format BGL Trade Log message for WhatsApp
function formatTradeLogMessage({ type, amount, price, profit, info, trader }) {
  const isBuy = String(type || 'BUY').toUpperCase() === 'BUY';
  const infoText = (info && String(info).trim()) ? String(info).trim() : '';
  const traderText = (trader && String(trader).trim()) ? String(trader).trim() : 'Ebubekir';

  if (isBuy) {
    let msg = `🔒 BUY: ${amount || 0}bgl\n💥 PRICE: ${price || 0}tl\n👤 TRADER: ${traderText}`;
    if (infoText) {
      msg += `\nℹ️ INFO: ${infoText}`;
    }
    return msg;
  } else {
    let msg = `🔒 SOLD: ${amount || 0}bgl\n💸 PROFİT: ${profit || 0}tl\n👤 TRADER: ${traderText}`;
    if (infoText) {
      msg += `\nℹ️ INFO: ${infoText}`;
    }
    return msg;
  }
}

// API Routes

// 1. Get Status and QR Code
app.get('/api/status', (req, res) => {
  res.json({
    status: clientStatus,
    qr: currentQr,
    clientInfo: clientInfo,
    targetGroup: TARGET_GROUP_ID,
    timestamp: new Date().toISOString()
  });
});

// 2. Send BGL Trade Log via WhatsApp
app.post('/api/send-log', async (req, res) => {
  try {
    const { to, groupId, phone, type = 'BUY', amount, price, profit, info, trader, message } = req.body;

    const targetGroup = to || groupId || phone || TARGET_GROUP_ID;

    if (clientStatus !== 'CONNECTED') {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp istemcisi henüz bağlı değil. Lütfen önce QR kodunu okutun.'
      });
    }

    // Build trade log formatted message (or use raw message if provided)
    let formattedText = '';
    if (message) {
      formattedText = message;
    } else {
      formattedText = formatTradeLogMessage({ type, amount, price, profit, info, trader });
    }

    const formattedTarget = formatWhatsAppNumber(targetGroup);

    // Send WhatsApp message
    const sendResult = await client.sendMessage(formattedTarget, formattedText);

    const logEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      recipient: formattedTarget.replace('@c.us', '').replace('@g.us', ''),
      trader: trader || 'Ebubekir',
      type: String(type).toUpperCase(),
      amount,
      price,
      profit: type === 'SOLD' ? profit : undefined,
      info: info || '',
      formattedText,
      status: 'SENT',
      messageId: (sendResult && sendResult.id) ? (sendResult.id._serialized || sendResult.id) : null
    };

    logsHistory.unshift(logEntry);
    if (logsHistory.length > 100) logsHistory.pop(); // Keep last 100 logs

    console.log(`✅ [BGL Trade Log Sent] -> ${formattedTarget}: [${type}] ${amount}bgl`);

    return res.json({
      success: true,
      message: 'Ticaret logu WhatsApp üzerine başarıyla gönderildi.',
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

// 3. Get Groups List (Group ID finder)
app.get('/api/groups', async (req, res) => {
  try {
    if (clientStatus !== 'CONNECTED') {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp istemcisi henüz bağlı değil.'
      });
    }

    // Try fetching fresh groups if connected, or fallback to cachedGroups
    try {
      const chats = await client.getChats();
      const groups = chats.filter(chat => chat.isGroup);
      cachedGroups = groups.map(g => ({
        id: g.id._serialized,
        name: g.name,
        unreadCount: g.unreadCount || 0,
        timestamp: g.timestamp ? new Date(g.timestamp * 1000).toISOString() : null
      }));
    } catch (e) {
      console.warn('⚡ [getChats fallback to cachedGroups]:', e.message);
    }

    return res.json({
      success: true,
      total: cachedGroups.length,
      groups: cachedGroups
    });

  } catch (error) {
    console.error('❌ [/api/groups Hata]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gruplar çekilirken hata oluştu.'
    });
  }
});

// 4. Get Logs History
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
