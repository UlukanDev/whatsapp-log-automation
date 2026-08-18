const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'system.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
    process.exit(1);
  }
});

const newLogs = [
  // 00 Öncesi Loglar
  { type: 'SOLD', amount: 9.8, profit: 49, price: 0, info: '6901', admin: 'Eker', date: '2026-08-17T10:02:00.000Z' },
  { type: 'SOLD', amount: 9.8, profit: 49, price: 0, info: '6901', admin: 'Eker', date: '2026-08-17T10:04:00.000Z' },
  { type: 'SOLD', amount: 16, profit: 80, price: 0, info: '8757', admin: 'Eker', date: '2026-08-17T10:06:00.000Z' },
  { type: 'SOLD', amount: 5.9, profit: 29.5, price: 0, info: '2710', admin: 'Eker', date: '2026-08-17T10:08:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '6620', admin: 'Eker', date: '2026-08-17T10:10:00.000Z' },
  { type: 'SOLD', amount: 25, profit: 125, price: 0, info: '6620', admin: 'Eker', date: '2026-08-17T10:12:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: '6913', admin: 'Eker', date: '2026-08-17T10:14:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 90, info: '8757', admin: 'Eker', date: '2026-08-17T10:16:00.000Z' },
  { type: 'SOLD', amount: 56.5, profit: 0, price: 0, info: '(90-90)', admin: 'Eker', date: '2026-08-17T10:18:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 91, info: '4824', admin: 'berke', date: '2026-08-17T10:20:00.000Z' },
  { type: 'SOLD', amount: 7.4, profit: 66.6, price: 0, info: '2710 (91-100)', admin: 'berke', date: '2026-08-17T10:22:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 91, info: '1461', admin: 'berke', date: '2026-08-17T10:24:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 63, price: 0, info: '2710 (91-100)', admin: 'berke', date: '2026-08-17T10:26:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 400, price: 0, info: '06 22 (92-100)', admin: 'berke', date: '2026-08-17T10:28:00.000Z' },
  { type: 'SOLD', amount: 9, profit: 72, price: 0, info: '5258 (92-100)', admin: 'berke', date: '2026-08-17T10:30:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '4129 (92-100)', admin: 'berke', date: '2026-08-17T10:32:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 39, price: 0, info: '8056 (92-105)', admin: 'berke', date: '2026-08-17T10:34:00.000Z' },
  { type: 'SOLD', amount: 8, profit: 64, price: 0, info: 'ulas1221 (92-100)', admin: 'berke', date: '2026-08-17T10:36:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 160, price: 0, info: '2844 (92-100)', admin: 'berke', date: '2026-08-17T10:38:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 93.5, info: 'doge', admin: 'berke', date: '2026-08-17T10:40:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 180, price: 0, info: '9209 (94-100)', admin: 'berke', date: '2026-08-17T10:42:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 90, price: 0, info: '3597 (94-100)', admin: 'berke', date: '2026-08-17T10:44:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 12, price: 0, info: '5233 (94-100)', admin: 'berke', date: '2026-08-17T10:46:00.000Z' },
  { type: 'BUY', amount: 42, profit: 0, price: 95, info: 'turab', admin: 'berke', date: '2026-08-17T10:48:00.000Z' },
  { type: 'BUY', amount: 31313131, profit: 0, price: 31, info: '31', admin: 'Ulukan', date: '2026-08-17T10:50:00.000Z' },
  { type: 'SOLD', amount: 31313131, profit: 0, price: 0, info: '31 31 (0-0)', admin: 'Ulukan', date: '2026-08-17T10:52:00.000Z' },
  { type: 'SOLD', amount: 100, profit: 400, price: 0, info: '0903 (96-100)', admin: 'berke', date: '2026-08-17T10:54:00.000Z' },
  { type: 'BUY', amount: 29, profit: 0, price: 93, info: '0598', admin: 'berke', date: '2026-08-17T10:56:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '4412 (95-100)', admin: 'berke', date: '2026-08-17T10:58:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '4412 (95-100)', admin: 'berke', date: '2026-08-17T11:00:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 150, price: 0, info: '6620 (95-100)', admin: 'berke', date: '2026-08-17T11:02:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '1098 (94-100)', admin: 'berke', date: '2026-08-17T11:04:00.000Z' },
  { type: 'BUY', amount: 80, profit: 0, price: 94, info: '8620', admin: 'berke', date: '2026-08-17T11:06:00.000Z' },
  { type: 'SOLD', amount: 82, profit: 656, price: 0, info: '3140 (92-100)', admin: 'berke', date: '2026-08-17T11:08:00.000Z' },
  { type: 'BUY', amount: 4, profit: 0, price: 91, info: '3419', admin: 'berke', date: '2026-08-17T11:10:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 91, info: '1221', admin: 'berke', date: '2026-08-17T11:12:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 100, price: 0, info: '34 65 (93-98)', admin: 'berke', date: '2026-08-17T11:14:00.000Z' },
  { type: 'SOLD', amount: 12, profit: 60, price: 0, info: '87 57 (93-98)', admin: 'berke', date: '2026-08-17T11:16:00.000Z' },
  { type: 'BUY', amount: 400, profit: 0, price: 93, info: 'Alihan', admin: 'berke', date: '2026-08-17T11:18:00.000Z' },

  // 00 Sonrası Loglar (Bugün)
  { type: 'SOLD', amount: 200, profit: 200, price: 0, info: 'Baran (92-93)', admin: 'berke', date: '2026-08-18T01:02:00.000Z' },
  { type: 'SOLD', amount: 200, profit: 200, price: 0, info: 'Baran (92-93)', admin: 'berke', date: '2026-08-18T01:04:00.000Z' },
  { type: 'BUY', amount: 31, profit: 0, price: 92, info: 'Gokhan Karakus', admin: 'berke', date: '2026-08-18T01:06:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '6808 (92-98)', admin: 'berke', date: '2026-08-18T01:08:00.000Z' },
  { type: 'SOLD', amount: 23, profit: 138, price: 0, info: '6543 (92-98)', admin: 'berke', date: '2026-08-18T01:10:00.000Z' },
  { type: 'BUY', amount: 42, profit: 0, price: 92, info: 'gokhan karakus', admin: 'berke', date: '2026-08-18T01:12:00.000Z' },
  { type: 'SOLD', amount: 21, profit: 126, price: 0, info: '2855 (92-98)', admin: 'berke', date: '2026-08-18T01:14:00.000Z' },
  { type: 'BUY', amount: 250, profit: 0, price: 93, info: '0421', admin: 'berke', date: '2026-08-18T01:16:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: '8039 (93-98)', admin: 'berke', date: '2026-08-18T01:18:00.000Z' },
  { type: 'SOLD', amount: 60, profit: 60, price: 0, info: 'furkan kudat (98-99)', admin: 'berke', date: '2026-08-18T01:20:00.000Z' },
  { type: 'SOLD', amount: 60, profit: 60, price: 0, info: 'furkan kudat (98-99)', admin: 'berke', date: '2026-08-18T01:22:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 93, info: '3178', admin: 'berke', date: '2026-08-18T01:24:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 50, price: 0, info: 'furkan kudat (98-99)', admin: 'berke', date: '2026-08-18T01:26:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 50, price: 0, info: 'furkan kudat (98-99)', admin: 'berke', date: '2026-08-18T01:28:00.000Z' },
  { type: 'SOLD', amount: 60, profit: 60, price: 0, info: 'furkan kudat (98-99)', admin: 'berke', date: '2026-08-18T01:30:00.000Z' },
  { type: 'BUY', amount: 160, profit: 0, price: 91, info: 'furkan kudat', admin: 'berke', date: '2026-08-18T01:32:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 5, price: 0, info: '2216 (98-99)', admin: 'berke', date: '2026-08-18T01:34:00.000Z' },
  { type: 'SOLD', amount: 13, profit: 91, price: 0, info: '5464 (92-99)', admin: 'berke', date: '2026-08-18T01:36:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 140, price: 0, info: '5464 (92-99)', admin: 'berke', date: '2026-08-18T01:38:00.000Z' },
  { type: 'SOLD', amount: 18.3, profit: 0, price: 0, info: '(0-0)', admin: 'berke', date: '2026-08-18T01:40:00.000Z' },
  { type: 'BUY', amount: 29, profit: 0, price: 93, info: '7355', admin: 'Efe', date: '2026-08-18T01:42:00.000Z' },
  { type: 'SOLD', amount: 13, profit: 91, price: 0, info: '1908 (93-100)', admin: 'Efe', date: '2026-08-18T01:44:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 92, info: '0590', admin: 'Efe', date: '2026-08-18T01:46:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 45, price: 0, info: '7806 (93-102)', admin: 'Efe', date: '2026-08-18T01:48:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 160, price: 0, info: '1908 (92-100)', admin: 'Efe', date: '2026-08-18T01:50:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '1908 (93-100)', admin: 'Efe', date: '2026-08-18T01:52:00.000Z' },
  { type: 'SOLD', amount: 4.65, profit: 27.9, price: 0, info: '(94-100)', admin: 'Efe', date: '2026-08-18T01:54:00.000Z' },
  { type: 'BUY', amount: 7, profit: 0, price: 98, info: 'apo resel', admin: 'yaso', date: '2026-08-18T01:56:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 24, price: 0, info: '(96-100)', admin: 'yaso', date: '2026-08-18T01:58:00.000Z' },
  { type: 'BUY', amount: 11, profit: 0, price: 94, info: 'erol saygı', admin: 'yaso', date: '2026-08-18T02:00:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 30, price: 0, info: '33 78 (96-101)', admin: 'yaso', date: '2026-08-18T02:02:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 95, info: '7934', admin: 'yaso', date: '2026-08-18T02:04:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 29, price: 0, info: '(96-125)', admin: 'yaso', date: '2026-08-18T02:06:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '(96-102)', admin: 'yaso', date: '2026-08-18T02:08:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '(96-102)', admin: 'yaso', date: '2026-08-18T02:10:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 42, price: 0, info: '(95-102)', admin: 'yaso', date: '2026-08-18T02:12:00.000Z' },
  { type: 'BUY', amount: 7, profit: 0, price: 95, info: '53 96', admin: 'yaso', date: '2026-08-18T02:14:00.000Z' },
  { type: 'SOLD', amount: 2.85, profit: 11.4, price: 0, info: '53 96 (96-100)', admin: 'yaso', date: '2026-08-18T02:16:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 18, price: 0, info: '53 96 (96-102)', admin: 'yaso', date: '2026-08-18T02:18:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 60, price: 0, info: '53 96 (96-100)', admin: 'yaso', date: '2026-08-18T02:20:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 20, price: 0, info: '53 96 (96-100)', admin: 'yaso', date: '2026-08-18T02:22:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 95, info: '', admin: 'yaso', date: '2026-08-18T02:24:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 100, price: 0, info: '(95-100)', admin: 'yaso', date: '2026-08-18T02:26:00.000Z' },
  { type: 'SOLD', amount: 19.4, profit: 97, price: 0, info: '(95-100)', admin: 'yaso', date: '2026-08-18T02:28:00.000Z' },
  { type: 'BUY', amount: 16, profit: 0, price: 97, info: 'apo rseell', admin: 'yaso', date: '2026-08-18T02:30:00.000Z' },
  { type: 'SOLD', amount: 16, profit: 48, price: 0, info: '(97-100)', admin: 'yaso', date: '2026-08-18T02:32:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 45, price: 0, info: '(97-100)', admin: 'yaso', date: '2026-08-18T02:34:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 96, info: '', admin: 'yaso', date: '2026-08-18T02:36:00.000Z' },
  { type: 'BUY', amount: 35, profit: 0, price: 96, info: '', admin: 'yaso', date: '2026-08-18T02:38:00.000Z' },
  { type: 'BUY', amount: 5, profit: 0, price: 96, info: '', admin: 'yaso', date: '2026-08-18T02:40:00.000Z' },
  { type: 'BUY', amount: 22, profit: 0, price: 96, info: '', admin: 'yaso', date: '2026-08-18T02:42:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '(92-100)', admin: 'yaso', date: '2026-08-18T02:44:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 100, price: 0, info: '(95-100)', admin: 'yaso', date: '2026-08-18T02:46:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 20, price: 0, info: '(96-100)', admin: 'yaso', date: '2026-08-18T02:48:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 18, price: 0, info: '(96-105)', admin: 'yaso', date: '2026-08-18T02:50:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 20, price: 0, info: '(96-100)', admin: 'yaso', date: '2026-08-18T02:52:00.000Z' },
  { type: 'BUY', amount: 40, profit: 0, price: 96, info: 'apo rsell', admin: 'yaso', date: '2026-08-18T02:54:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 40, price: 0, info: 'apo rsell (96-100)', admin: 'yaso', date: '2026-08-18T02:56:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 95, info: 'apo rsell', admin: 'yaso', date: '2026-08-18T02:58:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 0, price: 0, info: 'apo rsell (96-96)', admin: 'yaso', date: '2026-08-18T03:00:00.000Z' }
];

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
  `);

  // Ensure admins in newLogs exist in users table
  const userSet = new Set();
  newLogs.forEach(l => {
    const name = (l.admin || l.trader || '').trim();
    if (name) userSet.add(name);
  });

  const userStmt = db.prepare(`INSERT OR IGNORE INTO users (name, password, role, updatedAt) VALUES (?, '1234', 'trader', ?)`);
  const nowStr = new Date().toISOString();
  userSet.forEach(u => {
    userStmt.run(u, nowStr);
  });
  userStmt.finalize();

  const stmt = db.prepare(`
    INSERT INTO logs (id, timestamp, trader, type, amount, price, profit, info, formattedText, status, messageId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', NULL)
  `);

  let addedCount = 0;
  let skippedCount = 0;
  let pending = newLogs.length;

  newLogs.forEach((log, index) => {
    const timestamp = log.date;
    const trader = (log.admin || log.trader || 'Ulukan').trim();
    const type = String(log.type || 'BUY').toUpperCase();
    const amount = String(log.amount !== undefined ? log.amount : '');
    const price = String(log.price !== undefined ? log.price : '0');
    const profit = type === 'SOLD' ? (log.profit !== undefined && log.profit !== null ? String(log.profit) : '0') : null;
    const info = String(log.info || '');

    db.get(
      `SELECT id FROM logs WHERE timestamp = ? AND trader = ? AND type = ? AND amount = ? AND info = ?`,
      [timestamp, trader, type, amount, info],
      (err, row) => {
        if (row) {
          skippedCount++;
          pending--;
          if (pending === 0) finish();
        } else {
          const id = `latest_${index}_${new Date(timestamp).getTime()}_${Math.random().toString(36).substring(2, 6)}`;
          const formattedText = type === 'BUY'
            ? `🔒 BUY: ${amount}bgl\n💥 PRICE: ${price}tl${info ? '\nℹ️ INFO: ' + info : ''}\n👤 ADMİN: ${trader}`
            : `🔒 SOLD: ${amount}bgl\n💸 PROFİT: ${profit || 0}tl${info ? '\nℹ️ INFO: ' + info : ''}\n👤 ADMİN: ${trader}`;

          stmt.run(id, timestamp, trader, type, amount, price, profit, info, formattedText, (err2) => {
            if (err2) {
              console.error('Ekleme hatası:', err2.message);
            } else {
              addedCount++;
            }
            pending--;
            if (pending === 0) finish();
          });
        }
      }
    );
  });

  function finish() {
    stmt.finalize();
    console.log(`✅ 99 adet yeni işlem başarıyla veritabanına yazıldı! (${addedCount} yeni eklendi, ${skippedCount} mükerrer atlandı)`);
    db.close();
  }
});
