import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:4000/api";
const pages = ["home", "memo", "calendar"];

function App() {
  const [text, setText] = useState("JARVIS 시스템 대기 중...");
  const [page, setPage] = useState("home");
  const [memos, setMemos] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGestureMode, setIsGestureMode] = useState(false);
  const [gestureText, setGestureText] = useState("제스처 대기 중");

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const gestureStartXRef = useRef(null);
  const lastGestureTimeRef = useRef(0);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    fetchMemos();
    fetchSchedules();
  }, []);

  const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const loadMediaPipe = async () => {
  await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
  await loadScript(
    "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
  );
};

  const speak = (message) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "ko-KR";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const fetchMemos = async () => {
    const response = await fetch(`${API_URL}/memos`);
    const data = await response.json();
    setMemos(data);
  };

  const fetchSchedules = async () => {
    const response = await fetch(`${API_URL}/schedules`);
    const data = await response.json();
    setSchedules(data);
  };

  const movePage = (targetPage) => {
    setPage(targetPage);
    setIsMenuOpen(false);

    if (targetPage === "memo") fetchMemos();
    if (targetPage === "calendar") fetchSchedules();
  };

  const moveNextPage = () => {
    const currentIndex = pages.indexOf(pageRef.current);
    const nextIndex = (currentIndex + 1) % pages.length;
    movePage(pages[nextIndex]);
    setGestureText("오른쪽 스와이프 감지 → 다음 페이지");
  };

  const movePrevPage = () => {
    const currentIndex = pages.indexOf(pageRef.current);
    const prevIndex = (currentIndex - 1 + pages.length) % pages.length;
    movePage(pages[prevIndex]);
    setGestureText("왼쪽 스와이프 감지 → 이전 페이지");
  };

  const addMemo = async (content) => {
    await fetch(`${API_URL}/memos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    await fetchMemos();
  };

  const addSchedule = async (content, scheduleDate) => {
    await fetch(`${API_URL}/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        schedule_date: scheduleDate,
      }),
    });

    await fetchSchedules();
  };

  const deleteMemo = async (id) => {
    await fetch(`${API_URL}/memos/${id}`, {
      method: "DELETE",
    });

    await fetchMemos();
  };

  const deleteSchedule = async (id) => {
    await fetch(`${API_URL}/schedules/${id}`, {
      method: "DELETE",
    });

    await fetchSchedules();
  };

  const parseScheduleCommand = (command) => {
    const monthMatch = command.match(/(\d{1,2})월/);
    const dayMatch = command.match(/(\d{1,2})일/);

    if (!monthMatch || !dayMatch) return null;

    const month = Number(monthMatch[1]);
    const day = Number(dayMatch[1]);
    const year = today.getFullYear();

    const content = command
      .replace(/자비스/gi, "")
      .replace(/jarvis/gi, "")
      .replace(`${month}월`, "")
      .replace(`${day}일`, "")
      .replace("일정", "")
      .replace("메모", "")
      .replace("추가해줘", "")
      .replace("추가", "")
      .replace("저장해줘", "")
      .replace("저장", "")
      .trim();

    const scheduleDate = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    return {
      content: content || "새 일정",
      scheduleDate,
      month: month - 1,
      year,
    };
  };

  const handleCommand = async (command) => {
    const normalizedCommand = command.toLowerCase();

    if (
      command.includes("메인") ||
      command.includes("홈") ||
      command.includes("처음")
    ) {
      movePage("home");
      setText("메인 화면입니다.");
      return;
    }

    if (command.includes("메모") && command.includes("이동")) {
      movePage("memo");
      setText("메모 화면입니다.");
      return;
    }

    if (
      command.includes("달력") ||
      command.includes("캘린더") ||
      normalizedCommand.includes("calendar")
    ) {
      movePage("calendar");
      setText("달력 화면입니다.");
      return;
    }

    if (
      command.includes("월") &&
      command.includes("일") &&
      command.includes("추가")
    ) {
      const parsed = parseScheduleCommand(command);

      if (!parsed) {
        const reply = "날짜를 인식하지 못했습니다.";
        setText(reply);
        speak(reply);
        return;
      }

      await addMemo(`${parsed.scheduleDate} ${parsed.content}`);
      await addSchedule(parsed.content, parsed.scheduleDate);

      setCurrentYear(parsed.year);
      setCurrentMonth(parsed.month);
      movePage("calendar");

      const reply = `${parsed.scheduleDate}에 ${parsed.content} 일정을 추가했습니다.`;
      setText(reply);
      speak(reply);
      return;
    }

    if (command.includes("안녕")) {
      const reply = "안녕하세요. 저는 개인 AI 비서 자비스입니다.";
      setText(reply);
      speak(reply);
      return;
    }

    if (command.includes("메모")) {
      const memo = command
        .replace(/자비스/gi, "")
        .replace(/jarvis/gi, "")
        .replace("메모", "")
        .replace("추가", "")
        .replace("저장", "")
        .replace("해줘", "")
        .trim();

      if (!memo) {
        const reply = "저장할 메모 내용을 다시 말해주세요.";
        setText(reply);
        speak(reply);
        return;
      }

      await addMemo(memo);

      const reply = "메모를 저장했습니다.";
      setText(reply);
      speak(reply);
      return;
    }

    const reply = "아직 등록되지 않은 명령입니다.";
    setText(reply);
    speak(reply);
  };

  const startListeningOnce = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Chrome 브라우저에서 실행해주세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.start();

    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      setText(`인식된 명령: ${command}`);
      handleCommand(command);
    };
  };

  const isPalmOpen = (landmarks) => {
    const fingerTips = [8, 12, 16, 20];
    const fingerPips = [6, 10, 14, 18];

    let openCount = 0;

    for (let i = 0; i < fingerTips.length; i++) {
      if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
        openCount++;
      }
    }

    return openCount >= 4;
  };

  const getPalmCenterX = (landmarks) => {
  const palmPoints = [0, 5, 9, 13, 17];

  const sum = palmPoints.reduce((acc, index) => {
    return acc + landmarks[index].x;
  }, 0);

  return sum / palmPoints.length;
};

const handleGestureResult = (results) => {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    gestureStartXRef.current = null;
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  const palmX = getPalmCenterX(landmarks);
  const now = Date.now();

  if (isPalmOpen(landmarks)) {
    movePage("home");
    setGestureText("손바닥 감지 → Main 페이지");
    gestureStartXRef.current = null;
    return;
  }

  if (gestureStartXRef.current === null) {
    gestureStartXRef.current = palmX;
    return;
  }

  const diffX = palmX - gestureStartXRef.current;

  if (now - lastGestureTimeRef.current < 900) {
    return;
  }

  if (diffX > 0.18) {  // 민감도(인식 잘 안되면 낮추기)
    lastGestureTimeRef.current = now;
    gestureStartXRef.current = palmX;
    moveNextPage();
    return;
  }

  if (diffX < -0.18) {
    lastGestureTimeRef.current = now;
    gestureStartXRef.current = palmX;
    movePrevPage();
    return;
  }
};

  const startGestureMode = async () => {
    if (!videoRef.current) return;

    await loadMediaPipe();
    const hands = new window.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(handleGestureResult);

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    await camera.start();

    setIsGestureMode(true);
    setGestureText("제스처 인식 모드 실행 중");
  };

  const stopGestureMode = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }

    setIsGestureMode(false);
    setGestureText("제스처 인식 모드를 종료했습니다.");
  };

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    const mondayStartIndex = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];

    for (let i = 0; i < mondayStartIndex; i++) days.push(null);
    for (let day = 1; day <= lastDate; day++) days.push(day);
    while (days.length % 7 !== 0) days.push(null);

    return days;
  };

  const getSchedulesByDay = (day) => {
    if (!day) return [];

    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    return schedules.filter((schedule) => schedule.schedule_date === dateKey);
  };

  return (
    <div className="app-layout">
      <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isMenuOpen && (
        <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}>
          <aside className="slide-menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <h2>JARVIS</h2>
              <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
                ×
              </button>
            </div>

            <button onClick={() => movePage("home")}>Main</button>
            <button onClick={() => movePage("memo")}>Memo</button>
            <button onClick={() => movePage("calendar")}>Calendar</button>
          </aside>
        </div>
      )}

      <main className="container">
        <h1>J.A.R.V.I.S</h1>
        <p className="subtitle">Personal AI Assistant Demo</p>

        <video ref={videoRef} className="camera-preview" playsInline />

        {page === "home" && (
          <section className="page-section">
            <div className="circle">
              <span>ONLINE</span>
            </div>

            <div className="panel">
              <p>{text}</p>
            </div>

            <div className="control-buttons">
              <button onClick={startListeningOnce}>음성 명령 시작</button>

              {isGestureMode ? (
                <button onClick={stopGestureMode}>제스처 인식 종료</button>
              ) : (
                <button onClick={startGestureMode}>제스처 인식 시작</button>
              )}
            </div>

            <div className="gesture-panel">
              <p>{gestureText}</p>
              <span>손바닥 펼치기 → Main</span>
              <span>오른쪽 스와이프 → 다음 페이지</span>
              <span>왼쪽 스와이프 → 이전 페이지</span>
            </div>

            <div className="command-guide">
              <p>사용 가능한 명령어</p>
              <span>“Jarvis 메모 페이지로 이동해줘”</span>
              <span>“Jarvis 달력 페이지로 이동해줘”</span>
              <span>“Jarvis 4월 30일 세션 발표 추가해줘”</span>
            </div>
          </section>
        )}

        {page === "memo" && (
          <section className="page-section">
            <h2>Memo Page</h2>

            <div className="panel">
              <p>{text}</p>
            </div>

            <div className="memo-box">
              {memos.length === 0 ? (
                <p>저장된 메모가 없습니다.</p>
              ) : (
                memos.map((memo) => (
                  <div className="memo-item" key={memo.id}>
                    <span>- {memo.content}</span>
                    <button
                      className="delete-btn"
                      onClick={() => deleteMemo(memo.id)}
                    >
                      삭제
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {page === "calendar" && (
          <section className="page-section">
            <h2>Calendar Page</h2>

            <div className="calendar-header">
              <button onClick={goPrevMonth}>이전</button>
              <h3>
                {currentYear}년 {currentMonth + 1}월
              </h3>
              <button onClick={goNextMonth}>다음</button>
            </div>

            <div className="calendar">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div className="calendar-day-name" key={day}>
                  {day}
                </div>
              ))}

              {renderCalendarDays().map((day, index) => {
                const daySchedules = getSchedulesByDay(day);

                return (
                  <div className="calendar-cell" key={index}>
                    {day && <span className="date-number">{day}</span>}

                    <div className="schedule-list">
                      {daySchedules.map((schedule) => (
                        <div className="schedule-item" key={schedule.id}>
                          <span>{schedule.content}</span>
                          <button onClick={() => deleteSchedule(schedule.id)}>
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;