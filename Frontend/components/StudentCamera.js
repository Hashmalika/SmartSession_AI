import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import styles from "./styles/StudentCamera.module.css";

export default function StudentCamera() {
  const [status, setStatus] = useState("Connecting");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");

    async function init() {
      // Auth check
      const res = await api("/me");
      if (!res.ok) return (window.location.href = "/login");

      const user = await res.json();
      if (user.role !== "student") return (window.location.href = "/login");

      // Camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      // WebSocket connect
      const ws = new WebSocket("ws://localhost:8000/ws/student");
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("Live");
        ws.send(JSON.stringify({ type: "init", student_id: user.user_id }));
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
            student_id: user.user_id,
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
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <div className={styles.statusRow}>
          <span
            className={`${styles.dot} ${
              status === "Live" ? styles.green : styles.red
            }`}
          />
          <span className={styles.statusText}>{status}</span>
        </div>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={styles.video}
        />

        <p className={styles.notice}>
          ⚠ This session is monitored. Do not leave the screen or switch tabs.
        </p>
      </div>
    </section>
  );
}
