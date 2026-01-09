import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Sidebar from "../../components/Sidebar";
import styles from "../styles/teacher/dashboard.module.css";
import { api } from "../../api";

// Dummy sessions (replace with real API later)
const dummySessions = [
  {
    id: 1,
    name: "AI & ML Class",
    live: false,
    timingStatus: "On Time",
    announcement: "Live monitoring will start at 2:00 PM.",
  },
];

export default function TeacherOverview() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const res = await api("/me");
      if (!res.ok) return router.push("/login");

      const data = await res.json();
      if (data.role !== "teacher") return router.push("/login");

      setUser(data);

      // TODO: replace with real API
      setSessions(dummySessions);
    }

    init();
  }, []);

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Teacher Dashboard | SmartSession</title>
      </Head>

      <div className={styles.layout}>
        <Sidebar role="teacher" />

        <main className={styles.main}>
          <header className={styles.header}>
            <h1>
              Welcome <span>{user.name}</span>
            </h1>
            <span className={styles.subtext}>Teacher Dashboard</span>
          </header>

          <section className={styles.sessionSection}>
            <div className={styles.grid}>
              {sessions.map((s) => (
                <div key={s.id} className={styles.cardItem}>
                  <h3>{s.name}</h3>

                  {s.announcement && (
                    <div className={styles.announcementCard}>
                      {s.announcement}
                    </div>
                  )}

                  <button
                    className={styles.primaryBtn}
                    onClick={() => router.push("/teacher/session")}
                  >
                    Go to Live Session
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
