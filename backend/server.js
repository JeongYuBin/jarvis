const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Jarvis Backend Server is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Jarvis backend connected",
  });
});

// 메모 전체 조회
app.get("/api/memos", (req, res) => {
  const sql = "SELECT * FROM memos ORDER BY id DESC";

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "메모 조회 실패",
        error: err.message,
      });
    }

    res.json(rows);
  });
});

// 메모 추가
app.post("/api/memos", (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({
      message: "메모 내용이 비어 있습니다.",
    });
  }

  const sql = "INSERT INTO memos (content) VALUES (?)";

  db.run(sql, [content], function (err) {
    if (err) {
      return res.status(500).json({
        message: "메모 저장 실패",
        error: err.message,
      });
    }

    res.status(201).json({
      message: "메모 저장 성공",
      memo: {
        id: this.lastID,
        content,
      },
    });
  });
});

// 메모 삭제
app.delete("/api/memos/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM memos WHERE id = ?";

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({
        message: "메모 삭제 실패",
        error: err.message,
      });
    }

    res.json({
      message: "메모 삭제 성공",
      deletedId: id,
    });
  });
});

app.listen(PORT, () => {
  console.log(`Jarvis backend running on http://localhost:${PORT}`);
});