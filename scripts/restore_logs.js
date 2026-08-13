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
    console.error('❌ veritabanı hatası:', err);
    process.exit(1);
  }
});

const rawLogs = [
  // Dün ve Önceki Gün Logları
  { type: 'SOLD', amount: 16.3, profit: 65.2, price: 0, info: '5758', admin: 'berke', date: '2026-08-12T10:00:00.000Z' },
  { type: 'SOLD', amount: 120, profit: 240, price: 0, info: '3692', admin: 'berke', date: '2026-08-12T10:05:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 86, info: '5758', admin: 'berke', date: '2026-08-12T10:10:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 105, price: 0, info: '5758', admin: 'berke', date: '2026-08-12T10:15:00.000Z' },
  { type: 'BUY', amount: 12, profit: 0, price: 86, info: '6501', admin: 'berke', date: '2026-08-12T10:20:00.000Z' },
  { type: 'SOLD', amount: 1.5, profit: 15, price: 0, info: '', admin: 'Emir', date: '2026-08-12T10:25:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '', admin: 'Emir', date: '2026-08-12T10:30:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '', admin: 'Emir', date: '2026-08-12T10:35:00.000Z' },
  { type: 'BUY', amount: 15.5, profit: 0, price: 86, info: 'Doruk ayd', admin: 'Emir', date: '2026-08-12T10:40:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 85, info: 'Doruk ayd', admin: 'Emir', date: '2026-08-12T10:45:00.000Z' },
  { type: 'SOLD', amount: 15.78, profit: 142.02, price: 0, info: '', admin: 'Emir', date: '2026-08-12T10:50:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 48, price: 0, info: '', admin: 'Emir', date: '2026-08-12T10:55:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 60, price: 0, info: '1470', admin: 'berke', date: '2026-08-12T11:00:00.000Z' },
  { type: 'SOLD', amount: 6.7, profit: 26.8, price: 0, info: '2407', admin: 'berke', date: '2026-08-12T11:05:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 28, price: 0, info: '2528', admin: 'berke', date: '2026-08-12T11:10:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 90, info: 'Dagy', admin: 'berke', date: '2026-08-12T11:15:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 90, info: 'Dagy', admin: 'berke', date: '2026-08-12T11:20:00.000Z' },
  { type: 'SOLD', amount: 4.2, profit: 16.8, price: 0, info: '2407', admin: 'berke', date: '2026-08-12T11:25:00.000Z' },
  { type: 'BUY', amount: 200, profit: 0, price: 85, info: 'Dakali', admin: 'berke', date: '2026-08-12T11:30:00.000Z' },
  { type: 'BUY', amount: 29, profit: 0, price: 86, info: 'Tax', admin: 'Alper', date: '2026-08-12T11:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '86-93 / 07 17', admin: 'Alper', date: '2026-08-12T11:40:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '86-93 / 18 16', admin: 'Alper', date: '2026-08-12T11:45:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 86, info: '31 55', admin: 'Alper', date: '2026-08-12T11:50:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 86, info: '42 16', admin: 'Alper', date: '2026-08-12T11:55:00.000Z' },
  { type: 'BUY', amount: 118, profit: 0, price: 91, info: 'Semih', admin: 'Efe', date: '2026-08-12T12:00:00.000Z' },
  { type: 'SOLD', amount: 118, profit: 236, price: 0, info: 'REFERANS', admin: 'Efe', date: '2026-08-12T12:05:00.000Z' },
  { type: 'BUY', amount: 25, profit: 0, price: 86, info: 'Bayram', admin: 'Alper', date: '2026-08-12T12:10:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 86, info: 'kaanaks.u', admin: 'Alper', date: '2026-08-12T12:15:00.000Z' },
  { type: 'SOLD', amount: 11, profit: 66, price: 0, info: '86-92 / 77 07', admin: 'Alper', date: '2026-08-12T12:20:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 90, price: 0, info: '86-92 / 26 25', admin: 'Alper', date: '2026-08-12T12:25:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '86-92 / 01 20', admin: 'Alper', date: '2026-08-12T12:30:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 60, price: 0, info: 'Apo resell', admin: 'berke', date: '2026-08-12T12:35:00.000Z' },
  { type: 'BUY', amount: 8, profit: 0, price: 85, info: '2253', admin: 'berke', date: '2026-08-12T12:40:00.000Z' },
  { type: 'SOLD', amount: 8, profit: 56, price: 0, info: '24 07', admin: 'berke', date: '2026-08-12T12:45:00.000Z' },
  { type: 'SOLD', amount: 173, profit: 0, price: 0, info: 'Diğer 2 Resell', admin: 'Alper', date: '2026-08-12T12:50:00.000Z' },
  { type: 'SOLD', amount: 3.25, profit: 22.75, price: 0, info: '3634', admin: 'berke', date: '2026-08-12T12:55:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 28, price: 0, info: '6808', admin: 'berke', date: '2026-08-12T13:00:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '0570', admin: 'berke', date: '2026-08-12T13:05:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '7707', admin: 'berke', date: '2026-08-12T13:10:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 105, price: 0, info: '59 46', admin: 'berke', date: '2026-08-12T13:15:00.000Z' },
  { type: 'SOLD', amount: 10.2, profit: 71.4, price: 0, info: '1461', admin: 'berke', date: '2026-08-12T13:20:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 30, price: 0, info: '2294', admin: 'berke', date: '2026-08-12T13:25:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 85, info: '7830', admin: 'berke', date: '2026-08-12T13:30:00.000Z' },
  { type: 'BUY', amount: 18, profit: 0, price: 85, info: '4577', admin: 'berke', date: '2026-08-12T13:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '5538', admin: 'berke', date: '2026-08-12T13:40:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 28, price: 0, info: '57 74', admin: 'berke', date: '2026-08-12T13:45:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 42, price: 0, info: '55 38', admin: 'berke', date: '2026-08-12T13:50:00.000Z' },
  { type: 'BUY', amount: 12, profit: 0, price: 85, info: '55 38', admin: 'berke', date: '2026-08-12T13:55:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 85, info: '2095', admin: 'berke', date: '2026-08-12T14:00:00.000Z' },
  { type: 'BUY', amount: 41, profit: 0, price: 84, info: '99 02', admin: 'berke', date: '2026-08-12T14:05:00.000Z' },
  { type: 'SOLD', amount: 28.3, profit: 198.1, price: 0, info: '87 57', admin: 'berke', date: '2026-08-12T14:10:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 49, price: 0, info: '60 92', admin: 'berke', date: '2026-08-12T14:15:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '2491', admin: 'berke', date: '2026-08-12T14:20:00.000Z' },
  { type: 'SOLD', amount: 7.6, profit: 53.2, price: 0, info: '2152', admin: 'berke', date: '2026-08-12T14:25:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 28, price: 0, info: '8056', admin: 'berke', date: '2026-08-12T14:30:00.000Z' },
  { type: 'SOLD', amount: 13.2, profit: 92.4, price: 0, info: '1461', admin: 'berke', date: '2026-08-12T14:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 10, price: 0, info: 'Efe Manav', admin: 'berke', date: '2026-08-12T14:40:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 75, price: 0, info: '1461', admin: 'berke', date: '2026-08-12T14:45:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 10, price: 0, info: 'Apo', admin: 'berke', date: '2026-08-12T14:50:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 100, price: 0, info: '24 33', admin: 'berke', date: '2026-08-12T14:55:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '5538', admin: 'berke', date: '2026-08-12T15:00:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 85, info: '5538', admin: 'berke', date: '2026-08-12T15:05:00.000Z' },
  { type: 'BUY', amount: 12, profit: 0, price: 85, info: '1548', admin: 'berke', date: '2026-08-12T15:10:00.000Z' },
  { type: 'SOLD', amount: 84, profit: 0, price: 0, info: '5681 kasadan düşülecek 84 bgl', admin: 'berke', date: '2026-08-12T15:15:00.000Z' },
  { type: 'SOLD', amount: 60, profit: 120, price: 0, info: 'Turab', admin: 'berke', date: '2026-08-12T15:20:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 100, price: 0, info: '22 66', admin: 'berke', date: '2026-08-12T15:25:00.000Z' },
  { type: 'BUY', amount: 23, profit: 0, price: 85, info: '55 38', admin: 'berke', date: '2026-08-12T15:30:00.000Z' },
  { type: 'BUY', amount: 31.91, profit: 0, price: 85, info: '1972', admin: 'berke', date: '2026-08-12T15:35:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 26, price: 0, info: '9353', admin: 'berke', date: '2026-08-12T15:40:00.000Z' },
  { type: 'SOLD', amount: 10.65, profit: 53.25, price: 0, info: '5218', admin: 'berke', date: '2026-08-12T15:45:00.000Z' },
  { type: 'BUY', amount: 14, profit: 0, price: 85, info: 'Tax', admin: 'Alper', date: '2026-08-12T15:50:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '85-92 / 34 53', admin: 'Alper', date: '2026-08-12T15:55:00.000Z' },
  { type: 'BUY', amount: 21, profit: 0, price: 90, info: 'Berke', admin: 'Alper', date: '2026-08-12T16:00:00.000Z' },
  { type: 'SOLD', amount: 21, profit: 42, price: 0, info: '90-92 / 12 31', admin: 'Alper', date: '2026-08-12T16:05:00.000Z' },
  { type: 'BUY', amount: 200, profit: 0, price: 85, info: '49 62', admin: 'Alper', date: '2026-08-12T16:10:00.000Z' },
  { type: 'BUY', amount: 45, profit: 0, price: 85, info: '99 02', admin: 'Alper', date: '2026-08-12T16:15:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '85-92 / 03 23', admin: 'Alper', date: '2026-08-12T16:20:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 14, price: 0, info: '85-92 / 53 37', admin: 'Alper', date: '2026-08-12T16:25:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 105, price: 0, info: '85-92 / 03 23', admin: 'Alper', date: '2026-08-12T16:30:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '85-92 / 94 18', admin: 'Alper', date: '2026-08-12T16:35:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 85, info: '14 61', admin: 'Alper', date: '2026-08-12T16:40:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 42, price: 0, info: '85-92 / 55 38', admin: 'Alper', date: '2026-08-12T16:45:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 14, price: 0, info: '85-92 / 99 43', admin: 'Alper', date: '2026-08-12T16:50:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 21, price: 0, info: '85-92 / 89 58', admin: 'Alper', date: '2026-08-12T16:55:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 210, price: 0, info: '85-92 / 31 55', admin: 'Alper', date: '2026-08-12T17:00:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 200, price: 0, info: '85-92 / 57 58', admin: 'Alper', date: '2026-08-12T17:05:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '85-90 / 75 31', admin: 'Alper', date: '2026-08-12T17:10:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '85-92 / 52 16', admin: 'Alper', date: '2026-08-12T17:15:00.000Z' },
  { type: 'SOLD', amount: 151, profit: 0, price: 0, info: 'Semih', admin: 'Alper', date: '2026-08-12T17:20:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 140, price: 0, info: '66 20', admin: 'berke', date: '2026-08-12T17:25:00.000Z' },
  { type: 'BUY', amount: 35, profit: 0, price: 86, info: '7531', admin: 'berke', date: '2026-08-12T17:30:00.000Z' },
  { type: 'BUY', amount: 49, profit: 0, price: 85, info: '0082', admin: 'berke', date: '2026-08-12T17:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '2650', admin: 'berke', date: '2026-08-12T17:40:00.000Z' },
  { type: 'SOLD', amount: 25, profit: 125, price: 0, info: '5363', admin: 'berke', date: '2026-08-12T17:45:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 86, info: 'Apo', admin: 'berke', date: '2026-08-12T17:50:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 240, price: 0, info: '2266', admin: 'berke', date: '2026-08-12T17:55:00.000Z' },
  { type: 'SOLD', amount: 3.1, profit: 18.6, price: 0, info: '9785', admin: 'berke', date: '2026-08-12T18:00:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 18, price: 0, info: '2174', admin: 'berke', date: '2026-08-12T18:05:00.000Z' },
  { type: 'SOLD', amount: 23.95, profit: 71.85, price: 0, info: '2890', admin: 'berke', date: '2026-08-12T18:10:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 89, info: 'Baha resell', admin: 'berke', date: '2026-08-12T18:15:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 3, price: 0, info: '4297', admin: 'berke', date: '2026-08-12T18:20:00.000Z' },
  { type: 'BUY', amount: 12, profit: 0, price: 85, info: '4297', admin: 'berke', date: '2026-08-12T18:25:00.000Z' },
  { type: 'BUY', amount: 91, profit: 0, price: 85, info: '7860', admin: 'berke', date: '2026-08-12T18:30:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 140, price: 0, info: '6620', admin: 'berke', date: '2026-08-12T18:35:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 85, info: 'Enes Aker', admin: 'berke', date: '2026-08-12T18:40:00.000Z' },
  { type: 'SOLD', amount: 5.5, profit: 38.5, price: 0, info: '0975', admin: 'berke', date: '2026-08-12T18:45:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 45, price: 0, info: '9216', admin: 'berke', date: '2026-08-12T18:50:00.000Z' },
  { type: 'BUY', amount: 7, profit: 0, price: 85, info: '2969', admin: 'berke', date: '2026-08-12T18:55:00.000Z' },
  { type: 'SOLD', amount: 4.25, profit: 29.75, price: 0, info: '9599', admin: 'berke', date: '2026-08-12T19:00:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 89, info: 'Berke Basık', admin: 'Efe', date: '2026-08-12T19:05:00.000Z' },
  { type: 'BUY', amount: 25, profit: 0, price: 85, info: '4056', admin: 'Efe', date: '2026-08-12T19:10:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 28, price: 0, info: '9441', admin: 'Efe', date: '2026-08-12T19:15:00.000Z' },
  { type: 'BUY', amount: 35, profit: 0, price: 85, info: '3910', admin: 'Efe', date: '2026-08-12T19:20:00.000Z' },
  { type: 'SOLD', amount: 31, profit: 124, price: 0, info: '8505', admin: 'Efe', date: '2026-08-12T19:25:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 20, price: 0, info: '6557', admin: 'Efe', date: '2026-08-12T19:30:00.000Z' },
  { type: 'BUY', amount: 12, profit: 0, price: 85, info: '2890', admin: 'Efe', date: '2026-08-12T19:35:00.000Z' },
  { type: 'BUY', amount: 12, profit: 0, price: 85, info: '2890', admin: 'Efe', date: '2026-08-12T19:40:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 18, price: 0, info: '2407', admin: 'Efe', date: '2026-08-12T19:45:00.000Z' },
  { type: 'SOLD', amount: 25, profit: 175, price: 0, info: '0834', admin: 'Efe', date: '2026-08-12T19:50:00.000Z' },
  { type: 'SOLD', amount: 39, profit: 39, price: 0, info: 'baha', admin: 'Efe', date: '2026-08-12T19:55:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 45, price: 0, info: '3897', admin: 'berke', date: '2026-08-12T20:00:00.000Z' },
  { type: 'SOLD', amount: 130, profit: 520, price: 0, info: '7302', admin: 'berke', date: '2026-08-12T20:05:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 12, price: 0, info: '8056', admin: 'berke', date: '2026-08-12T20:10:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 85, info: '7155', admin: 'berke', date: '2026-08-12T20:15:00.000Z' },
  { type: 'BUY', amount: 22, profit: 0, price: 85, info: '2861', admin: 'berke', date: '2026-08-12T20:20:00.000Z' },
  { type: 'SOLD', amount: 11, profit: 77, price: 0, info: '1107', admin: 'berke', date: '2026-08-12T20:25:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '2007', admin: 'berke', date: '2026-08-12T20:30:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '1231', admin: 'berke', date: '2026-08-12T20:35:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 15, price: 0, info: '8056', admin: 'berke', date: '2026-08-12T20:40:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 15, price: 0, info: '8056', admin: 'berke', date: '2026-08-12T20:45:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '9909', admin: 'berke', date: '2026-08-12T20:50:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 35, price: 0, info: '6711', admin: 'berke', date: '2026-08-12T20:55:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 13, price: 0, info: '8056', admin: 'berke', date: '2026-08-12T21:00:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 65, price: 0, info: '6897', admin: 'berke', date: '2026-08-12T21:05:00.000Z' },
  { type: 'BUY', amount: 90, profit: 0, price: 86.5, info: '75 81', admin: 'Ulukan', date: '2026-08-12T21:10:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 85, info: '60 92', admin: 'Ulukan', date: '2026-08-12T21:15:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 13.5, price: 0, info: '98 51', admin: 'Ulukan', date: '2026-08-12T21:20:00.000Z' },
  { type: 'SOLD', amount: 9, profit: 40.5, price: 0, info: '3333', admin: 'Ulukan', date: '2026-08-12T21:25:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 90, price: 0, info: '12 81', admin: 'Ulukan', date: '2026-08-12T21:30:00.000Z' },
  { type: 'SOLD', amount: 16.48, profit: 74.16, price: 0, info: '12 31', admin: 'Ulukan', date: '2026-08-12T21:35:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 85, info: '12 31', admin: 'Ulukan', date: '2026-08-12T21:40:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 18, price: 0, info: '12 98', admin: 'Ulukan', date: '2026-08-12T21:45:00.000Z' },
  { type: 'SOLD', amount: 3.29, profit: 14.8, price: 0, info: '9773', admin: 'Ulukan', date: '2026-08-12T21:50:00.000Z' },
  { type: 'SOLD', amount: 11.75, profit: 52.88, price: 0, info: '12 81', admin: 'Ulukan', date: '2026-08-12T21:55:00.000Z' },
  { type: 'SOLD', amount: 2.5, profit: 11.25, price: 0, info: '12 81', admin: 'Ulukan', date: '2026-08-12T22:00:00.000Z' },
  { type: 'SOLD', amount: 19.23, profit: 86.53, price: 0, info: '12 31', admin: 'Ulukan', date: '2026-08-12T22:05:00.000Z' },
  { type: 'SOLD', amount: 33, profit: 194.7, price: 0, info: '12 31', admin: 'Ulukan', date: '2026-08-12T22:10:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 85, info: '12 31', admin: 'Ulukan', date: '2026-08-12T22:15:00.000Z' },
  { type: 'BUY', amount: 80, profit: 0, price: 84, info: '12 31', admin: 'Ulukan', date: '2026-08-12T22:20:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '42 69', admin: 'Ulukan', date: '2026-08-12T22:25:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '69 01', admin: 'Ulukan', date: '2026-08-12T22:30:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '13 18', admin: 'Ulukan', date: '2026-08-12T22:35:00.000Z' },
  { type: 'SOLD', amount: 55, profit: 324.5, price: 0, info: '13 31', admin: 'Ulukan', date: '2026-08-12T22:40:00.000Z' },
  { type: 'BUY', amount: 80, profit: 0, price: 84, info: '12 31', admin: 'Ulukan', date: '2026-08-12T22:45:00.000Z' },
  { type: 'SOLD', amount: 5.49, profit: 32.94, price: 0, info: '06 53', admin: 'Ulukan', date: '2026-08-12T22:50:00.000Z' },
  { type: 'SOLD', amount: 30.76, profit: 184.56, price: 0, info: '18 16', admin: 'Ulukan', date: '2026-08-12T22:55:00.000Z' },
  { type: 'SOLD', amount: 11, profit: 66, price: 0, info: '@emirhanaydnn', admin: 'Ulukan', date: '2026-08-12T23:00:00.000Z' },
  { type: 'SOLD', amount: 88, profit: 176, price: 0, info: 'baran', admin: 'Ulukan', date: '2026-08-12T23:05:00.000Z' },
  { type: 'SOLD', amount: 112, profit: 336, price: 0, info: 'baran', admin: 'Ulukan', date: '2026-08-12T23:10:00.000Z' },
  { type: 'BUY', amount: 40, profit: 0, price: 85, info: 'emirhanaydn', admin: 'Ulukan', date: '2026-08-12T23:15:00.000Z' },
  { type: 'BUY', amount: 12, profit: 0, price: 85, info: '21 88', admin: 'Ulukan', date: '2026-08-12T23:20:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 75, price: 0, info: 'ozel musteri', admin: 'Ulukan', date: '2026-08-12T23:25:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 45, price: 0, info: '00 89', admin: 'Ulukan', date: '2026-08-12T23:30:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '40 90', admin: 'Ulukan', date: '2026-08-12T23:35:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 80, price: 0, info: '66 25', admin: 'Ulukan', date: '2026-08-12T23:40:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 54, price: 0, info: '34 51', admin: 'Ulukan', date: '2026-08-12T23:45:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 80, price: 0, info: '34 59', admin: 'Ulukan', date: '2026-08-12T23:50:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 80, price: 0, info: '99 10', admin: 'Ulukan', date: '2026-08-12T23:52:00.000Z' },
  { type: 'BUY', amount: 45, profit: 0, price: 87, info: '34 51', admin: 'Ulukan', date: '2026-08-12T23:54:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 18, price: 0, info: 'ozel musteri', admin: 'Ulukan', date: '2026-08-12T23:55:00.000Z' },
  { type: 'SOLD', amount: 8, profit: 48, price: 0, info: '90 33', admin: 'Ulukan', date: '2026-08-12T23:56:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '07 17', admin: 'Ulukan', date: '2026-08-12T23:57:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 36, price: 0, info: '27 85', admin: 'Ulukan', date: '2026-08-12T23:58:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 60, price: 0, info: '75 31', admin: 'Ulukan', date: '2026-08-12T23:59:00.000Z' },
  { type: 'BUY', amount: 41, profit: 0, price: 87, info: '7531', admin: 'berke', date: '2026-08-12T23:59:10.000Z' },
  { type: 'BUY', amount: 7, profit: 0, price: 86, info: '2625', admin: 'berke', date: '2026-08-12T23:59:20.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '0210', admin: 'berke', date: '2026-08-12T23:59:30.000Z' },
  { type: 'SOLD', amount: 11, profit: 66, price: 0, info: '@emirhnaydnn', admin: 'berke', date: '2026-08-12T23:59:40.000Z' },
  { type: 'BUY', amount: 19, profit: 0, price: 86, info: '0210', admin: 'berke', date: '2026-08-12T23:59:45.000Z' },
  { type: 'BUY', amount: 2.67, profit: 0, price: 80, info: '61 53', admin: 'berke', date: '2026-08-12T23:59:50.000Z' },
  { type: 'SOLD', amount: 20, profit: 120, price: 0, info: '1231', admin: 'berke', date: '2026-08-12T23:59:51.000Z' },
  { type: 'SOLD', amount: 40, profit: 160, price: 0, info: '1231', admin: 'berke', date: '2026-08-12T23:59:52.000Z' },
  { type: 'BUY', amount: 55, profit: 0, price: 85, info: '5590', admin: 'berke', date: '2026-08-12T23:59:53.000Z' },
  { type: 'SOLD', amount: 40, profit: 240, price: 0, info: '1205', admin: 'berke', date: '2026-08-12T23:59:54.000Z' },
  { type: 'SOLD', amount: 26, profit: 130, price: 0, info: '1231', admin: 'berke', date: '2026-08-12T23:59:55.000Z' },
  { type: 'BUY', amount: 46.75, profit: 0, price: 88, info: 'Ulukan', admin: 'berke', date: '2026-08-12T23:59:56.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 86, info: '5363', admin: 'berke', date: '2026-08-12T23:59:57.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 86, info: '2428', admin: 'berke', date: '2026-08-12T23:59:58.000Z' },
  { type: 'SOLD', amount: 21.7, profit: 108.5, price: 0, info: '6123', admin: 'berke', date: '2026-08-12T23:59:59.000Z' },
  { type: 'SOLD', amount: 21.7, profit: 108.5, price: 0, info: '6123', admin: 'berke', date: '2026-08-12T23:59:59.100Z' },
  { type: 'SOLD', amount: 8, profit: 56, price: 0, info: '8508', admin: 'berke', date: '2026-08-12T23:59:59.200Z' },
  { type: 'SOLD', amount: 2, profit: 28, price: 0, info: '9033', admin: 'berke', date: '2026-08-12T23:59:59.300Z' },
  { type: 'SOLD', amount: 4, profit: 36, price: 0, info: '9033', admin: 'berke', date: '2026-08-12T23:59:59.400Z' },
  { type: 'SOLD', amount: 10.5, profit: 63, price: 0, info: '8505', admin: 'berke', date: '2026-08-12T23:59:59.500Z' },
  { type: 'BUY', amount: 5, profit: 0, price: 85, info: '5071', admin: 'berke', date: '2026-08-12T23:59:59.600Z' },
  { type: 'SOLD', amount: 10, profit: 60, price: 0, info: '4440', admin: 'berke', date: '2026-08-12T23:59:59.700Z' },
  { type: 'SOLD', amount: 60, profit: 240, price: 0, info: '1107', admin: 'berke', date: '2026-08-12T23:59:59.800Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: '1484', admin: 'berke', date: '2026-08-12T23:59:59.900Z' },
  { type: 'SOLD', amount: 1, profit: 13, price: 0, info: '9134', admin: 'berke', date: '2026-08-12T23:59:59.910Z' },
  { type: 'SOLD', amount: 2, profit: 16, price: 0, info: '8639', admin: 'berke', date: '2026-08-12T23:59:59.920Z' },
  { type: 'SOLD', amount: 2, profit: 26, price: 0, info: '4297', admin: 'berke', date: '2026-08-12T23:59:59.930Z' },
  { type: 'SOLD', amount: 1, profit: 13, price: 0, info: '2582', admin: 'berke', date: '2026-08-12T23:59:59.940Z' },
  { type: 'SOLD', amount: 0.95, profit: 9.5, price: 0, info: '8056', admin: 'berke', date: '2026-08-12T23:59:59.950Z' },
  { type: 'SOLD', amount: 6.3, profit: 18.9, price: 0, info: '4931', admin: 'berke', date: '2026-08-12T23:59:59.960Z' },
  { type: 'SOLD', amount: 5, profit: 10, price: 0, info: '3451', admin: 'berke', date: '2026-08-12T23:59:59.970Z' },
  { type: 'SOLD', amount: 3, profit: 27, price: 0, info: '8866', admin: 'berke', date: '2026-08-12T23:59:59.980Z' },
  { type: 'BUY', amount: 19, profit: 0, price: 90, info: 'Baha', admin: 'berke', date: '2026-08-12T23:59:59.985Z' },
  { type: 'BUY', amount: 5, profit: 0, price: 87, info: '5998', admin: 'Emir', date: '2026-08-12T23:59:59.990Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '5998', admin: 'Emir', date: '2026-08-12T23:59:59.991Z' },
  { type: 'BUY', amount: 70, profit: 0, price: 90, info: 'Turab resell', admin: 'Emir', date: '2026-08-12T23:59:59.992Z' },
  { type: 'SOLD', amount: 20, profit: 80, price: 0, info: '6620', admin: 'Emir', date: '2026-08-12T23:59:59.993Z' },
  { type: 'SOLD', amount: 48.9, profit: 195.6, price: 0, info: '2736', admin: 'Emir', date: '2026-08-12T23:59:59.994Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 87, info: 'Bayram özpınar', admin: 'Emir', date: '2026-08-12T23:59:59.995Z' },
  // Bugünün Logları (Saat 00:00'dan Sonra Atılanlar)
  { type: 'BUY', amount: 100, profit: 0, price: 87, info: 'Berk coskun(reffi devir aldım)', admin: 'Emir', date: '2026-08-13T00:05:00.000Z' },
  { type: 'SOLD', amount: 31.9, profit: 223.3, price: 0, info: '1231 karakoc', admin: 'Emir', date: '2026-08-13T00:10:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 27, price: 0, info: '1231 karakoc', admin: 'Emir', date: '2026-08-13T00:15:00.000Z' },
  { type: 'SOLD', amount: 75, profit: 375, price: 0, info: '1231 karakoc', admin: 'Emir', date: '2026-08-13T00:20:00.000Z' },
  { type: 'SOLD', amount: 1.22, profit: 13.42, price: 0, info: '1231 karakoc', admin: 'Emir', date: '2026-08-13T00:25:00.000Z' },
  { type: 'BUY', amount: 19.5, profit: 0, price: 88, info: 'alper', admin: 'Ulukan', date: '2026-08-13T01:00:00.000Z' },
  { type: 'SOLD', amount: 41.5, profit: 0, price: 0, info: 'berke', admin: 'Ulukan', date: '2026-08-13T01:05:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 105, price: 0, info: '69 01', admin: 'Ulukan', date: '2026-08-13T01:10:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 88, info: '68 22', admin: 'Ulukan', date: '2026-08-13T01:15:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '77 07', admin: 'Ulukan', date: '2026-08-13T01:20:00.000Z' },
  { type: 'BUY', amount: 2, profit: 0, price: 75, info: '43 75', admin: 'Ulukan', date: '2026-08-13T01:25:00.000Z' },
  { type: 'BUY', amount: 16, profit: 0, price: 93, info: 'baran bal', admin: 'Ulukan', date: '2026-08-13T01:30:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 12, price: 0, info: '24 38', admin: 'Ulukan', date: '2026-08-13T01:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 10, price: 0, info: '87 77', admin: 'Ulukan', date: '2026-08-13T01:40:00.000Z' },
  { type: 'SOLD', amount: 5.15, profit: 10.3, price: 0, info: '52 32', admin: 'Ulukan', date: '2026-08-13T01:45:00.000Z' },
  { type: 'BUY', amount: 5, profit: 0, price: 80, info: '02 26 / ihtiyacı varmış mecburen aldım', admin: 'Alper', date: '2026-08-13T02:00:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 30, price: 0, info: '80-95 / 71 06', admin: 'Alper', date: '2026-08-13T02:05:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 45, price: 0, info: '80-95 / 24 33', admin: 'Alper', date: '2026-08-13T02:10:00.000Z' },
  { type: 'BUY', amount: 17, profit: 0, price: 90, info: 'Tax', admin: 'Alper', date: '2026-08-13T02:15:00.000Z' },
  { type: 'SOLD', amount: 17, profit: 85, price: 0, info: '90-95 / 24 33', admin: 'Alper', date: '2026-08-13T02:20:00.000Z' },
  { type: 'BUY', amount: 4, profit: 0, price: 90, info: 'Tax', admin: 'Alper', date: '2026-08-13T02:25:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 20, price: 0, info: '90-95 / 21 74', admin: 'Alper', date: '2026-08-13T02:30:00.000Z' },
  { type: 'BUY', amount: 1, profit: 0, price: 90, info: '38 83', admin: 'Alper', date: '2026-08-13T02:35:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 5, price: 0, info: '90-95 / 38 83', admin: 'Alper', date: '2026-08-13T02:40:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 92, info: 'Turab', admin: 'Alper', date: '2026-08-13T02:45:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 15, price: 0, info: '92-95 / 24 23', admin: 'Alper', date: '2026-08-13T02:50:00.000Z' },
  { type: 'BUY', amount: 3, profit: 0, price: 80, info: '63 18', admin: 'Alper', date: '2026-08-13T02:55:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 0, price: 0, info: 'resell', admin: 'Alper', date: '2026-08-13T03:00:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 15, price: 0, info: '80-95 / 42 97', admin: 'Alper', date: '2026-08-13T03:05:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 10, price: 0, info: '8374', admin: 'berke', date: '2026-08-13T03:10:00.000Z' },
  { type: 'BUY', amount: 16.5, profit: 0, price: 93, info: 'Baha', admin: 'berke', date: '2026-08-13T03:15:00.000Z' },
  { type: 'SOLD', amount: 7.5, profit: 22.5, price: 0, info: '8374', admin: 'berke', date: '2026-08-13T03:20:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 16, price: 0, info: '2491', admin: 'berke', date: '2026-08-13T03:25:00.000Z' },
  { type: 'SOLD', amount: 11.65, profit: 34.95, price: 0, info: '3213', admin: 'berke', date: '2026-08-13T03:30:00.000Z' },
  { type: 'SOLD', amount: 2.3, profit: 16.1, price: 0, info: '8056', admin: 'berke', date: '2026-08-13T03:35:00.000Z' },
  { type: 'BUY', amount: 18, profit: 0, price: 89, info: '8374', admin: 'berke', date: '2026-08-13T03:40:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 30, price: 0, info: '2534', admin: 'berke', date: '2026-08-13T03:45:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 45, price: 0, info: '2534', admin: 'berke', date: '2026-08-13T03:50:00.000Z' },
  { type: 'BUY', amount: 5, profit: 0, price: 88, info: 'Bayram Depo', admin: 'berke', date: '2026-08-13T03:55:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 89, info: '3910', admin: 'berke', date: '2026-08-13T04:00:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 16, price: 0, info: '7776', admin: 'berke', date: '2026-08-13T04:05:00.000Z' },
  { type: 'SOLD', amount: 2.7, profit: 18.9, price: 0, info: '7157', admin: 'berke', date: '2026-08-13T04:10:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 90.5, info: '3325', admin: 'berke', date: '2026-08-13T04:15:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 110, price: 0, info: '2534', admin: 'berke', date: '2026-08-13T04:20:00.000Z' },
  { type: 'SOLD', amount: 2.5, profit: 13.75, price: 0, info: '8056', admin: 'berke', date: '2026-08-13T04:25:00.000Z' },
  { type: 'BUY', amount: 116, profit: 0, price: 95, info: 'ceyhun', admin: 'Ulukan', date: '2026-08-13T04:30:00.000Z' },
  { type: 'SOLD', amount: 84, profit: 0, price: 0, info: '73 02', admin: 'Ulukan', date: '2026-08-13T04:35:00.000Z' },
  { type: 'SOLD', amount: 31, profit: 0, price: 0, info: '12 31', admin: 'Ulukan', date: '2026-08-13T04:40:00.000Z' },
  { type: 'SOLD', amount: 6.4, profit: 35.2, price: 0, info: '5954', admin: 'berke', date: '2026-08-13T04:45:00.000Z' }
];

db.serialize(() => {
  // Make sure table exists
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

  const stmt = db.prepare(`
    INSERT INTO logs (id, timestamp, trader, type, amount, price, profit, info, formattedText, status, messageId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', NULL)
  `);

  let addedCount = 0;
  let skippedCount = 0;

  let pending = rawLogs.length;

  rawLogs.forEach((log, index) => {
    const timestamp = log.date;
    const trader = (log.admin || log.trader || 'Ulukan').trim();
    const type = String(log.type || 'BUY').toUpperCase();
    const amount = String(log.amount !== undefined ? log.amount : '');
    const price = String(log.price !== undefined ? log.price : '0');
    const profit = type === 'SOLD' ? (log.profit !== undefined && log.profit !== null ? String(log.profit) : '0') : null;
    const info = String(log.info || '');

    // Check duplicate
    db.get(
      `SELECT id FROM logs WHERE timestamp = ? AND trader = ? AND type = ? AND amount = ? AND info = ?`,
      [timestamp, trader, type, amount, info],
      (err, row) => {
        if (row) {
          skippedCount++;
          pending--;
          if (pending === 0) finish();
        } else {
          const id = `restored_${index}_${new Date(timestamp).getTime()}_${Math.random().toString(36).substring(2, 6)}`;
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
    console.log(`✅ ${addedCount} adet geçmiş log veritabanına başarıyla aktarıldı! (${skippedCount} mükerrer kayıt atlandı)`);
    db.close();
  }
});
