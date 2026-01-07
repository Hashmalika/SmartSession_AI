
import { api } from "../api"; // <- make sure this exists
import dynamic from "next/dynamic";
import styles from "./styles/Teacher.module.css";

const TeacherDashboard = dynamic(() => import("../components/TeacherDashboard"), { ssr: false });

export default function TeacherPage() {
  return (
    <main className={styles.page}>
      <TeacherDashboard />
    </main>
  );
}
