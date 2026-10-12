const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(dataDir, 'audio'), { recursive: true });
fs.mkdirSync(path.join(dataDir, 'photos'), { recursive: true });

const db = new Database(path.join(dataDir, 'eldercare.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS caregivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS elders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caregiver_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  elder_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  message TEXT,
  date TEXT,
  time TEXT NOT NULL,
  daily INTEGER NOT NULL DEFAULT 0,
  has_audio INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (elder_id) REFERENCES elders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  med_id INTEGER NOT NULL,
  elder_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  for_date TEXT NOT NULL,
  for_time TEXT NOT NULL,
  taken_at TEXT,
  UNIQUE(med_id, for_date, for_time),
  FOREIGN KEY (med_id) REFERENCES medications(id) ON DELETE CASCADE,
  FOREIGN KEY (elder_id) REFERENCES elders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  elder_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  detail TEXT,
  emailed INTEGER NOT NULL DEFAULT 0,
  email_info TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (elder_id) REFERENCES elders(id) ON DELETE CASCADE
);
`);

// Safe migrations for existing databases
const migrations = [
  'ALTER TABLE caregivers ADD COLUMN phone TEXT',
  'ALTER TABLE caregivers ADD COLUMN smtp_host TEXT',
  'ALTER TABLE caregivers ADD COLUMN smtp_port INTEGER',
  'ALTER TABLE caregivers ADD COLUMN smtp_user TEXT',
  'ALTER TABLE caregivers ADD COLUMN smtp_pass TEXT',
  'ALTER TABLE caregivers ADD COLUMN smtp_from TEXT',
  'ALTER TABLE alerts ADD COLUMN emailed INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE alerts ADD COLUMN email_info TEXT',
  'ALTER TABLE elders ADD COLUMN notes TEXT',
  'ALTER TABLE elders ADD COLUMN photo TEXT',
  'ALTER TABLE elders ADD COLUMN preferred_lang TEXT DEFAULT "en"',
  'ALTER TABLE medications ADD COLUMN lang TEXT DEFAULT "en"',
  'ALTER TABLE caregivers ADD COLUMN resend_api_key TEXT'
];

for (const m of migrations) {
  try { db.exec(m); } catch (e) { /* Column already exists */ }
}

module.exports = db;
