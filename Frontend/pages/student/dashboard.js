// student/dashboard.js
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import StatusCard from "../../components/StatusCard";
import NotificationList from "../../components/NotificationList";
import styles from "../styles/student/dashboard.module.css";
import { api } from "../../api";

// Dummy session data for demonstration, now with 'announcement' property
const dummySessions = [
  {
    id: 1,
    name: "Math Exam",
    teacherName: "Mr. Smith",
    live: false,
    timingStatus: "On Time",
    status: "Not Started",
    announcement: "Calculator not allowed. Exam will begin at 3:00 PM — arrive early to check your equipment.",
  },
  {
    id: 2,
    name: "Science Assessment",
    teacherName: "Ms. Johnson",
    live: false,
    timingStatus: "Late",
    status: "Not Started",
    announcement: "Assessment rescheduled to tomorrow, same time. Please review the provided study material.",
  },
];

function getSessionButtonProps({ live, status, timingStatus, cameraStatus }) {
  // If session live
  if (live) {
    if (cameraStatus !== "ON") {
      return {
        label: "Enable Camera to Join",
        disabled: true,
      };
    }
    return {
      label: "Go to Live Session",
      disabled: false,
    };
  }
  // If not live
  if (status === "Not Started" || status === undefined) {
    return {
      label: "Not Started",
      disabled: true,
    };
  }
  // Add other logic if sessions have other states in future
  return {
    label: "Unavailable",
    disabled: true,
  };
}

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("OFF");
  const [notifications, setNotifications] = useState([]);
  const [sessions, setSessions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      // Fetch current user
      const res = await api("/me");
      if (!res.ok) return router.push("/login");

      const data = await res.json();
      if (data.role !== "student") return router.push("/login");
      setUser(data);

      // Check camera
      navigator.mediaDevices
        ?.getUserMedia({ video: true })
        .then(() => setCameraStatus("ON"))
        .catch(() => setCameraStatus("OFF"));

      // Professional notifications (replace with API on production)
      setNotifications([
        {
          id: 1,
          type: "info",
          message: "Your next exam session will commence at <strong>3:00 PM</strong>. Please be prepared to join on time."
        },
        {
          id: 2,
          type: "warning",
          message: "For a smooth session experience, ensure you have a stable internet connection and your camera is functioning properly."
        }
      ]);

      // TODO: replace with real API
      setSessions(dummySessions);
    }

    init();
  }, []);

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Student Dashboard | SmartSession</title>
      </Head>

      <div className={styles.layout}>
        <Sidebar role="student" />

        <main className={styles.main}>
          {/* HEADER */}
          <header className={styles.header}>
            <h1 style={{ marginBottom: "0.2em" }}>
              Welcome
              {user.name ? <> <span>{user.name}</span></> : null}
            </h1>
            <span className={styles.subtext}>Student Dashboard</span>
          </header>

          {/* Notification Section */}
          <section
            className={styles.notificationTop}
            style={{ marginBottom: "28px" }}
            aria-label="Notifications"
          >
            <NotificationList
              notifications={notifications.map(n => ({
                ...n,
                message: (
                  <span
                    dangerouslySetInnerHTML={{ __html: n.message }}
                  />
                ),
              }))}
            />
          </section>

          {/* Main grid: session cards */}
          <div
            className={styles.mainGridRow}
          >
            {/* Session Status Cards */}
            <section className={styles.sessionSection}>
              <div className={styles.grid}>
                {sessions.map((session) => (
                  <div key={session.id} className={styles.cardItem}>
                    <StatusCard
                      cameraStatus={cameraStatus}
                      teacherName={session.teacherName}
                      session={session.name}
                      live={session.live}
                      timingStatus={session.timingStatus}
                    />
                    {/* Announcement below session info */}
                    {session.announcement && (
                      <div className={styles.announcementCard}>
                        {session.announcement}
                      </div>
                    )}
                    <button
                      className={styles.primaryBtn}
                      onClick={() => router.push("/student/session")}
                    >
                      Go to Live Session
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
