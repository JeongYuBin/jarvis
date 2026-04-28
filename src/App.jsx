import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("JARVIS 시스템 대기 중...");
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    const savedMemos = JSON.parse(localStorage.getItem("memos")) || [];
    setMemos(savedMemos);
  }, []);

  const speak = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "ko-KR";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Chrome 브라우저에서 실행해주세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.start();

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      setText(`인식된 명령: ${command}`);
      handleCommand(command);
    };
  };

  const handleCommand = (command) => {
    if (command.includes("안녕")) {
      const reply = "안녕하세요. 저는 개인 AI 비서 자비스입니다.";
      setText(reply);
      speak(reply);
    } else if (command.includes("오늘 일정")) {
      const reply = "오늘 일정은 정규 세션 발표 준비입니다.";
      setText(reply);
      speak(reply);
    } else if (command.includes("메모")) {
      const memo = command
        .replace("메모", "")
        .replace("추가", "")
        .replace("저장", "")
        .trim();

      const newMemos = [...memos, memo || "새 메모"];
      setMemos(newMemos);
      localStorage.setItem("memos", JSON.stringify(newMemos));

      const reply = "메모를 저장했습니다.";
      setText(reply);
      speak(reply);
    } else {
      const reply = "아직 등록되지 않은 명령입니다.";
      setText(reply);
      speak(reply);
    }
  };

  return (
    <div className="container">
      <h1>J.A.R.V.I.S</h1>
      <p className="subtitle">Personal AI Assistant Demo</p>

      <div className="circle">
        <span>ONLINE</span>
      </div>

      <div className="panel">
        <p>{text}</p>
      </div>

      <button onClick={startListening}>음성 명령 시작</button>

      <div className="memo-box">
        <h2>Memo List</h2>
        {memos.length === 0 ? (
          <p>저장된 메모가 없습니다.</p>
        ) : (
          memos.map((memo, index) => <p key={index}>- {memo}</p>)
        )}
      </div>
    </div>
  );
}

export default App;