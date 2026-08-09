const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const pino = require('pino');

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  BufferJSON,
  proto
} = require('@whiskeysockets/baileys');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Keep-Alive /ping Endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

// Serve admin page directly at /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// WhatsApp Client State (Baileys)
let clientStatus = 'INITIALIZING'; // INITIALIZING, QR_READY, CONNECTED, DISCONNECTED
let currentQr = null;
let clientInfo = null;
let waSock = null;
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
    CREATE TABLE IF NOT EXISTS auth_state (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

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

// SQLite Auth Storage Helpers for Baileys
function getAuthData(id) {
  return new Promise((resolve) => {
    db.get('SELECT value FROM auth_state WHERE id = ?', [id], (err, row) => {
      if (err || !row) return resolve(null);
      try {
        const parsed = JSON.parse(row.value, BufferJSON.reviver);
        resolve(parsed);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

function setAuthData(id, value) {
  return new Promise((resolve, reject) => {
    if (value === null || value === undefined) {
      db.run('DELETE FROM auth_state WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      const json = JSON.stringify(value, BufferJSON.replacer);
      db.run(
        'INSERT OR REPLACE INTO auth_state (id, value) VALUES (?, ?)',
        [id, json],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    }
  });
}

function removeAuthData(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM auth_state WHERE id = ?', [id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function clearAllAuthData() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM auth_state', [], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function migrateFileAuthToDb() {
  try {
    const authDir = path.join(__dirname, 'data', 'auth_info_baileys');
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      if (files.length > 0) {
        console.log('🔄 [SQLite Auth Migration] Dosya tabanlı oturum verileri SQLite veritabanına taşınıyor...');
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(authDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            try {
              const parsed = JSON.parse(content, BufferJSON.reviver);
              let id = file.replace('.json', '');
              await setAuthData(id, parsed);
            } catch (e) {}
          }
        }
        console.log('✅ [SQLite Auth Migration] Oturum verileri veritabanına aktarıldı.');
      }
    }
  } catch (err) {
    console.warn('⚠️ [SQLite Auth Migration Warning]:', err.message);
  }
}

async function useSQLiteAuthState() {
  // Ensure auth_state table exists
  await new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS auth_state (
        id TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const existingCreds = await getAuthData('creds');
  if (!existingCreds) {
    await migrateFileAuthToDb();
  }

  const creds = (await getAuthData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await getAuthData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const keyId = `${category}-${id}`;
              tasks.push(value ? setAuthData(keyId, value) : removeAuthData(keyId));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      return setAuthData('creds', creds);
    },
    clearState: async () => {
      return clearAllAuthData();
    }
  };
}

// Baileys Connection Setup
async function startBaileys() {
  try {
    const { state, saveCreds } = await useSQLiteAuthState();
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    console.log(`📱 [Baileys Engine] SQLite veritabanı tabanlı WhatsApp başlatılıyor (v${version.join('.')})...`);

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['BGL Trade System', 'Chrome', '1.0.0']
    });

    waSock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        clientStatus = 'QR_READY';
        currentQr = qr;
        console.log('\n========================================');
        console.log(' 📱 [Baileys WhatsApp Bot] Yeni QR Kod Üretildi:');
        qrcodeTerminal.generate(qr, { small: true });
        console.log('========================================\n');
      }

      if (connection === 'close') {
        clientStatus = 'DISCONNECTED';
        currentQr = null;
        clientInfo = null;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`🟡 [Baileys WhatsApp] Bağlantı kesildi (Status: ${statusCode || 'Unknown'}). Yeniden bağlanılıyor mu: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => {
            startBaileys().catch(err => console.error('Baileys Yeniden Başlatma Hatası:', err));
          }, 3000);
        } else {
          console.log('🔴 [Baileys WhatsApp] Oturum kapatıldı (Logged Out). Veritabanı kimlik verileri temizleniyor...');
          try {
            await clearAllAuthData();
          } catch (e) {}
          setTimeout(() => {
            startBaileys().catch(err => console.error('Baileys Yeniden Başlatma Hatası:', err));
          }, 3000);
        }
      } else if (connection === 'open') {
        clientStatus = 'CONNECTED';
        currentQr = null;
        const userJid = sock.user?.id ? sock.user.id.split(':')[0] : 'Admin';
        clientInfo = {
          pushname: sock.user?.name || sock.user?.notify || 'BGL Admin',
          wid: userJid,
          platform: 'Baileys Multi-Device WebSocket (SQLite Auth)'
        };

        console.log('🟢 [Baileys WhatsApp] Başarıyla bağlandı! Işık hızında WhatsApp Bot aktif.');
        console.log(`🎯 [Hedef Log Grubu]: \x1b[32m${TARGET_GROUP_ID}\x1b[0m\n`);
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      try {
        if (!m.messages || !m.messages.length) return;
        const msg = m.messages[0];
        if (!msg.message) return;

        const remoteJid = msg.key.remoteJid;

        if (remoteJid === TARGET_GROUP_ID) {
          const isOutgoing = msg.key.fromMe;
          const typeTag = isOutgoing ? '\x1b[33m📤 [Giden Mesaj]\x1b[0m' : '\x1b[36m📩 [Gelen Mesaj]\x1b[0m';
          const content = msg.message.conversation || msg.message.extendedTextMessage?.text || '[Medya/İçerik]';

          console.log(`${typeTag} \x1b[1mSohbet ID:\x1b[0m \x1b[32m${remoteJid}\x1b[0m | \x1b[1mİçerik:\x1b[0m ${content}`);
        }
      } catch (err) {
        console.error('⚠️ [Baileys Mesaj İşleme Hatası]:', err.message);
      }
    });

  } catch (err) {
    console.error('❌ [Baileys Başlatma Hatası]:', err);
    clientStatus = 'DISCONNECTED';
    setTimeout(() => {
      startBaileys().catch(e => console.error(e));
    }, 5000);
  }
}

// Start Baileys initialization
startBaileys();

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

    if (clientStatus !== 'CONNECTED' || !waSock) {
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

    // Ensure target JID format
    let targetJid = TARGET_GROUP_ID.trim();
    if (!targetJid.includes('@g.us') && !targetJid.includes('@s.whatsapp.net')) {
      targetJid = `${targetJid}@g.us`;
    }

    // Send WhatsApp message directly via Baileys socket
    const sendResult = await waSock.sendMessage(targetJid, { text: formattedText });

    const messageId = sendResult?.key?.id || null;

    const logEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      recipient: targetJid.replace('@g.us', '').replace('@s.whatsapp.net', ''),
      trader: String(trader).trim(),
      type: String(type).toUpperCase(),
      amount,
      price,
      profit: type === 'SOLD' ? profit : undefined,
      info: info || '',
      formattedText,
      status: 'SENT',
      messageId
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

// Edit Log Entry (Admin Only)
app.post('/api/admin/edit-log', (req, res) => {
  const { id, amount, price, profit, type, info, adminToken } = req.body;
  const authHeader = req.headers.authorization;

  if (authHeader !== 'Bearer admin_session_bayro3100' && adminToken !== 'admin_session_bayro3100' && req.query.adminKey !== 'bayro3100') {
    return res.status(403).json({ success: false, error: 'Yetkisiz admin erişimi.' });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: 'Log ID gereklidir.' });
  }

  db.get(`SELECT * FROM logs WHERE id = ?`, [String(id)], (err, log) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!log) return res.status(404).json({ success: false, error: 'Log kaydı bulunamadı.' });

    const newType = String(type || log.type).toUpperCase();
    const newAmount = String(amount !== undefined ? amount : log.amount);
    const newPrice = String(price !== undefined ? price : log.price);
    const newProfit = newType === 'SOLD' ? (profit !== undefined && profit !== null ? String(profit) : (log.profit || '0')) : null;
    const newInfo = info !== undefined ? String(info) : (log.info || '');

    const newFormattedText = formatTradeLogMessage({
      type: newType,
      amount: newAmount,
      price: newPrice,
      profit: newProfit,
      info: newInfo,
      trader: log.trader
    });

    const sql = `
      UPDATE logs 
      SET type = ?, amount = ?, price = ?, profit = ?, info = ?, formattedText = ?
      WHERE id = ?
    `;

    db.run(sql, [newType, newAmount, newPrice, newProfit, newInfo, newFormattedText, String(id)], function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });

      const memoryIdx = logsHistory.findIndex(l => l.id === id);
      if (memoryIdx !== -1) {
        logsHistory[memoryIdx].type = newType;
        logsHistory[memoryIdx].amount = newAmount;
        logsHistory[memoryIdx].price = newPrice;
        logsHistory[memoryIdx].profit = newProfit;
        logsHistory[memoryIdx].info = newInfo;
        logsHistory[memoryIdx].formattedText = newFormattedText;
      }

      console.log(`✏️ [Log Edit] Log ID ${id} (${log.trader}) güncellendi: [${newType}] ${newAmount}bgl`);
      res.json({ success: true, message: 'Log kaydı başarıyla güncellendi.' });
    });
  });
});

// Delete Log Entry (Admin Only)
app.post('/api/admin/delete-log', (req, res) => {
  const { id, adminToken } = req.body;
  const authHeader = req.headers.authorization;

  if (authHeader !== 'Bearer admin_session_bayro3100' && adminToken !== 'admin_session_bayro3100' && req.query.adminKey !== 'bayro3100') {
    return res.status(403).json({ success: false, error: 'Yetkisiz admin erişimi.' });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: 'Silinecek log ID gereklidir.' });
  }

  const sql = `DELETE FROM logs WHERE id = ?`;
  db.run(sql, [String(id)], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, error: 'Log kaydı bulunamadı.' });

    const memoryIdx = logsHistory.findIndex(l => l.id === id);
    if (memoryIdx !== -1) {
      logsHistory.splice(memoryIdx, 1);
    }

    console.log(`🗑️ [Log Delete] Log ID ${id} veritabanından silindi.`);
    res.json({ success: true, message: 'Log kaydı başarıyla silindi.' });
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
