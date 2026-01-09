// student/session.js
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import styles from "../styles/student/Student.module.css";
import { api } from "../../api";

export default function StudentSession() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Connecting");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");

    async function init() {
      // Auth check
      const res = await api("/me");
      if (!res.ok) return router.push("/login");

      const u = await res.json();
      if (u.role !== "student") return router.push("/login");

      setUser(u);

      // Camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      // WebSocket connect
      const ws = new WebSocket("ws://localhost:8000/ws/student");
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("Live");
        ws.send(JSON.stringify({ type: "init", student_id: u.user_id }));
        intervalRef.current = setInterval(sendFrame, 500);
      };

      ws.onclose = () => {
        setStatus("Reconnecting");
        clearInterval(intervalRef.current);
      };

      ws.onerror = () => ws.close();

      function sendFrame() {
        if (!videoRef.current?.videoWidth) return;
        if (ws.readyState !== WebSocket.OPEN) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        ws.send(
          JSON.stringify({
            student_id: u.user_id,
            frame: canvas.toDataURL("image/jpeg"),
            timestamp: Date.now(),
          })
        );
      }
    }

    init();

    return () => {
      clearInterval(intervalRef.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line
  }, []);

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Live Session | SmartSession</title>
      </Head>

      <div className={styles.layout}>
        <Sidebar role="student" />

        <main className={styles.main}>
          <header className={styles.header}>
            <h1>Live Session</h1>
            <span className={styles.subtext}>
              Camera: {status} | Teacher: Assigned Teacher
            </span>
          </header>

          <section className={styles.session}>
            <div className={styles.videoContainer}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={styles.video}
              />
            </div>
            <div className={styles.sessionInfo}>
              <p>Session in progress...</p>
              <p className={styles.notice}>
                ⚠ This session is monitored. Do not leave the screen or switch tabs.
              </p>
            </div>
          </section>

          <div className={styles.action}>
            <button
              className={styles.primaryBtn}
              onClick={() => router.push("/student/dashboard")}
            >
              Exit Session
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
