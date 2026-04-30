const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.JARVIS_DB_PATH
  ? path.join(process.env.JARVIS_DB_PATH, "jarvis.db")
  : path.join(__dirname, "jarvis.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("SQLite 연결 실패:", err.message);
  } else {
    console.log("SQLite 연결 성공:", dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      schedule_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS modes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    actions TEXT NOT NULL
  )
`);

  db.run(`
  CREATE TABLE IF NOT EXISTS ai_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    api_key TEXT
  )
`);
});

module.exports = db;