
// // components/StudentCamera.js
// import styles from "./styles/StudentCamera.module.css";
// import { useEffect, useRef, useState } from "react";
// import { api } from "../api";

// export default function StudentCamera() {
//   const [status, setStatus] = useState("Connecting...");
//   const wsRef = useRef(null);
//   const intervalRef = useRef(null);
//   const reconnectTimeoutRef = useRef(null);
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     // SSR-safe canvas creation
//     canvasRef.current = document.createElement("canvas");

//     async function init() {
//       const res = await api("/me");
//       if (!res.ok) return (window.location = "/login");

//       const user = await res.json();
//       if (user.role !== "student") return (window.location = "/login");

//       // Setup webcam
//       if (navigator.mediaDevices) {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         if (videoRef.current) videoRef.current.srcObject = stream;
//       }

//       function connectWS() {
//         // Avoid multiple WS instances
//         if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

//         // Optional: include token if server requires authentication
//         // const wsUrl = `ws://localhost:8000/ws/student?token=${user.token}`;
//         const ws = new WebSocket("ws://localhost:8000/ws/student");
//         wsRef.current = ws;

//         ws.onopen = () => {
//           console.log("WebSocket connected");
//           setStatus("Live");

//           // Send handshake first
//           ws.send(JSON.stringify({ type: "init", student_id: user.user_id }));

//           // Delay 300ms before sending frames to let server process handshake
//           setTimeout(() => {
//             if (intervalRef.current) clearInterval(intervalRef.current);
//             intervalRef.current = setInterval(sendFrame, 500);
//           }, 300);
//         };

//         ws.onclose = (event) => {
//           console.log("WebSocket closed", event.code, event.reason);
//           setStatus("Reconnecting...");
//           if (intervalRef.current) clearInterval(intervalRef.current);

//           // Reconnect after 2 seconds
//           reconnectTimeoutRef.current = setTimeout(connectWS, 2000);
//         };

//         ws.onerror = (err) => {
//           console.error("WebSocket error", err);
//           ws.close(); // ensure onclose triggers
//         };
//       }

//       function sendFrame() {
//         if (
//           wsRef.current?.readyState === WebSocket.OPEN &&
//           videoRef.current?.videoWidth
//         ) {
//           const video = videoRef.current;
//           const canvas = canvasRef.current;
//           canvas.width = video.videoWidth;
//           canvas.height = video.videoHeight;
//           const ctx = canvas.getContext("2d");
//           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//           const frameBase64 = canvas.toDataURL("image/jpeg");

//           wsRef.current.send(
//             JSON.stringify({
//               student_id: user.user_id,
//               frame: frameBase64,
//               timestamp: Date.now(),
//             })
//           );
//         }
//       }

//       connectWS();
//     }

//     init();

//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
//       if (wsRef.current) wsRef.current.close();
//     };
//   }, []);

//   return (
//     <div className={styles.page}>
//       {/* Header */}
//       <div className={styles.header}>
//         <h1>SmartSession</h1>
//         <div className={styles.status}>
//           <span
//             className={`${styles.dot} ${
//               status === "Live" ? styles.green : styles.red
//             }`}
//           />
//           {status}
//         </div>
//       </div>

//       {/* Camera */}
//       <div className={styles.center}>
//         <div className={styles.cameraCard}>
//           <video autoPlay muted playsInline ref={videoRef} />
//           <p className={styles.notice}>
//             Your session is being monitored. Do not leave the screen.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

import styles from "./styles/StudentCamera.module.css";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";

export default function StudentCamera() {
  const [status, setStatus] = useState("Connecting...");
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    canvasRef.current = document.createElement("canvas");

    async function init() {
      const res = await api("/me");
      if (!res.ok) return (window.location = "/login");

      const user = await res.json();
      if (user.role !== "student") return (window.location = "/login");

      if (navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      }

      function connectWS() {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

        const ws = new WebSocket("ws://localhost:8000/ws/student");
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          setStatus("Live");

          ws.send(JSON.stringify({ type: "init", student_id: user.user_id }));

          setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(sendFrame, 500);
          }, 300);
        };

        ws.onclose = (event) => {
          console.log("⚠️ WebSocket closed", event.code, event.reason);
          setStatus("Reconnecting...");
          if (intervalRef.current) clearInterval(intervalRef.current);
          reconnectTimeoutRef.current = setTimeout(connectWS, 2000);
        };

        ws.onerror = (err) => {
          console.error("WebSocket error", err);
          ws.close();
        };
      }

      function sendFrame() {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        if (!videoRef.current?.videoWidth) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frameBase64 = canvas.toDataURL("image/jpeg");

        const telemetry = {
          student_id: user.user_id,
          frame: frameBase64,
          timestamp: Date.now(),
        };

        // --- LOG TELEMETRY ---
        console.log("📤 Sending telemetry:", telemetry);

        wsRef.current.send(JSON.stringify(telemetry));
      }

      connectWS();
    }

    init();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>SmartSession</h1>
        <div className={styles.status}>
          <span className={`${styles.dot} ${status === "Live" ? styles.green : styles.red}`} />
          {status}
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.cameraCard}>
          <video autoPlay muted playsInline ref={videoRef} />
          <p className={styles.notice}>
            Your session is being monitored. Do not leave the screen.
          </p>
        </div>
      </div>
    </div>
  );
}
