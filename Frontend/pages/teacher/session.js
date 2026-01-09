import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import styles from "../styles/teacher/TeacherDashboard.module.css";
import { api } from "../../api";

/* ================== CONFUSION LOGIC ================== */
const CONFUSION_THRESHOLD = 0.58;

function isConfused(score) {
  return typeof score === "number" && score >= CONFUSION_THRESHOLD;
}

function getStatusFromTelemetry(t) {
  if (!t) return { text: "Waiting", class: "gray" };

  if (t.face_count !== 1) return { text: "Proctor Alert", class: "red" };
  if (isConfused(t.confusion_score)) return { text: "Student Confused", class: "yellow" };
  if (typeof t.emotion === "string" && (t.emotion.toLowerCase().includes("happy") || t.emotion.toLowerCase().includes("smile")))
    return { text: "Happy", class: "blue" };

  return { text: "Focused", class: "green" };
}

/* ================== TIMELINE ================== */
function TimelineBar({ timeline }) {
  if (!timeline || timeline.length === 0) return <div className={styles.timelineBar} />;

  const displayed = timeline.slice(-30); // last 30 points
  const colorMap = {
    red: "#ef4444",
    yellow: "#facc15",
    blue: "#3b82f6",
    green: "#22c55e",
    gray: "#64748b",
  };

  return (
    <div className={styles.timelineBar}>
      {displayed.map((p, i) => {
        let statusClass = "green";
        if (p.face_count !== 1) statusClass = "red";
        else if (isConfused(p.confusion_score)) statusClass = "yellow";
        else if (p.emotion && p.emotion.toLowerCase().includes("happy")) statusClass = "blue";

        return (
          <div
            key={p.timestamp || i}
            className={styles.point}
            style={{
              height: `${Math.max(8, (p.confusion_score ?? 0) * 100)}%`,
              background: colorMap[statusClass],
              opacity: i === displayed.length - 1 ? 1 : 0.85,
            }}
            title={`Confusion: ${(p.confusion_score ?? 0).toFixed(2)}`}
          />
        );
      })}
    </div>
  );
}

/* ================== MAIN PAGE ================== */
export default function TeacherSession() {
  const [status, setStatus] = useState("Connecting...");
  const [students, setStudents] = useState({});
  const [reportLoading, setReportLoading] = useState(null);
  const [user, setUser] = useState(null);
  const wsRef = useRef(null);
  const router = useRouter();

  /* ========== Init WS ========== */
  useEffect(() => {
    async function init() {
      const res = await api("/me");
      if (!res.ok) return router.push("/login");
      const user = await res.json();
      if (user.role !== "teacher") return router.push("/login");
      setUser(user);

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

          const t = packet.data;
          const student_id = packet.student_id;
          const student_name = packet.student_name;
          const confusedNow = isConfused(t.confusion_score);

          setStudents((prev) => {
            const prevStudent = prev[student_id] || {};
            const prevTimeline = prevStudent.timeline || [];

            const newTimeline = [
              ...prevTimeline.slice(-59),
              {
                timestamp: Date.now(),
                confusion_score: t.confusion_score ?? 0,
                face_count: t.face_count ?? 0,
                emotion: t.emotion ?? "",
                confused: confusedNow,
              },
            ];

            return {
              ...prev,
              [student_id]: {
                student_id,
                student_name, // ✅ store name from packet directly
                ...t,        // telemetry
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
  }, [router]);

  /* ========== Stop Session ========== */
  async function stopSession(studentId) {
    setReportLoading(studentId);
    try {
      const res = await api(`/report/student/${studentId}`);
      const reportData = await res.json();
      router.push({
        pathname: "/ReportPage",
        query: {
          student_id: studentId,
          report: JSON.stringify(reportData),
        },
      });
    } catch {
      alert("Failed to fetch report");
    } finally {
      setReportLoading(null);
    }
  }

  if (!user) return null;
  const studentList = Object.values(students);

  return (
    <>
      <Head>
        <title>Teacher Session | SmartSession</title>
      </Head>

      <div className={styles.layout}>
        <Sidebar role="teacher" />
        <main className={styles.main}>
          <header className={styles.header}>
            <h1>
              Welcome <span>{user.name}</span>
            </h1>
            <span className={styles.subtext}>Live Session Monitor</span>
          </header>

          <section>
            <div className={styles.statusRow}>
              Status: <span className={styles.badge}>{status}</span>
            </div>

            {studentList.length === 0 ? (
              <div className={styles.waiting}>Waiting for students...</div>
            ) : (
              <div className={styles.grid}>
                {studentList.map((student) => {
                  const status = getStatusFromTelemetry(student);
                  const name = student.student_name ?? `Student ${student.student_id}`;

                  return (
                    <div key={student.student_id} className={styles.card}>
                      <h3 className={styles.studentCardTitle}>
                        Student ID: <span className={styles.studentCardId}>{student.student_id}</span>
                      </h3>

                      <div className={styles.studentNameRow}>
                        Name: <b>{name}</b>
                      </div>

                      <div className={styles.statusBadgeRow}>
                        <span className={`${styles.badge} ${styles[status.class]}`}>{status.text}</span>
                      </div>

                      <div className={styles.metrics}>
                        <div>Gaze: {student.gaze}</div>
                        <div>Faces: {student.face_count}</div>
                        <div>Confusion: {(student.confusion_score ?? 0).toFixed(2)}</div>
                      </div>

                      <div className={styles.timeline}>
                        <div className={styles.timelineTitle}>Confusion Timeline (last 1 min)</div>
                        <TimelineBar timeline={student.timeline} />
                      </div>

                      <button
                        className={styles.stopButton}
                        onClick={() => stopSession(student.student_id)}
                        disabled={reportLoading === student.student_id}
                      >
                        {reportLoading === student.student_id ? "Generating Report..." : "Stop Session & Get Report"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
