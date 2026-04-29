const express = require("express");
const cors = require("cors");
const db = require("./database");
const OpenAI = require("openai");
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

// 메모 수정
app.put("/api/memos/:id", (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "메모 내용이 비어 있습니다." });
  }

  db.run(
    "UPDATE memos SET content = ? WHERE id = ?",
    [content, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "메모 수정 실패" });
      }

      res.json({ message: "메모 수정 성공" });
    }
  );
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

// 달력 수정
app.put("/api/schedules/:id", (req, res) => {
  const { id } = req.params;
  const { content, schedule_date } = req.body;

  if (!content || !schedule_date) {
    return res.status(400).json({ message: "일정 내용 또는 날짜가 없습니다." });
  }

  db.run(
    "UPDATE schedules SET content = ?, schedule_date = ? WHERE id = ?",
    [content, schedule_date, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "일정 수정 실패" });
      }

      res.json({ message: "일정 수정 성공" });
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

// 모드 수정
app.put("/api/modes/:id", (req, res) => {
  const { id } = req.params;
  const { name, actions } = req.body;

  db.run(
    "UPDATE modes SET name = ?, actions = ? WHERE id = ?",
    [name, JSON.stringify(actions), id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "모드 수정 실패" });
      }

      res.json({ message: "모드 수정 성공" });
    }
  );
});

// 모드 삭제
app.delete("/api/modes/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM modes WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "모드 삭제 실패" });
    }

    res.json({ message: "모드 삭제 성공" });
  });
});

// AI 조회
app.get("/api/ai/settings", (req, res) => {
  db.get("SELECT api_key FROM ai_settings WHERE id = 1", [], (err, row) => {
    if (err) {
      return res.status(500).json({ message: "AI 설정 조회 실패" });
    }

    res.json({
      hasApiKey: !!row?.api_key,
    });
  });
});

// AI API 등록
app.post("/api/ai/settings", (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey || apiKey.trim() === "") {
    return res.status(400).json({ message: "API Key가 비어 있습니다." });
  }

  db.run(
    `
    INSERT INTO ai_settings (id, api_key)
    VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET api_key = excluded.api_key
    `,
    [apiKey],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "API Key 저장 실패" });
      }

      res.json({ message: "API Key 저장 성공" });
    }
  );
});

// AI 삭제
app.delete("/api/ai/settings", (req, res) => {
  db.run("DELETE FROM ai_settings WHERE id = 1", [], function (err) {
    if (err) {
      return res.status(500).json({ message: "API Key 삭제 실패" });
    }

    res.json({ message: "API Key 삭제 성공" });
  });
});

// AI 등록
app.post("/api/ai/chat", (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ message: "질문이 비어 있습니다." });
  }

  db.get("SELECT api_key FROM ai_settings WHERE id = 1", [], async (err, row) => {
    if (err) {
      return res.status(500).json({ message: "API Key 조회 실패" });
    }

    if (!row?.api_key) {
      return res.status(403).json({
        message: "API Key가 등록되어 있지 않습니다.",
      });
    }

    try {
      const client = new OpenAI({
        apiKey: row.api_key,
      });

      const response = await client.responses.create({
        model: "gpt-5.5",
        input: message,
      });

      res.json({
        answer: response.output_text,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "AI 응답 생성 실패",
        error: error.message,
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Jarvis backend running on http://localhost:${PORT}`);
});