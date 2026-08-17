const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'system.db');
const db = new sqlite3.Database(dbPath);

const rawLogs = [
  { type: 'SOLD', amount: 100, profit: 100, price: 0, info: '7725', admin: 'berke', date: '2026-08-14T10:00:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 14, price: 0, info: '2188', admin: 'berke', date: '2026-08-14T10:05:00.000Z' },
  { type: 'SOLD', amount: 8, profit: 24, price: 0, info: '5998', admin: 'berke', date: '2026-08-14T10:10:00.000Z' },
  { type: 'SOLD', amount: 29, profit: 87, price: 0, info: '0214', admin: 'berke', date: '2026-08-14T10:15:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 90, info: '6576', admin: 'berke', date: '2026-08-14T10:20:00.000Z' },
  { type: 'BUY', amount: 60, profit: 0, price: 93, info: 'Semih kurtulmuş', admin: 'berke', date: '2026-08-14T10:25:00.000Z' },
  { type: 'BUY', amount: 70, profit: 0, price: 91.8, info: '3325', admin: 'berke', date: '2026-08-14T10:30:00.000Z' },
  { type: 'SOLD', amount: 20.83, profit: 62.49, price: 0, info: '0508', admin: 'berke', date: '2026-08-14T10:35:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 90, info: '7260', admin: 'berke', date: '2026-08-14T10:40:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 42, price: 0, info: '0975', admin: 'berke', date: '2026-08-14T10:45:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 21, price: 0, info: '9685', admin: 'berke', date: '2026-08-14T10:50:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 15.6, price: 0, info: '2534', admin: 'berke', date: '2026-08-14T10:55:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 21, price: 0, info: '9685', admin: 'berke', date: '2026-08-14T11:00:00.000Z' },
  { type: 'BUY', amount: 83, profit: 0, price: 91, info: '6519', admin: 'berke', date: '2026-08-14T11:05:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 91, info: '4888', admin: 'berke', date: '2026-08-14T11:10:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 91, info: '1920', admin: 'berke', date: '2026-08-14T11:15:00.000Z' },
  { type: 'BUY', amount: 5, profit: 0, price: 89, info: '9209', admin: 'berke', date: '2026-08-14T11:20:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 30, price: 0, info: '4931', admin: 'berke', date: '2026-08-14T11:25:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 30, price: 0, info: '4931', admin: 'berke', date: '2026-08-14T11:30:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 150, price: 0, info: '1920', admin: 'berke', date: '2026-08-14T11:35:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '4533', admin: 'berke', date: '2026-08-14T11:40:00.000Z' },
  { type: 'BUY', amount: 70, profit: 0, price: 91, info: '0769', admin: 'berke', date: '2026-08-14T11:45:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: '4931', admin: 'berke', date: '2026-08-14T11:50:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: '8883', admin: 'berke', date: '2026-08-14T11:55:00.000Z' },
  { type: 'SOLD', amount: 6.25, profit: 31.25, price: 0, info: '8374', admin: 'berke', date: '2026-08-14T12:00:00.000Z' },
  { type: 'SOLD', amount: 5.2, profit: 26, price: 0, info: '3634', admin: 'berke', date: '2026-08-14T12:05:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: 'gqaan', admin: 'berke', date: '2026-08-14T12:10:00.000Z' },
  { type: 'SOLD', amount: 10.4, profit: 52, price: 0, info: '8374', admin: 'berke', date: '2026-08-14T12:15:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 10, price: 0, info: '5762', admin: 'berke', date: '2026-08-14T12:20:00.000Z' },
  { type: 'SOLD', amount: 21, profit: 0, price: 0, info: 'STOK SIFIRLAMA', admin: 'Efe', date: '2026-08-14T12:25:00.000Z' },
  { type: 'BUY', amount: 128, profit: 0, price: 92, info: 'Berk (devir)', admin: 'Efe', date: '2026-08-14T12:30:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 12, price: 0, info: '7260', admin: 'Efe', date: '2026-08-14T12:35:00.000Z' },
  { type: 'SOLD', amount: 3.5, profit: 0, price: 0, info: 'legacy aldım', admin: 'Efe', date: '2026-08-14T12:40:00.000Z' },
  { type: 'SOLD', amount: 8.3, profit: 33.2, price: 0, info: '9215', admin: 'Efe', date: '2026-08-14T12:45:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 30, price: 0, info: '8526', admin: 'Efe', date: '2026-08-14T12:50:00.000Z' },
  { type: 'BUY', amount: 150, profit: 0, price: 88, info: '0769', admin: 'Efe', date: '2026-08-14T12:55:00.000Z' },
  { type: 'SOLD', amount: 150, profit: 150, price: 0, info: 'ceyhun', admin: 'Efe', date: '2026-08-14T13:00:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 18, price: 0, info: '2407', admin: 'Efe', date: '2026-08-14T13:05:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 15, price: 0, info: '3451', admin: 'Efe', date: '2026-08-14T13:10:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 20, price: 0, info: '7531', admin: 'Efe', date: '2026-08-14T13:15:00.000Z' },
  { type: 'SOLD', amount: 5.2, profit: 0, price: 0, info: 'berk', admin: 'Efe', date: '2026-08-14T13:20:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 18, price: 0, info: '0773-1285', admin: 'Efe', date: '2026-08-14T13:25:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 20, price: 0, info: '7531', admin: 'Efe', date: '2026-08-14T13:30:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 9, price: 0, info: '4297', admin: 'Efe', date: '2026-08-14T13:35:00.000Z' },
  { type: 'SOLD', amount: 39.7, profit: 0, price: 0, info: '', admin: 'Efe', date: '2026-08-14T13:40:00.000Z' },
  { type: 'BUY', amount: 60, profit: 0, price: 91, info: 'Efe Manav', admin: 'berke', date: '2026-08-14T13:45:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 60, price: 0, info: '8437', admin: 'berke', date: '2026-08-14T13:50:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 30, price: 0, info: '7531', admin: 'berke', date: '2026-08-14T13:55:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 27, price: 0, info: '1616', admin: 'berke', date: '2026-08-14T14:00:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 90, price: 0, info: '7531', admin: 'berke', date: '2026-08-14T14:05:00.000Z' },
  { type: 'BUY', amount: 70, profit: 0, price: 89, info: '8371', admin: 'berke', date: '2026-08-14T14:10:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 200, price: 0, info: '0769', admin: 'berke', date: '2026-08-14T14:15:00.000Z' },
  { type: 'SOLD', amount: 14.4, profit: 57.6, price: 0, info: '0120', admin: 'berke', date: '2026-08-14T14:20:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 91, info: 'Berke basık', admin: 'berke', date: '2026-08-14T14:25:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 12, price: 0, info: '3457', admin: 'berke', date: '2026-08-14T14:30:00.000Z' },
  { type: 'BUY', amount: 11.34, profit: 0, price: 89, info: '6822', admin: 'berke', date: '2026-08-14T14:35:00.000Z' },
  { type: 'BUY', amount: 60, profit: 0, price: 90, info: 'Furkan dede', admin: 'berke', date: '2026-08-14T14:40:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '', admin: 'yaso', date: '2026-08-15T10:00:00.000Z' },
  { type: 'BUY', amount: 36, profit: 0, price: 90, info: 'firat has', admin: 'Ulukan', date: '2026-08-15T10:05:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 30, price: 0, info: '72 60', admin: 'Ulukan', date: '2026-08-15T10:10:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 160, price: 0, info: 'kerem ulusoy', admin: 'yaso', date: '2026-08-15T10:15:00.000Z' },
  { type: 'SOLD', data_info: '5bgl', amount: 5, profit: 25, price: 0, info: '02 10', admin: 'Ulukan', date: '2026-08-15T10:20:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '22 56', admin: 'Ulukan', date: '2026-08-15T10:25:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 160, price: 0, info: '', admin: 'yaso', date: '2026-08-15T10:30:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '', admin: 'yaso', date: '2026-08-15T10:35:00.000Z' },
  { type: 'BUY', amount: 90, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T10:40:00.000Z' },
  { type: 'SOLD', amount: 8, profit: 64, price: 0, info: '', admin: 'yaso', date: '2026-08-15T10:45:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '', admin: 'yaso', date: '2026-08-15T10:50:00.000Z' },
  { type: 'SOLD', amount: 14, profit: 112, price: 0, info: '', admin: 'yaso', date: '2026-08-15T10:55:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 160, price: 0, info: '', admin: 'yaso', date: '2026-08-15T11:00:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 80, price: 0, info: 'dönegel', admin: 'yaso', date: '2026-08-15T11:05:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: 'dönegel', admin: 'yaso', date: '2026-08-15T11:10:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 80, price: 0, info: '', admin: 'yaso', date: '2026-08-15T11:15:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '', admin: 'yaso', date: '2026-08-15T11:20:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 90, info: 'alper cebeci', admin: 'yaso', date: '2026-08-15T11:25:00.000Z' },
  { type: 'SOLD', amount: 4.2, profit: 21, price: 0, info: '8056', admin: 'berke', date: '2026-08-15T11:30:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 30, price: 0, info: '7260', admin: 'berke', date: '2026-08-15T11:35:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 20, price: 0, info: '2491', admin: 'berke', date: '2026-08-15T11:40:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 89, info: 'turab resell', admin: 'berke', date: '2026-08-15T11:45:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 89, info: 'turab resell', admin: 'berke', date: '2026-08-15T11:50:00.000Z' },
  { type: 'SOLD', amount: 106, profit: 318, price: 0, info: '3140', admin: 'berke', date: '2026-08-15T11:55:00.000Z' },
  { type: 'BUY', amount: 98, profit: 0, price: 90, info: '2664', admin: 'berke', date: '2026-08-15T12:00:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 89, info: '1461', admin: 'berke', date: '2026-08-15T12:05:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 30, price: 0, info: '2095', admin: 'berke', date: '2026-08-15T12:10:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 20, price: 0, info: '3883', admin: 'berke', date: '2026-08-15T12:15:00.000Z' },
  { type: 'SOLD', amount: 8, profit: 32, price: 0, info: '8883', admin: 'berke', date: '2026-08-15T12:20:00.000Z' },
  { type: 'SOLD', amount: 5.7, profit: 17.1, price: 0, info: '2332', admin: 'berke', date: '2026-08-15T12:25:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 120, price: 0, info: '0769', admin: 'berke', date: '2026-08-15T12:30:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 89, info: '5661', admin: 'berke', date: '2026-08-15T12:35:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 120, price: 0, info: '6767', admin: 'berke', date: '2026-08-15T12:40:00.000Z' },
  { type: 'SOLD', amount: 44, profit: 132, price: 0, info: '6307', admin: 'berke', date: '2026-08-15T12:45:00.000Z' },
  { type: 'SOLD', amount: 6.8, profit: 27.2, price: 0, info: '4931', admin: 'berke', date: '2026-08-15T12:50:00.000Z' },
  { type: 'SOLD', amount: 23, profit: 69, price: 0, info: '7655', admin: 'berke', date: '2026-08-15T12:55:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 150, price: 0, info: '0769', admin: 'berke', date: '2026-08-15T13:00:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 91, info: 'apo', admin: 'berke', date: '2026-08-15T13:05:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 89, info: '2827', admin: 'berke', date: '2026-08-15T13:10:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 18, price: 0, info: '1616', admin: 'berke', date: '2026-08-15T13:15:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 125, price: 0, info: '0769', admin: 'berke', date: '2026-08-15T13:20:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 21, price: 0, info: '5633', admin: 'berke', date: '2026-08-15T13:25:00.000Z' },
  { type: 'BUY', amount: 2, profit: 0, price: 90, info: '3325', admin: 'berke', date: '2026-08-15T13:30:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 30, price: 0, info: '1920', admin: 'berke', date: '2026-08-15T13:35:00.000Z' },
  { type: 'SOLD', amount: 46, profit: 0, price: 0, info: 'Devir yaso', admin: 'berke', date: '2026-08-15T13:40:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 60, price: 0, info: '4888', admin: 'berke', date: '2026-08-15T13:45:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 88, info: 'mert yıldız', admin: 'yaso', date: '2026-08-15T13:50:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '', admin: 'yaso', date: '2026-08-15T13:55:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:00:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T14:05:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 24, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:10:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 48, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:15:00.000Z' },
  { type: 'BUY', amount: 40, profit: 0, price: 91, info: '', admin: 'yaso', date: '2026-08-15T14:20:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T14:25:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 80, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:30:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 18, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:40:00.000Z' },
  { type: 'BUY', amount: 5, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T14:45:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:50:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 28, price: 0, info: '', admin: 'yaso', date: '2026-08-15T14:55:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 40, price: 0, info: '', admin: 'yaso', date: '2026-08-15T15:00:00.000Z' },
  { type: 'BUY', amount: 195, profit: 0, price: 87, info: '78 60', admin: 'Ulukan', date: '2026-08-15T15:05:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '53 63', admin: 'Ulukan', date: '2026-08-15T15:10:00.000Z' },
  { type: 'SOLD', amount: 75, profit: 450, price: 0, info: '98 50', admin: 'Ulukan', date: '2026-08-15T15:15:00.000Z' },
  { type: 'BUY', amount: 57.5, profit: 0, price: 91, info: 'ulukan', admin: 'yaso', date: '2026-08-15T15:20:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '64 32', admin: 'Ulukan', date: '2026-08-15T15:25:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 180, price: 0, info: '12 31', admin: 'Ulukan', date: '2026-08-15T15:30:00.000Z' },
  { type: 'SOLD', amount: 17.2, profit: 103.2, price: 0, info: '87 32', admin: 'Ulukan', date: '2026-08-15T15:35:00.000Z' },
  { type: 'SOLD', amount: 10.75, profit: 64.5, price: 0, info: '21 74', admin: 'Ulukan', date: '2026-08-15T15:40:00.000Z' },
  { type: 'SOLD', amount: 57.5, profit: 230, price: 0, info: 'devir yaso', admin: 'Ulukan', date: '2026-08-15T15:45:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 12, price: 0, info: '', admin: 'yaso', date: '2026-08-15T15:50:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T15:55:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T16:00:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 33, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:05:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 240, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:10:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T16:15:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 88, info: '', admin: 'yaso', date: '2026-08-15T16:20:00.000Z' },
  { type: 'SOLD', amount: 14.5, profit: 101.5, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:25:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 210, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:30:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 42, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:35:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:40:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 42, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:45:00.000Z' },
  { type: 'SOLD', amount: 14, profit: 98, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:50:00.000Z' },
  { type: 'SOLD', amount: 35, profit: 245, price: 0, info: '', admin: 'yaso', date: '2026-08-15T16:55:00.000Z' },
  { type: 'BUY', amount: 25, profit: 0, price: 93, info: '', admin: 'yaso', date: '2026-08-15T17:00:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 240, price: 0, info: '', admin: 'yaso', date: '2026-08-15T17:05:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 60, price: 0, info: '', admin: 'yaso', date: '2026-08-15T17:10:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 60, price: 0, info: '', admin: 'yaso', date: '2026-08-15T17:15:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 18, price: 0, info: '', admin: 'yaso', date: '2026-08-15T17:20:00.000Z' },
  { type: 'SOLD', amount: 24, profit: 144, price: 0, info: '', admin: 'yaso', date: '2026-08-15T17:25:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 93, info: '', admin: 'yaso', date: '2026-08-15T17:30:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '', admin: 'yaso', date: '2026-08-15T17:35:00.000Z' },
  { type: 'SOLD', amount: 12, profit: 48, price: 0, info: '5134', admin: 'berke', date: '2026-08-15T17:40:00.000Z' },
  { type: 'BUY', amount: 162, profit: 0, price: 88, info: '2011', admin: 'berke', date: '2026-08-15T17:45:00.000Z' },
  { type: 'SOLD', amount: 162, profit: 81, price: 0, info: '2011', admin: 'berke', date: '2026-08-15T17:50:00.000Z' },
  { type: 'SOLD', amount: 12, profit: 48, price: 0, info: '2799', admin: 'berke', date: '2026-08-15T17:55:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 94, info: 'baha', admin: 'berke', date: '2026-08-15T18:00:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 15, price: 0, info: '4873', admin: 'berke', date: '2026-08-15T18:05:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 9, price: 0, info: '6507', admin: 'berke', date: '2026-08-15T18:10:00.000Z' },
  { type: 'BUY', amount: 37, profit: 0, price: 91, info: '7379', admin: 'berke', date: '2026-08-15T18:15:00.000Z' },
  { type: 'BUY', amount: 3, profit: 0, price: 88, info: '1616', admin: 'berke', date: '2026-08-15T18:20:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 21, price: 0, info: '7222', admin: 'berke', date: '2026-08-15T18:25:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 24, price: 0, info: '8950', admin: 'berke', date: '2026-08-15T18:30:00.000Z' },
  { type: 'BUY', amount: 40, profit: 0, price: 91, info: 'bayram', admin: 'berke', date: '2026-08-15T18:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: '7608', admin: 'berke', date: '2026-08-15T18:40:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 30, price: 0, info: '4412', admin: 'berke', date: '2026-08-15T18:45:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 15, price: 0, info: '7739', admin: 'berke', date: '2026-08-15T18:50:00.000Z' },
  { type: 'BUY', amount: 70, profit: 0, price: 91, info: '1205', admin: 'berke', date: '2026-08-15T18:55:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 91, info: '8950', admin: 'berke', date: '2026-08-15T19:00:00.000Z' },
  { type: 'SOLD', amount: 160, profit: 80, price: 0, info: 'ceyhun resell', admin: 'berke', date: '2026-08-15T19:05:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 91, info: '6620', admin: 'berke', date: '2026-08-15T19:10:00.000Z' },
  { type: 'BUY', amount: 9.1, profit: 0, price: 91, info: '4616', admin: 'berke', date: '2026-08-15T19:15:00.000Z' },
  { type: 'SOLD', amount: 12, profit: 72, price: 0, info: '4753', admin: 'berke', date: '2026-08-15T19:20:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '34 37', admin: 'berke', date: '2026-08-15T19:25:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 35, price: 0, info: '3451', admin: 'berke', date: '2026-08-15T19:30:00.000Z' },
  { type: 'SOLD', amount: 4, profit: 20, price: 0, info: '0403', admin: 'berke', date: '2026-08-15T19:35:00.000Z' },
  { type: 'SOLD', amount: 18, profit: 90, price: 0, info: '8374', admin: 'berke', date: '2026-08-15T19:40:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 30, price: 0, info: '7113', admin: 'berke', date: '2026-08-15T19:45:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 9, price: 0, info: '6673', admin: 'berke', date: '2026-08-15T19:50:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 120, price: 0, info: '0653', admin: 'berke', date: '2026-08-15T19:55:00.000Z' },
  { type: 'SOLD', amount: 1050, profit: 4200, price: 0, info: '3637', admin: 'berke', date: '2026-08-15T20:00:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 80, price: 0, info: '5219', admin: 'berke', date: '2026-08-15T20:05:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 20, price: 0, info: '7113', admin: 'berke', date: '2026-08-15T20:10:00.000Z' },
  { type: 'BUY', amount: 90, profit: 0, price: 92, info: 'apo', admin: 'Ulukan', date: '2026-08-15T20:15:00.000Z' },
  { type: 'SOLD', amount: 100, profit: 400, price: 0, info: '90 29', admin: 'Ulukan', date: '2026-08-15T20:20:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 106, info: '', admin: 'yaso', date: '2026-08-16T10:00:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 50, price: 0, info: '', admin: 'yaso', date: '2026-08-16T10:05:00.000Z' },
  { type: 'SOLD', amount: 6, profit: 42, price: 0, info: '', admin: 'yaso', date: '2026-08-16T10:10:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 106, info: '', admin: 'yaso', date: '2026-08-16T10:15:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 103, info: '', admin: 'yaso', date: '2026-08-16T10:20:00.000Z' },
  { type: 'BUY', amount: 15, profit: 0, price: 100, info: '', admin: 'yaso', date: '2026-08-16T10:25:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 99, info: '', admin: 'yaso', date: '2026-08-16T10:30:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 95, info: '', admin: 'yaso', date: '2026-08-16T10:35:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 49, price: 0, info: '', admin: 'yaso', date: '2026-08-16T10:40:00.000Z' },
  { type: 'SOLD', amount: 11, profit: 88, price: 0, info: '', admin: 'yaso', date: '2026-08-16T10:45:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 50, price: 0, info: '', admin: 'yaso', date: '2026-08-16T10:50:00.000Z' },
  { type: 'SOLD', amount: 12, profit: 84, price: 0, info: '2799', admin: 'yaso', date: '2026-08-16T10:55:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 75, price: 0, info: '48 88', admin: 'berke', date: '2026-08-16T11:00:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 30, price: 0, info: '71 13', admin: 'berke', date: '2026-08-16T11:05:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 40, price: 0, info: '7260', admin: 'berke', date: '2026-08-16T11:10:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 24, price: 0, info: '1616', admin: 'berke', date: '2026-08-16T11:15:00.000Z' },
  { type: 'SOLD', amount: 13, profit: 91, price: 0, info: '6695', admin: 'berke', date: '2026-08-16T11:20:00.000Z' },
  { type: 'SOLD', amount: 2, profit: 20, price: 0, info: '2159', admin: 'berke', date: '2026-08-16T11:25:00.000Z' },
  { type: 'BUY', amount: 69, profit: 0, price: 96, info: 'alper', admin: 'berke', date: '2026-08-16T11:30:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 95, info: '5162', admin: 'berke', date: '2026-08-16T11:35:00.000Z' },
  { type: 'BUY', amount: 10, profit: 0, price: 95, info: '5162', admin: 'berke', date: '2026-08-16T11:40:00.000Z' },
  { type: 'BUY', amount: 81, profit: 0, price: 99, info: 'dagy resell', admin: 'berke', date: '2026-08-16T11:45:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 40, price: 0, info: '9340', admin: 'berke', date: '2026-08-16T11:50:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 40, price: 0, info: '9340', admin: 'berke', date: '2026-08-16T11:55:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 40, price: 0, info: '9340', admin: 'berke', date: '2026-08-16T12:00:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 40, price: 0, info: '9340', admin: 'berke', date: '2026-08-16T12:05:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '0150', admin: 'berke', date: '2026-08-16T12:10:00.000Z' },
  { type: 'SOLD', amount: 8.92, profit: 44.6, price: 0, info: '8264', admin: 'berke', date: '2026-08-16T12:15:00.000Z' },
  { type: 'BUY', amount: 375, profit: 0, price: 95, info: '9340', admin: 'berke', date: '2026-08-16T12:20:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 25, price: 0, info: '4090', admin: 'berke', date: '2026-08-16T12:25:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 95, info: '8264', admin: 'berke', date: '2026-08-16T12:30:00.000Z' },
  { type: 'SOLD', amount: 100, profit: 300, price: 0, info: 'Berke resell', admin: 'berke', date: '2026-08-16T12:35:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 95, info: '6198', admin: 'berke', date: '2026-08-16T12:40:00.000Z' },
  { type: 'SOLD', amount: 19, profit: 76, price: 0, info: '1356', admin: 'berke', date: '2026-08-16T12:45:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 0, price: 0, info: 'Berke', admin: 'berke', date: '2026-08-16T12:50:00.000Z' },
  { type: 'BUY', amount: 25, profit: 0, price: 95, info: '8056', admin: 'berke', date: '2026-08-16T12:55:00.000Z' },
  { type: 'SOLD', amount: 20, profit: 100, price: 0, info: '2890', admin: 'berke', date: '2026-08-16T13:00:00.000Z' },
  { type: 'SOLD', amount: 2792, profit: 0, price: 0, info: 'YASO KASA 11500-2792=8708', admin: 'berke', date: '2026-08-16T13:05:00.000Z' },
  { type: 'BUY', amount: 50, profit: 0, price: 96, info: 'alper', admin: 'berke', date: '2026-08-16T13:10:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 120, price: 0, info: '9340', admin: 'berke', date: '2026-08-16T13:15:00.000Z' },
  { type: 'SOLD', amount: 24, profit: 96, price: 0, info: 'yaso', admin: 'berke', date: '2026-08-16T13:20:00.000Z' },
  { type: 'SOLD', amount: 60, profit: 120, price: 0, info: '9340', admin: 'berke', date: '2026-08-16T13:25:00.000Z' },
  { type: 'SOLD', amount: 19.9, profit: 39.8, price: 0, info: '8732', admin: 'berke', date: '2026-08-16T13:30:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 20, price: 0, info: '3431', admin: 'berke', date: '2026-08-16T13:35:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 160, price: 0, info: '930', admin: 'berke', date: '2026-08-16T13:40:00.000Z' },

  // Bugün (17 Ağustos 00:00 Sonrası) Logları
  { type: 'BUY', amount: 100, profit: 0, price: 92, info: 'apo', admin: 'Ulukan', date: '2026-08-17T01:00:00.000Z' },
  { type: 'SOLD', amount: 100, profit: 400, price: 0, info: '90 29', admin: 'Ulukan', date: '2026-08-17T01:05:00.000Z' },
  { type: 'BUY', amount: 200, profit: 0, price: 96, info: 'Furkan dede', admin: 'berke', date: '2026-08-17T01:10:00.000Z' },
  { type: 'BUY', amount: 85, profit: 0, price: 96, info: '5751', admin: 'berke', date: '2026-08-17T01:15:00.000Z' },
  { type: 'SOLD', amount: 50, profit: 200, price: 0, info: '934', admin: 'berke', date: '2026-08-17T01:20:00.000Z' },
  { type: 'BUY', amount: 80, profit: 0, price: 94, info: 'apo', admin: 'Ulukan', date: '2026-08-17T01:25:00.000Z' },
  { type: 'SOLD', amount: 80, profit: 160, price: 0, info: '90 29', admin: 'Ulukan', date: '2026-08-17T01:30:00.000Z' },
  { type: 'SOLD', amount: 3, profit: 15, price: 0, info: '566', admin: 'Emir', date: '2026-08-17T02:00:00.000Z' },
  { type: 'SOLD', amount: 7, profit: 35, price: 0, info: '', admin: 'Emir', date: '2026-08-17T02:05:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 10, price: 0, info: '6372', admin: 'Emir', date: '2026-08-17T02:10:00.000Z' },
  { type: 'BUY', amount: 9, profit: 0, price: 90, info: '', admin: 'Emir', date: '2026-08-17T02:15:00.000Z' },
  { type: 'SOLD', amount: 19, profit: 95, price: 0, info: '', admin: 'Emir', date: '2026-08-17T02:20:00.000Z' },
  { type: 'BUY', amount: 40, profit: 0, price: 90, info: '60 92', admin: 'Ulukan', date: '2026-08-17T02:25:00.000Z' },
  { type: 'SOLD', amount: 40, profit: 400, price: 0, info: '90 29', admin: 'Ulukan', date: '2026-08-17T02:30:00.000Z' },
  { type: 'BUY', amount: 81.55, profit: 0, price: 90, info: '29 08', admin: 'Ulukan', date: '2026-08-17T02:35:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 50, price: 0, info: '22 16', admin: 'Ulukan', date: '2026-08-17T02:40:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 50, price: 0, info: '85 37', admin: 'Ulukan', date: '2026-08-17T02:45:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 330, price: 0, info: '56 81', admin: 'Ulukan', date: '2026-08-17T02:50:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 55, price: 0, info: '69 13', admin: 'Ulukan', date: '2026-08-17T02:55:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 55, price: 0, info: '69 13', admin: 'Ulukan', date: '2026-08-17T03:00:00.000Z' },
  { type: 'SOLD', amount: 13, profit: 130, price: 0, info: '93 34', admin: 'Ulukan', date: '2026-08-17T03:05:00.000Z' },
  { type: 'SOLD', amount: 15, profit: 165, price: 0, info: '14 61', admin: 'Ulukan', date: '2026-08-17T03:10:00.000Z' },
  { type: 'BUY', amount: 25, profit: 0, price: 95, info: '1461', admin: 'yaso', date: '2026-08-17T03:15:00.000Z' },
  { type: 'SOLD', amount: 5, profit: 35, price: 0, info: '1461', admin: 'yaso', date: '2026-08-17T03:20:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 95, info: '1461', admin: 'yaso', date: '2026-08-17T03:25:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 50, price: 0, info: '1461', admin: 'yaso', date: '2026-08-17T03:30:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 180, price: 0, info: '', admin: 'yaso', date: '2026-08-17T03:35:00.000Z' },
  { type: 'BUY', amount: 20, profit: 0, price: 95, info: '', admin: 'yaso', date: '2026-08-17T03:40:00.000Z' },
  { type: 'BUY', amount: 36, profit: 0, price: 95, info: '', admin: 'yaso', date: '2026-08-17T03:45:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '', admin: 'yaso', date: '2026-08-17T03:50:00.000Z' },
  { type: 'BUY', amount: 30, profit: 0, price: 95, info: '', admin: 'yaso', date: '2026-08-17T03:55:00.000Z' },
  { type: 'SOLD', amount: 30, profit: 210, price: 0, info: '', admin: 'yaso', date: '2026-08-17T04:00:00.000Z' },
  { type: 'SOLD', amount: 4.75, profit: 33.25, price: 0, info: '1723', admin: 'yaso', date: '2026-08-17T04:05:00.000Z' },
  { type: 'SOLD', amount: 5.3, profit: 37.1, price: 0, info: '1723', admin: 'yaso', date: '2026-08-17T04:10:00.000Z' },
  { type: 'BUY', amount: 100, profit: 0, price: 95, info: '', admin: 'Eker', date: '2026-08-17T04:15:00.000Z' },
  { type: 'SOLD', amount: 10, profit: 70, price: 0, info: '77 37', admin: 'Eker', date: '2026-08-17T04:20:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 25, price: 0, info: '0654', admin: 'Eker', date: '2026-08-17T04:25:00.000Z' },
  { type: 'SOLD', amount: 1, profit: 30, price: 0, info: '0403', admin: 'Eker', date: '2026-08-17T04:30:00.000Z' }
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

  let addedCount = 0;
  let skippedCount = 0;
  let pending = rawLogs.length;

  rawLogs.forEach((log, index) => {
    const timestamp = log.date;
    const trader = (log.admin || log.trader || 'Bilinmiyor').trim();
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
          const id = `restored_all_${index}_${new Date(timestamp).getTime()}_${Math.random().toString(36).substring(2, 6)}`;
          const formattedText = type === 'BUY'
            ? `🔒 BUY: ${amount}bgl\n💥 PRICE: ${price}tl${info ? '\nℹ️ INFO: ' + info : ''}\n👤 ADMİN: ${trader}`
            : `🔒 SOLD: ${amount}bgl\n💸 PROFİT: ${profit || 0}tl${info ? '\nℹ️ INFO: ' + info : ''}\n👤 ADMİN: ${trader}`;

          db.run(
            `INSERT INTO logs (id, timestamp, trader, type, amount, price, profit, info, formattedText, status, messageId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', NULL)`,
            [id, timestamp, trader, type, amount, price, profit, info, formattedText],
            (err) => {
              if (err) {
                console.error('❌ Insert error:', err.message);
              } else {
                addedCount++;
              }
              pending--;
              if (pending === 0) finish();
            }
          );
        }
      }
    );
  });

  function finish() {
    console.log(`📊 Toplam log: ${rawLogs.length} | Eklenen: ${addedCount} | Atlanan (zaten var): ${skippedCount}`);
    console.log("Tum gecmis loglar basariyla kaydedildi!");
    db.close();
  }
});
