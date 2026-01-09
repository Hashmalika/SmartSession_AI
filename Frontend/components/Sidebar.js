import Link from "next/link";
import styles from "./styles/Sidebar.module.css";

export default function Sidebar({ role }) {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Dashboard</h2>

      <nav className={styles.nav}>
        {/* STUDENT MENU */}
        {role === "student" && (
          <>
            <Link href="/student/dashboard" className={styles.link}>
              Overview
            </Link>

            <Link href="/student/profile" className={styles.link}>
              Profile
            </Link>
          </>
        )}

        {/* TEACHER MENU */}
        {role === "teacher" && (
          <>
            <Link href="/teacher/dashboard" className={styles.link}>
              Overview
            </Link>

            <Link href="/teacher/profile" className={styles.link}>
              Profile
            </Link>
          </>
        )}

        {/* LOGOUT */}
        <Link href="/login" className={styles.logout}>
          Logout
        </Link>
      </nav>
    </aside>
  );
}
