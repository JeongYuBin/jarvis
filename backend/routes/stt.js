const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

const upload = multer({
  dest: "audio/",
});

router.post("/stt", upload.single("audio"), (req, res) => {
  const audioPath = req.file.path;

  const whisper = spawn(
    path.join(__dirname, "../whisper/whisper-cli.exe"),
    [
      "-m",
      path.join(__dirname, "../whisper/ggml-base.bin"),
      "-f",
      audioPath,
      "-l",
      "ko",
    ]
  );

  let result = "";

  whisper.stdout.on("data", (data) => {
    result += data.toString();
  });

  whisper.stderr.on("data", (data) => {
    console.log(data.toString());
  });

  whisper.on("close", () => {
    res.json({
      text: result,
    });
  });
});

module.exports = router;