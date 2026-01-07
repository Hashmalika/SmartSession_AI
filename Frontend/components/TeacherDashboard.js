
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { api } from "../api";
import styles from "./styles/TeacherDashboard.module.css";

export default function TeacherDashboard() {
  const [status, setStatus] = useState("Connecting...");
  const [students, setStudents] = useState({}); // <-- MULTI STUDENTS
  const [reportLoading, setReportLoading] = useState(null);
  const wsRef = useRef(null);
  const router = useRouter();

  // --- WebSocket connection ---
  useEffect(() => {
    async function init() {
      const res = await api("/me");
      if (!res.ok) return (window.location = "/login");
      const user = await res.json();
      if (user.role !== "teacher") return (window.location = "/login");

      function connectWS() {
        const ws = new WebSocket("ws://localhost:8000/ws/teacher");
        wsRef.current = ws;

        ws.onopen = () => setStatus("Connected");
        ws.onclose = () => {
          setStatus("Reconnecting...");
          setTimeout(connectWS, 2000);
        };
        ws.onerror = () => setStatus("Error");

        ws.onmessage = (msg) => {
          const packet = JSON.parse(msg.data);
          if (packet.type !== "telemetry") return;

          const s = {
            student_id: packet.student_id,
            ...packet.data,
          };

          setStudents((prev) => {
            const prevStudent = prev[s.student_id] || {};
            const prevTimeline = prevStudent.timeline || [];

            const confusion = s.confusion_score ?? 0;

            const newTimeline = [
              ...prevTimeline.slice(-59),
              {
                t: Date.now(),
                confusion,
                emotion: s.emotion,
                face_count: s.face_count,
              },
            ];

            return {
              ...prev,
              [s.student_id]: {
                ...s,
                timeline: newTimeline,
              },
            };
          });
        };
      }

      connectWS();
    }

    init();
    return () => wsRef.current?.close();
  }, []);

  // --- Status helpers ---
  function isConfused(s) {
    if (!s) return false;
    const threshold = s.confusion_threshold ?? 0.45;
    return s.confusion_score >= threshold || s.confused === true;
  }

  function getStatusClass(s) {
    if (!s) return "gray";
    if (s.face_count !== 1) return "red";
    if (isConfused(s)) return "yellow";
    if (s.emotion === "Happy / Engaged") return "blue";
    if (s.emotion === "Focused / Neutral") return "green";
    return "green";
  }

  function getStatusText(s) {
    if (!s) return "Waiting for student...";
    if (s.face_count !== 1) return "Proctor Alert";
    if (isConfused(s)) return "Student Confused";
    if (s.emotion === "Happy / Engaged") return "Student Engaged";
    if (s.emotion === "Focused / Neutral") return "Student Focused";
    return "Student Focused";
  }

  // --- Stop Session and fetch report ---
  async function stopSession(studentId) {
    setReportLoading(studentId);

    try {
      const res = await api(`/report/student/${studentId}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const reportData = await res.json();

      router.push({
        pathname: "/ReportPage",
        query: {
          student_id: studentId,
          report: JSON.stringify(reportData),
        },
      });
    } catch (err) {
      console.error("Error fetching report:", err);
      alert("Failed to fetch report");
    } finally {
      setReportLoading(null);
    }
  }

  const studentList = Object.values(students);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>SmartSession – Teacher Dashboard</h1>
        <div className={styles.status}>{status}</div>
      </div>

      {studentList.length === 0 ? (
        <div className={styles.waiting}>Waiting for students...</div>
      ) : (
        <div className={styles.grid}>
          {studentList.map((student) => (
            <div key={student.student_id} className={styles.card}>
              <div className={styles.studentRow}>
                <div>
                  <b>Student:</b> {student.student_id}
                </div>
                <div
                  className={`${styles.badge} ${
                    styles[getStatusClass(student)]
                  }`}
                >
                  {getStatusText(student)}
                </div>
              </div>

              <div className={styles.metrics}>
                <div>Emotion: {student.emotion}</div>
                <div>Gaze: {student.gaze}</div>
                <div>Faces: {student.face_count}</div>
                <div>
                  Confusion: {(student.confusion_score ?? 0).toFixed(2)}
                </div>
              </div>

              <div className={styles.timeline}>
                <div className={styles.timelineTitle}>Engagement Timeline</div>
                <div className={styles.timelineBar}>
                  {(student.timeline || []).map((p, i) => {
                    const s = {
                      face_count: p.face_count ?? 1,
                      confusion_score: p.confusion ?? 0,
                      emotion: p.emotion ?? "Unknown",
                    };

                    const status = getStatusClass(s);

                    const colorMap = {
                      red: "#ef4444",
                      yellow: "#facc15",
                      blue: "#3b82f6",
                      green: "#22c55e",
                      gray: "#9ca3af",
                    };

                    return (
                      <div
                        key={i}
                        className={styles.point}
                        style={{
                          height: `${Math.min(
                            100,
                            (p.confusion ?? 0) * 100
                          )}%`,
                          background: colorMap[status],
                        }}
                        title={`${new Date(p.t).toLocaleTimeString()}: ${
                          p.emotion
                        } (${(p.confusion ?? 0).toFixed(2)})`}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                className={styles.stopButton}
                onClick={() => stopSession(student.student_id)}
                disabled={reportLoading === student.student_id}
              >
                {reportLoading === student.student_id
                  ? "Generating Report..."
                  : "Stop Session & Get Report"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
