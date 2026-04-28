const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./jarvis.db", (err) => {
  if (err) {
    console.error("SQLite 연결 실패:", err.message);
  } else {
    console.log("SQLite 연결 성공");
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
});

module.exports = db;