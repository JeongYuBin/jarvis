import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:4000/api";
const pages = ["home", "memo", "calendar", "mode", "AI"];

function App() {
  const [text, setText] = useState("JARVIS 시스템 대기 중...");
  const [page, setPage] = useState("home");
  const [memos, setMemos] = useState([]);
  const [memoInput, setMemoInput] = useState("");
  const [editingMemoId, setEditingMemoId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleInput, setScheduleInput] = useState("");
  const [scheduleDateInput, setScheduleDateInput] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [modes, setModes] = useState([]);
  const [modeName, setModeName] = useState("");
  const [modeActions, setModeActions] = useState("");
  const [editingModeId, setEditingModeId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGestureMode, setIsGestureMode] = useState(false);
  const [gestureText, setGestureText] = useState("제스처 대기 중");
  const [aiApiKey, setAiApiKey] = useState("");
  const [hasAiApiKey, setHasAiApiKey] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const positionsRef = useRef([]);
  const gestureLockRef = useRef(false); 
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
  fetchModes();
  fetchAiSettings();
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

  const fetchModes = async () => {
    const response = await fetch(`${API_URL}/modes`);
    const data = await response.json();
    setModes(data);
  }

  const movePage = (targetPage) => {
    setPage(targetPage);
    setIsMenuOpen(false);

    if (targetPage === "memo") fetchMemos();
    if (targetPage === "calendar") fetchSchedules();
    if (targetPage === "mode") fetchModes();
    if (targetPage === "AI") fetchAiSettings();
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

  const saveMemoDirectly = async () => {
    if (!memoInput.trim()) {
      setText("메모 내용을 입력해주세요.");
      return;
    }

    if (editingMemoId) {
      await fetch(`${API_URL}/memos/${editingMemoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: memoInput }),
      });

      setText("메모를 수정했습니다.");
    } else {
      await addMemo(memoInput);
      setText("메모를 추가했습니다.");
    }

    setMemoInput("");
    setEditingMemoId(null);
    await fetchMemos();
  };

  const editMemo = (memo) => {
    setMemoInput(memo.content);
    setEditingMemoId(memo.id);
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

  const saveScheduleDirectly = async () => {
    if (!scheduleInput.trim() || !scheduleDateInput) {
      setText("일정 내용과 날짜를 입력해주세요.");
      return;
    }

    if (editingScheduleId) {
      await fetch(`${API_URL}/schedules/${editingScheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: scheduleInput,
          schedule_date: scheduleDateInput,
        }),
      });

      setText("일정을 수정했습니다.");
    } else {
      await addSchedule(scheduleInput, scheduleDateInput);
      setText("일정을 추가했습니다.");
    }

    setScheduleInput("");
    setScheduleDateInput("");
    setEditingScheduleId(null);
    await fetchSchedules();
  };

  const editSchedule = (schedule) => {
    setScheduleInput(schedule.content);
    setScheduleDateInput(schedule.schedule_date);
    setEditingScheduleId(schedule.id);

    const date = new Date(schedule.schedule_date);
    setCurrentYear(date.getFullYear());
    setCurrentMonth(date.getMonth());
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

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .replace(/\s/g, "")
      .replace(/자비스/g, "")
      .replace(/jarvis/g, "")
      .trim();
  };

  const handleCommand = async (command) => {
    const normalizedCommand = normalizeText(command);

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

    if ( command.includes("모드") || normalizedCommand.includes("mode")) {
      movePage("mode");
      setText("모드 화면입니다.");
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

    if (normalizedCommand.includes("모드") && normalizedCommand.includes("실행")) {
    const targetMode = modes.find((mode) => {
      const normalizedModeName = normalizeText(mode.name);
      return normalizedCommand.includes(normalizedModeName);
    });

    if (targetMode) {
      runMode(targetMode);
      return;
    }

    const reply = "해당 모드를 찾지 못했습니다.";
    setText(reply);
    speak(reply);
    return;
  }

  if (
    command.includes("AI") ||
    command.includes("에이아이") ||
    command.includes("생성형")
  ) {
    movePage("AI");
    setText("생성형 AI 페이지입니다.");
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

// 중지 손가락 감지 함수
const isMiddleFinger = (landmarks) => {
  // 중지 펴짐
  const middleUp = landmarks[12].y < landmarks[10].y;

  // 나머지 손가락 접힘
  const indexDown = landmarks[8].y > landmarks[6].y;
  const ringDown = landmarks[16].y > landmarks[14].y;
  const pinkyDown = landmarks[20].y > landmarks[18].y;

  return middleUp && indexDown && ringDown && pinkyDown;
};

const handleGestureResult = (results) => {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    positionsRef.current = [];
    gestureLockRef.current = false;
    return;
  }

  const now = Date.now();

  const landmarks = results.multiHandLandmarks[0];
  const palmX = getPalmCenterX(landmarks);

  // 손바닥 → Main
  if (isPalmOpen(landmarks)) {
    movePage("home");
    setGestureText("손바닥 감지 → Main");
    positionsRef.current = [];
    return;
  }

  const handsDetected = results.multiHandLandmarks

  // 양손 가운데 손가락
  if (
    handsDetected.length >= 2 &&
    isMiddleFinger(results.multiHandLandmarks[0]) &&
    isMiddleFinger(results.multiHandLandmarks[1]) &&
    !gestureLockRef.current
  ) {
    gestureLockRef.current = true;

    window.open("https://www.youtube.com/watch?v=WfIXP7ygOvE&list=RDWfIXP7ygOvE&start_radio=1", "_blank");

    setGestureText("이스터에그 실행 (양손)");  // 이스터에그 실행 (양손)

    setTimeout(() => {
      gestureLockRef.current = false;
    }, 2000);

    return;
  }

  // 가운데 손가락 (한 손)
  if (isMiddleFinger(landmarks) && !gestureLockRef.current) {
    gestureLockRef.current = true;

    window.open("https://www.youtube.com/watch?v=8vkkAmFcYN4&list=RD8vkkAmFcYN4&start_radio=1", "_blank");

    setGestureText("이스터에그 실행");  // 😎 이스터에그 실행 (한 손)

    setTimeout(() => {
      gestureLockRef.current = false;
    }, 2000);

    return;
  }

  // 스와이프 (프레임 누적)
  positionsRef.current.push(palmX);

  if (positionsRef.current.length > 12) {
    positionsRef.current.shift();
  }

  if (positionsRef.current.length === 12 && !gestureLockRef.current) {
    const start = positionsRef.current[0];
    const end = positionsRef.current[11];
    const diff = end - start;

    if (Math.abs(diff) > 0.22) {
      gestureLockRef.current = true;

      if (diff > 0) {
        moveNextPage();
        setGestureText("오른쪽 스와이프");
      } else {
        movePrevPage();
        setGestureText("왼쪽 스와이프");
      }

      positionsRef.current = [];
      gestureLockRef.current = true;
      positionsRef.current = [];
      // 방향 복귀 무시용 기준값 저장
      gestureStartXRef.current = palmX;

      setTimeout(() => {
        gestureLockRef.current = false;

        // 완전히 초기화
        positionsRef.current = [];
        gestureStartXRef.current = null;
      }, 1500);
    }
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
      maxNumHands: 2,
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

  // Mode 실행 함수(GameMode, StudeMode)
  const runMode = (mode) => {
    let actions = [];

    try {
      actions =
        typeof mode.actions === "string" ? JSON.parse(mode.actions) : mode.actions;
    } catch (error) {
      console.error("모드 실행 파싱 오류:", error);
      setText("모드 실행 정보를 읽지 못했습니다.");
      return;
    }

    actions
      .filter((action) => action.value && action.value.trim() !== "")
      .forEach((action, index) => {
        if (action.type === "open_url") {
          setTimeout(() => {
            window.open(action.value, "_blank", "noopener,noreferrer");
          }, index * 300);
        }
      });

    setText(`${mode.name}를 실행합니다.`);
    speak(`${mode.name}를 실행합니다.`);
  };

  // Mode 생성 / 수정
  const saveMode = async () => {
    if (!modeName.trim() || !modeActions.trim()) return;

    const actions = modeActions
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url !== "")
      .map((url) => ({
        type: "open_url",
        value: url,
      }));

    if (editingModeId) {
      await fetch(`${API_URL}/modes/${editingModeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modeName, actions }),
      });
    } else {
      await fetch(`${API_URL}/modes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modeName, actions }),
      });
    }

    setModeName("");
    setModeActions("");
    setEditingModeId(null);

    await fetchModes();
  };

  // Mode 삭제
  const deleteMode = async (id) => {
    await fetch(`${API_URL}/modes/${id}`, {
      method: "DELETE",
    });

    fetchModes();
  };

  // Mode 수정 버튼 클릭 시
  const editMode = (mode) => {
    setModeName(mode.name);

    const parsed = JSON.parse(mode.actions);
    const urls = parsed.map((a) => a.value).join("\n");

    setModeActions(urls);
    setEditingModeId(mode.id);
  };

  // AI 모드 세팅
  const fetchAiSettings = async () => {
    const response = await fetch(`${API_URL}/ai/settings`);
    const data = await response.json();
    setHasAiApiKey(data.hasApiKey);
  };

  const saveAiApiKey = async () => {
    if (!aiApiKey.trim()) {
      setText("API Key를 입력해주세요.");
      return;
    }

    await fetch(`${API_URL}/ai/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: aiApiKey }),
    });

    setAiApiKey("");
    setHasAiApiKey(true);
    setText("AI API Key를 저장했습니다.");
  };

  const deleteAiApiKey = async () => {
    await fetch(`${API_URL}/ai/settings`, {
      method: "DELETE",
    });

    setHasAiApiKey(false);
    setText("AI API Key를 삭제했습니다.");
  };

  const askAi = async () => {
    await askAiWithMessage(aiQuestion);
  };

  // AI 음성으로 질문하기 
  const startAiVoiceQuestion = () => {
    if (!hasAiApiKey) {
      const reply = "API Key를 먼저 등록해주세요.";
      setText(reply);
      speak(reply);
      return;
    }

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

    recognition.onresult = async (event) => {
      const question = event.results[0][0].transcript;

      setAiQuestion(question);
      setText(`AI 질문: ${question}`);

      await askAiWithMessage(question);
    };
  };

  const askAiWithMessage = async (message) => {
    if (!message.trim()) return;

    setAiAnswer("생성형 AI가 답변을 생성 중입니다...");

    const response = await fetch(`${API_URL}/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (!response.ok) {
      setAiAnswer(data.message || "AI 요청 실패");
      speak(data.message || "AI 요청에 실패했습니다.");
      return;
    }

    setAiAnswer(data.answer);
    speak(data.answer);
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
            <button onClick={() => movePage("mode")}>Mode</button>
            <button onClick={() => movePage("AI")}>AI</button>
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

            <div className="memo-form">
              <input
                placeholder="메모 내용을 입력하세요"
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
              />

              <button onClick={saveMemoDirectly}>
                {editingMemoId ? "메모 수정 완료" : "메모 추가"}
              </button>

              {editingMemoId && (
                <button
                  onClick={() => {
                    setMemoInput("");
                    setEditingMemoId(null);
                  }}
                >
                  수정 취소
                </button>
              )}
            </div>

            <div className="memo-box">
              {memos.length === 0 ? (
                <p>저장된 메모가 없습니다.</p>
              ) : (
                memos.map((memo) => (
                  <div className="memo-item" key={memo.id}>
                    <span>- {memo.content}</span>

                    <div className="item-buttons">
                      <button onClick={() => editMemo(memo)}>수정</button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteMemo(memo.id)}
                      >
                        삭제
                      </button>
                    </div>
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
                          <div className="schedule-buttons">
                            <button onClick={() => editSchedule(schedule)}>수정</button>
                            <button onClick={() => deleteSchedule(schedule.id)}>x</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="schedule-form">
              <input
                type="date"
                value={scheduleDateInput}
                onChange={(e) => setScheduleDateInput(e.target.value)}
              />

              <input
                placeholder="일정 내용을 입력하세요"
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
              />

              <button onClick={saveScheduleDirectly}>
                {editingScheduleId ? "일정 수정 완료" : "일정 추가"}
              </button>

              {editingScheduleId && (
                <button
                  onClick={() => {
                    setScheduleInput("");
                    setScheduleDateInput("");
                    setEditingScheduleId(null);
                  }}
                >
                  수정 취소
                </button>
              )}
            </div>
          </section>
        )}

        {page === "mode" && (
          <section className="page-section">
            <h2>Mode Manager</h2>

            {/* 입력 영역 */}
            <div className="mode-form">
              <input
                placeholder="모드 이름 (예: 공부모드)"
                value={modeName}
                onChange={(e) => setModeName(e.target.value)}
              />

              <textarea
                placeholder="실행한 URL을 한 줄에 하나씩 입력"
                value={modeActions}
                onChange={(e) => setModeActions(e.target.value)}
              />

              <button onClick={saveMode}>
                {editingModeId ? "수정 완료" : "모드 추가"}
              </button>
            </div>

            {/* 리스트 */}
            <div className="mode-box">
              {modes.length === 0 ? (
                <p>등록된 모드가 없습니다.</p>
              ) : (
                modes.map((mode) => (
                  <div key={mode.id} className="mode-item">
                    <h3>{mode.name}</h3>

                    <div className="mode-buttons">
                      <button onClick={() => runMode(mode)}>실행</button>
                      <button onClick={() => editMode(mode)}>수정</button>
                      <button onClick={() => deleteMode(mode.id)}>삭제</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {page === "AI" && (
          <section className="page-section">
            <h2>Generative AI</h2>

            <div className="ai-status">
              {hasAiApiKey ? (
                <p>API Key가 등록되어 있습니다.</p>
              ) : (
                <p>API Key를 등록해야 AI 기능을 사용할 수 있습니다.</p>
              )}
            </div>

            <div className="ai-key-form">
              <input
                type="password"
                placeholder="OpenAI API Key 입력"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
              />

              <button onClick={saveAiApiKey}>API Key 저장</button>

              {hasAiApiKey && (
                <button className="delete-btn" onClick={deleteAiApiKey}>
                  API Key 삭제
                </button>
              )}
            </div>

            <div className="ai-chat-box">
              <textarea
                placeholder="Jarvis에게 질문하기"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                disabled={!hasAiApiKey}
              />

              <button onClick={askAi} disabled={!hasAiApiKey}>
                질문하기
              </button>
              <button onClick={startAiVoiceQuestion} disabled={!hasAiApiKey}>
                음성으로 질문하기
              </button>

              <div className="ai-answer">
                {aiAnswer || "AI 답변이 여기에 표시됩니다."}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;