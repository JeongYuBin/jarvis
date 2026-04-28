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
  db.all("SELECT * FROM memos ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "메모 조회 실패" });
    }

    res.json(rows);
  });
});

// 메모 추가
app.post("/api/memos", (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "메모 내용이 비어 있습니다." });
  }

  db.run("INSERT INTO memos (content) VALUES (?)", [content], function (err) {
    if (err) {
      return res.status(500).json({ message: "메모 저장 실패" });
    }

    res.status(201).json({
      id: this.lastID,
      content,
    });
  });
});

// 메모 삭제
app.delete("/api/memos/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM memos WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "메모 삭제 실패" });
    }

    res.json({ message: "메모 삭제 성공" });
  });
});

// 달력 가져오기
app.get("/api/schedules", (req, res) => {
  db.all("SELECT * FROM schedules ORDER BY schedule_date ASC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "일정 조회 실패" });
    }

    res.json(rows);
  });
});

// 달력 등록하기
app.post("/api/schedules", (req, res) => {
  const { content, schedule_date } = req.body;

  if (!content || !schedule_date) {
    return res.status(400).json({ message: "일정 내용 또는 날짜가 없습니다." });
  }

  db.run(
    "INSERT INTO schedules (content, schedule_date) VALUES (?, ?)",
    [content, schedule_date],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "일정 저장 실패" });
      }

      res.status(201).json({
        id: this.lastID,
        content,
        schedule_date,
      });
    }
  );
});

// 달력 삭제하기
app.delete("/api/schedules/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM schedules WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "일정 삭제 실패" });
    }

    res.json({ message: "일정 삭제 성공" });
  });
});

// 모드 전체 조회
app.get("/api/modes", (req, res) => {
  db.all("SELECT * FROM modes", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "모드 조회 실패" });

    res.json(rows);
  });
});

// 모드 추가
app.post("/api/modes", (req, res) => {
  const { name, actions } = req.body;

  db.run(
    "INSERT INTO modes (name, actions) VALUES (?, ?)",
    [name, JSON.stringify(actions)],
    function (err) {
      if (err) return res.status(500).json({ message: "모드 저장 실패" });

      res.json({ id: this.lastID, name, actions });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Jarvis backend running on http://localhost:${PORT}`);
});