"use client";

import React, { useCallback, useEffect, useState } from "react";

type Level = 1 | 2 | 3;

type LevelInfo = {
  id: Level;
  tag: string;
  description: string;
  timeLimit: number;
};

const LEVELS: LevelInfo[] = [
  { id: 1, tag: "Warm-up", description: "10s per question", timeLimit: 10 },
  { id: 2, tag: "Quickfire", description: "8s per question", timeLimit: 8 },
  { id: 3, tag: "Lightning", description: "6s per question", timeLimit: 6 },
];

const LEVEL_UP_STREAK = 20;
const FINAL_LEVEL_ID = LEVELS[LEVELS.length - 1].id;

const MIN_TABLE = 2;
const MAX_TABLE = 5;
const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 10;

const getLevelInfo = (id: Level) => LEVELS.find((info) => info.id === id)!;
const getNextLevelInfo = (id: Level) => {
  const index = LEVELS.findIndex((info) => info.id === id);
  return LEVELS[index + 1];
};

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function HomePage() {
  const [level, setLevel] = useState<Level>(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<Level>(1);
  const [timeLimit, setTimeLimit] = useState<number>(getLevelInfo(1).timeLimit);
  const [a, setA] = useState<number>(2);
  const [b, setB] = useState<number>(2);
  const [answer, setAnswer] = useState<string>("");
  const [questionId, setQuestionId] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  const [questionActive, setQuestionActive] = useState<boolean>(false);

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [mastered, setMastered] = useState<boolean>(false);

  const currentLevelInfo = getLevelInfo(level);

  useEffect(() => {
    setTimeLimit(getLevelInfo(level).timeLimit);
  }, [level]);

  const newQuestion = useCallback(() => {
    const newA = getRandomInt(MIN_TABLE, MAX_TABLE);
    const newB = getRandomInt(MIN_MULTIPLIER, MAX_MULTIPLIER);
    setA(newA);
    setB(newB);
    setAnswer("");
    setQuestionId((prev) => prev + 1);
    setQuestionActive(true);
  }, []);

  useEffect(() => {
    newQuestion();
  }, [newQuestion]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setTimeLeft(timeLimit);
  }, [questionId, timeLimit]);

  const handleTimeout = useCallback(() => {
    if (!questionActive) return;
    setQuestionActive(false);
    setMessage(`⏰ Time's up! It was ${a} × ${b} = ${a * b}. Streak reset.`);
    setStreak(0);
    setTimeout(() => {
      newQuestion();
    }, 900);
  }, [a, b, newQuestion, questionActive]);

  useEffect(() => {
    if (!questionActive || questionStartTime === null) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const remaining = timeLimit - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        handleTimeout();
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [questionActive, questionStartTime, timeLimit, questionId, handleTimeout]);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!questionActive || answer.trim() === "") return;

    const userAnswer = Number(answer.trim());
    const correct = a * b;

    const now = Date.now();
    const elapsedSec =
      questionStartTime !== null ? (now - questionStartTime) / 1000 : timeLimit;

    if (userAnswer === correct && elapsedSec <= timeLimit) {
      const gained = 1;
      setScore((s) => s + gained);

      const nextLevelInfo = getNextLevelInfo(level);
      let leveledUp = false;
      let becameMaster = false;
      let newStreakValue = streak + 1;

      setStreak((s) => {
        const newStreak = s + 1;
        newStreakValue = newStreak;
        setBestStreak((bs) => Math.max(bs, newStreak));

        if (nextLevelInfo && newStreak >= LEVEL_UP_STREAK) {
          setLevel(nextLevelInfo.id);
          setMaxUnlockedLevel((prev) => Math.max(prev, nextLevelInfo.id) as Level);
          leveledUp = true;
        } else if (!nextLevelInfo && newStreak >= LEVEL_UP_STREAK) {
          becameMaster = true;
        }

        return newStreak;
      });

      if (becameMaster) {
        setMastered(true);
      }

      let streakBadge = "";
      if (newStreakValue >= 10) streakBadge = " 🔥";
      else if (newStreakValue >= 5) streakBadge = " ⭐";

      const levelUpNote = leveledUp
        ? ` 🎉 Level up! You’re now on Level ${level + 1} (${nextLevelInfo?.description}).`
        : "";

      const masterNote = becameMaster
        ? ` 🎓 Mastered Level ${FINAL_LEVEL_ID} (${currentLevelInfo.description})! Tap Reset to play again.`
        : "";

      setMessage(
        `✅ Correct! +${gained} point (answered in ${elapsedSec.toFixed(
          1
        )}s)${streakBadge}${levelUpNote}${masterNote}`
      );
    } else {
      setMessage(`❌ ${a} × ${b} = ${correct}. Streak reset.`);
      setStreak(0);
    }

    setQuestionActive(false);
    setTimeout(() => {
      newQuestion();
    }, 700);
  }

  const resetProgress = useCallback(() => {
    setLevel(1);
    setMaxUnlockedLevel(1);
    setScore(0);
    setStreak(0);
    setMastered(false);
    newQuestion();
    setMessage("Progress reset — back to Level 1!");
  }, [newQuestion]);

  useEffect(() => {
    if (level !== FINAL_LEVEL_ID && mastered) {
      setMastered(false);
    }
  }, [level, mastered]);

  const timePercent = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const streakColor =
    streak >= 10 ? "#16a34a" : streak >= 5 ? "#f97316" : "#0f172a";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "radial-gradient(circle at top, #e0f2fe 0, #f5f3ff 40%, #fef3c7 100%)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "white",
          borderRadius: 24,
          boxShadow: "0 24px 60px rgba(15,23,42,0.2)",
          padding: 24,
          fontFamily:
            'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
          border: "1px solid rgba(148,163,184,0.25)",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.7rem",
                fontWeight: 800,
                margin: 0,
                color: "#0f172a",
              }}
            >
              Multiplication Rush 🚀
            </h1>
            <p
              style={{
                margin: 0,
                marginTop: 4,
                fontSize: "0.9rem",
                color: "#64748b",
              }}
            >
              Tables <b>2–5</b> • {currentLevelInfo.description} • Build a streak
            </p>
          </div>

          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              fontSize: "0.75rem",
              color: "#1d4ed8",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              minWidth: 110,
            }}
          >
            <span style={{ fontWeight: 600 }}>Level {level}</span>
            <span style={{ fontSize: "0.7rem" }}>{currentLevelInfo.description}</span>
          </div>
        </header>

        {/* Level buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {LEVELS.map((lvl) => {
            const active = lvl.id === level;
            const locked = lvl.id > maxUnlockedLevel;
            return (
              <button
                key={lvl.id}
                onClick={() => !locked && setLevel(lvl.id)}
                disabled={locked}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: active ? "none" : "1px solid #cbd5f5",
                  background: active
                    ? "linear-gradient(135deg,#4f46e5,#6366f1)"
                    : locked
                    ? "#f1f5f9"
                    : "#f8fafc",
                  color: active ? "white" : "#0f172a",
                  fontSize: "0.85rem",
                  cursor: locked ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  boxShadow: active ? "0 8px 16px rgba(79,70,229,0.4)" : "none",
                  opacity: locked && !active ? 0.6 : 1,
                  transition: "transform 0.05s ease, box-shadow 0.1s ease",
                  minWidth: 130,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <span>
                  Level {lvl.id} · {lvl.tag}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 500,
                  }}
                >
                  {lvl.description} {locked ? "• Locked" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 14,
            fontSize: "0.9rem",
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#eff6ff",
              borderRadius: 12,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#64748b",
              }}
            >
              Score
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "#1d4ed8",
              }}
            >
              {score}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "#ecfdf3",
              borderRadius: 12,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#16a34a",
              }}
            >
              Streak
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.2rem",
                color: streakColor,
              }}
            >
              {streak}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "#fef3c7",
              borderRadius: 12,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#b45309",
              }}
            >
              Best
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "#b45309",
              }}
            >
              {bestStreak}
            </div>
          </div>
        </section>

        {/* Question card */}
        <section
          style={{
            borderRadius: 16,
            background:
              "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #e0f2fe 100%)",
            padding: 18,
            marginBottom: 14,
            boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.25)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              color: "#6366f1",
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Question
          </div>
          <div
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            {a} × {b} = ?
          </div>

          <div
            style={{
              width: "100%",
              height: 10,
              borderRadius: 999,
              background: "#e2e8f0",
              overflow: "hidden",
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${timePercent}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #22c55e 0, #f59e0b 50%, #ef4444 100%)",
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: "0.8rem",
              color: "#475569",
            }}
          >
            Time left: {Math.max(0, timeLeft).toFixed(1)}s
          </div>
        </section>

        {/* Answer form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoFocus
            placeholder="Type your answer"
            style={{
              flex: 1,
              padding: "11px 12px",
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
              outline: "none",
              boxShadow: "0 0 0 0 transparent",
              color: "black",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "11px 16px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "white",
              fontWeight: 700,
              whiteSpace: "nowrap",
              fontSize: "0.95rem",
              boxShadow: "0 8px 18px rgba(79,70,229,0.45)",
            }}
          >
            Submit
          </button>
        </form>

        {/* Feedback */}
        <div
          style={{
            minHeight: 24,
            fontSize: "0.9rem",
            color: message.startsWith("✅")
              ? "#16a34a"
              : message
              ? "#dc2626"
              : "#64748b",
            marginBottom: 6,
          }}
        >
          {message}
        </div>
        {mastered && (
          <div
            style={{
              marginBottom: 10,
              fontSize: "0.85rem",
              color: "#0f172a",
              textAlign: "center",
            }}
          >
            🎓 You’ve completed Level {FINAL_LEVEL_ID} — you are now a master!
            <div
              style={{
                marginTop: 4,
              }}
            >
              <button
                type="button"
                onClick={resetProgress}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid #a855f7",
                  background: "#7c3aed",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reset progress
              </button>
            </div>
          </div>
        )}
        {!mastered && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            Tip: press <b>Enter</b> to answer faster and keep the streak going.
          </div>
        )}
      </div>
    </main>
  );
}
