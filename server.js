const path = require('path');
process.env.PUPPETEER_CACHE_DIR = process.env.PUPPETEER_CACHE_DIR || path.resolve(__dirname, '.cache/puppeteer');

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve admin page directly at /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// WhatsApp Client State
let clientStatus = 'INITIALIZING'; // INITIALIZING, QR_READY, CONNECTED, DISCONNECTED
let currentQr = null;
let clientInfo = null;
const logsHistory = [];
const TARGET_GROUP_ID = process.env.TARGET_GROUP_ID || '120363288734876760@g.us';

// Initialize SQLite Database in data/system.db
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'system.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ [SQLite Database Error]:', err.message);
  } else {
    console.log('🗄️ [SQLite Database] Kalıcı veritabanı aktif:', dbPath);
  }
});

// Initial Personnel Users & Passwords
const INITIAL_USERS = [
  { name: 'Ulukan', password: 'ulubaba1' },
  { name: 'Cagan', password: '2525' },
  { name: 'Alper', password: '2040' },
  { name: 'Sefa', password: '1090' },
  { name: 'Yakup', password: '5060' },
  { name: 'Efe', password: '0208' },
  { name: 'Emir', password: '7209' }
];

// Create tables if not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      trader TEXT,
      type TEXT NOT NULL,
      amount TEXT NOT NULL,
      price TEXT NOT NULL,
      profit TEXT,
      info TEXT,
      formattedText TEXT,
      status TEXT DEFAULT 'SENT',
      messageId TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      name TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'trader',
      updatedAt TEXT
    )
  `, () => {
    // Seed initial users if table empty or missing entries
    const stmt = db.prepare("INSERT OR IGNORE INTO users (name, password, role, updatedAt) VALUES (?, ?, 'trader', ?)");
    const now = new Date().toISOString();
    INITIAL_USERS.forEach(u => {
      stmt.run(u.name, u.password, now);
    });
    stmt.finalize();
  });
});

// Helper: Save log entry to SQLite
function saveLogToDb(logEntry) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO logs (id, timestamp, trader, type, amount, price, profit, info, formattedText, status, messageId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      logEntry.id,
      logEntry.timestamp,
      logEntry.trader || 'Ulukan',
      logEntry.type,
      String(logEntry.amount || ''),
      String(logEntry.price || ''),
      logEntry.profit !== undefined && logEntry.profit !== null ? String(logEntry.profit) : null,
      logEntry.info || '',
      logEntry.formattedText || '',
      logEntry.status || 'SENT',
      logEntry.messageId || null
    ];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('⚠️ [SQLite Save Error]:', err.message);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Helper: Fetch logs from SQLite
function getLogsFromDb() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('⚠️ [SQLite Select Error]:', err.message);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Helper: Auto-detect system Chrome / Edge executable on Windows or fallback to Puppeteer Chromium
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
  try {
    return puppeteer.executablePath();
  } catch (e) {
    return undefined;
  }
}

// Initialize WhatsApp Web JS Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: '.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || getSystemChromePath(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process'
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

    // Sadece hedef grup ID'si (120363288734876760@g.us) olan mesajları terminale bas
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
  console.log('🟡 [WhatsApp Bot] Bağlantı kesildi. Sebep:', reason);
  setTimeout(() => {
    client.initialize().catch(err => console.error('Yeniden başlatma hatası:', err));
  }, 5000);
});

// Start client initialization
client.initialize().catch(err => {
  console.error('WhatsApp Client Başlatma Hatası:', err);
});

// Helper: Format BGL Trade Log message for WhatsApp
function formatTradeLogMessage({ type, amount, price, profit, info, trader }) {
  const isBuy = String(type || 'BUY').toUpperCase() === 'BUY';
  const infoText = (info && String(info).trim()) ? String(info).trim() : '';
  const adminText = (trader && String(trader).trim()) ? String(trader).trim() : 'Ulukan';

  if (isBuy) {
    let msg = `🔒 BUY: ${amount || 0}bgl\n💥 PRICE: ${price || 0}tl`;
    if (infoText) {
      msg += `\nℹ️ INFO: ${infoText}`;
    }
    msg += `\n👤 ADMİN: ${adminText}`;
    return msg;
  } else {
    let msg = `🔒 SOLD: ${amount || 0}bgl\n💸 PROFİT: ${profit || 0}tl`;
    if (infoText) {
      msg += `\nℹ️ INFO: ${infoText}`;
    }
    msg += `\n👤 ADMİN: ${adminText}`;
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

// 2. Personel Login API
app.post('/api/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ success: false, error: 'Personel ismi ve şifre zorunludur.' });
  }

  const sql = `SELECT * FROM users WHERE LOWER(name) = LOWER(?) AND password = ?`;
  db.get(sql, [String(name).trim(), String(password).trim()], (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Veritabanı hatası.' });
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'Hatalı şifre veya personel seçimi!' });
    }
    return res.json({
      success: true,
      message: 'Giriş başarılı!',
      user: {
        name: user.name,
        role: user.role
      }
    });
  });
});

// 3. Get Personnel Users List
app.get('/api/users', (req, res) => {
  db.all(`SELECT name FROM users ORDER BY name ASC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, users: rows.map(r => r.name) });
  });
});

// 4. Send BGL Trade Log via WhatsApp
app.post('/api/send-log', async (req, res) => {
  try {
    const { type = 'BUY', amount, price, profit, info, trader, message } = req.body;

    if (!trader || String(trader).trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'İşlemi yapan personel seçilmedi. Lütfen oturum açın.'
      });
    }

    if (clientStatus !== 'CONNECTED') {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp istemcisi henüz bağlı değil. Lütfen Admin QR kodunu okutana kadar bekleyin.'
      });
    }

    // Build trade log formatted message (or use raw message if provided)
    let formattedText = '';
    if (message) {
      formattedText = message;
    } else {
      formattedText = formatTradeLogMessage({ type, amount, price, profit, info, trader });
    }

    // Send WhatsApp message directly to target group ID
    const sendResult = await client.sendMessage(TARGET_GROUP_ID, formattedText);

    const logEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      recipient: TARGET_GROUP_ID.replace('@g.us', ''),
      trader: String(trader).trim(),
      type: String(type).toUpperCase(),
      amount,
      price,
      profit: type === 'SOLD' ? profit : undefined,
      info: info || '',
      formattedText,
      status: 'SENT',
      messageId: (sendResult && sendResult.id) ? (sendResult.id._serialized || sendResult.id) : null
    };

    // Save to SQLite Database
    try {
      await saveLogToDb(logEntry);
    } catch (dbErr) {
      console.warn('⚡ [SQLite Save Fallback]:', dbErr.message);
    }

    logsHistory.unshift(logEntry);
    if (logsHistory.length > 100) logsHistory.pop(); // Keep last 100 logs in memory

    console.log(`✅ [BGL Trade Log Sent] -> ${TARGET_GROUP_ID}: [${type}] ${amount}bgl by ${trader}`);

    return res.json({
      success: true,
      message: 'Ticaret logu WhatsApp grubuna başarıyla gönderildi.',
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

// 5. Get Logs History from SQLite Database
app.get('/api/logs', async (req, res) => {
  try {
    const dbLogs = await getLogsFromDb();
    res.json({
      success: true,
      total: dbLogs.length,
      logs: dbLogs
    });
  } catch (err) {
    res.json({
      success: true,
      total: logsHistory.length,
      logs: logsHistory
    });
  }
});

// 6. Admin Login API (Master Password: bayro3100)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'bayro3100') {
    return res.json({
      success: true,
      message: 'Admin girişi başarılı!',
      token: 'admin_session_bayro3100'
    });
  } else {
    return res.status(401).json({
      success: false,
      error: 'Hatalı Admin Ana Şifresi!'
    });
  }
});

// 7. Get All Personnel Passwords (Admin Only)
app.get('/api/admin/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== 'Bearer admin_session_bayro3100' && req.query.adminKey !== 'bayro3100') {
    return res.status(403).json({ success: false, error: 'Yetkisiz erişim.' });
  }

  db.all(`SELECT name, password, role, updatedAt FROM users ORDER BY name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, users: rows });
  });
});

// 8. Update Personnel Password (Admin Only)
app.post('/api/admin/update-password', (req, res) => {
  const { name, newPassword, adminToken } = req.body;
  const authHeader = req.headers.authorization;

  if (authHeader !== 'Bearer admin_session_bayro3100' && adminToken !== 'admin_session_bayro3100') {
    return res.status(403).json({ success: false, error: 'Yetkisiz admin erişimi.' });
  }

  if (!name || !newPassword) {
    return res.status(400).json({ success: false, error: 'Personel ismi ve yeni şifre gereklidir.' });
  }

  const sql = `UPDATE users SET password = ?, updatedAt = ? WHERE name = ?`;
  const now = new Date().toISOString();

  db.run(sql, [String(newPassword).trim(), now, String(name).trim()], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, error: 'Personel bulunamadı.' });

    console.log(`🔑 [Password Update] Personel: ${name} şifresi başarıyla değiştirildi.`);
    res.json({ success: true, message: `${name} isimli personelin şifresi güncellendi.` });
  });
});

// Add New Personnel User (Admin Only)
app.post('/api/admin/add-user', (req, res) => {
  const { name, password, adminToken } = req.body;
  const authHeader = req.headers.authorization;

  if (authHeader !== 'Bearer admin_session_bayro3100' && adminToken !== 'admin_session_bayro3100') {
    return res.status(403).json({ success: false, error: 'Yetkisiz admin erişimi.' });
  }

  if (!name || !password) {
    return res.status(400).json({ success: false, error: 'Personel ismi ve şifre zorunludur.' });
  }

  const cleanName = String(name).trim();
  const cleanPass = String(password).trim();
  const now = new Date().toISOString();

  // Check if user already exists
  db.get(`SELECT name FROM users WHERE LOWER(name) = LOWER(?)`, [cleanName], (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (existing) {
      return res.status(400).json({ success: false, error: `'${cleanName}' isimli personel zaten kayıtlı!` });
    }

    const sql = `INSERT INTO users (name, password, role, updatedAt) VALUES (?, ?, 'trader', ?)`;
    db.run(sql, [cleanName, cleanPass, now], function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });

      console.log(`👤 [User Added] Yeni personel eklendi: ${cleanName}`);
      res.json({ success: true, message: `'${cleanName}' isimli personel başarıyla eklendi.` });
    });
  });
});

// Delete Personnel User (Admin Only)
app.post('/api/admin/delete-user', (req, res) => {
  const { name, adminToken } = req.body;
  const authHeader = req.headers.authorization;

  if (authHeader !== 'Bearer admin_session_bayro3100' && adminToken !== 'admin_session_bayro3100') {
    return res.status(403).json({ success: false, error: 'Yetkisiz admin erişimi.' });
  }

  if (!name) {
    return res.status(400).json({ success: false, error: 'Silinecek personel ismi gereklidir.' });
  }

  const cleanName = String(name).trim();

  const sql = `DELETE FROM users WHERE LOWER(name) = LOWER(?)`;
  db.run(sql, [cleanName], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, error: 'Personel bulunamadı.' });

    console.log(`🗑️ [User Deleted] Personel silindi: ${cleanName}`);
    res.json({ success: true, message: `'${cleanName}' isimli personel sistemden kaldırıldı.` });
  });
});

// 9. Accounting & Analytics API (Admin Only)
app.get('/api/admin/accounting', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== 'Bearer admin_session_bayro3100' && req.query.adminKey !== 'bayro3100') {
    return res.status(403).json({ success: false, error: 'Yetkisiz admin erişimi.' });
  }

  db.all(`SELECT * FROM logs ORDER BY timestamp DESC`, [], (err, logs) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    let totalBuyAmount = 0;
    let totalBuyPrice = 0;
    let totalSoldAmount = 0;
    let totalSoldPrice = 0;
    let totalProfit = 0;
    let totalTrades = logs.length;

    const adminStats = {};

    logs.forEach(log => {
      const trader = log.trader || 'Bilinmiyor';
      if (!adminStats[trader]) {
        adminStats[trader] = {
          trader,
          buyCount: 0,
          buyAmount: 0,
          buyPrice: 0,
          soldCount: 0,
          soldAmount: 0,
          soldProfit: 0,
          totalTrades: 0
        };
      }

      const amt = parseFloat(log.amount) || 0;
      const prc = parseFloat(log.price) || 0;
      const prft = parseFloat(log.profit) || 0;

      adminStats[trader].totalTrades += 1;

      if (log.type === 'BUY') {
        totalBuyAmount += amt;
        totalBuyPrice += prc;
        adminStats[trader].buyCount += 1;
        adminStats[trader].buyAmount += amt;
        adminStats[trader].buyPrice += prc;
        adminStats[trader].currentStock = (adminStats[trader].currentStock || 0) + amt;
      } else if (log.type === 'SOLD') {
        totalSoldAmount += amt;
        totalSoldPrice += prc;
        totalProfit += prft;
        adminStats[trader].soldCount += 1;
        adminStats[trader].soldAmount += amt;
        adminStats[trader].soldProfit += prft;
        adminStats[trader].currentStock = (adminStats[trader].currentStock || 0) - amt;
      }
    });

    res.json({
      success: true,
      summary: {
        totalTrades,
        totalBuyAmount,
        totalBuyPrice,
        totalSoldAmount,
        totalSoldPrice,
        totalProfit
      },
      adminBreakdown: Object.values(adminStats)
    });
  });
});

// 10. Get Personal Stock Balance (Supports Negative Balance)
app.get('/api/stock', (req, res) => {
  const trader = req.query.trader;
  
  db.all(`SELECT trader, type, amount FROM logs`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    const stocksMap = {};

    rows.forEach(r => {
      const tName = r.trader || 'Bilinmiyor';
      if (stocksMap[tName] === undefined) stocksMap[tName] = 0;
      const amt = parseFloat(r.amount) || 0;
      if (r.type === 'BUY') {
        stocksMap[tName] += amt;
      } else if (r.type === 'SOLD') {
        stocksMap[tName] -= amt;
      }
    });

    if (trader) {
      let matchedStock = 0;
      Object.keys(stocksMap).forEach(key => {
        if (key.toLowerCase() === String(trader).trim().toLowerCase()) {
          matchedStock = stocksMap[key];
        }
      });
      return res.json({ success: true, trader, stock: matchedStock });
    }

    return res.json({ success: true, stocks: stocksMap });
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 [Server] Sunucu http://localhost:${PORT} adresinde yayında.`);
  console.log(`📱 [Web UI] Main App: http://localhost:${PORT}`);
  console.log(`🛡️ [Admin UI] Admin Panel: http://localhost:${PORT}/admin`);
});
