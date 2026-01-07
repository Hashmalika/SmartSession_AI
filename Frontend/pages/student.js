import StudentCamera from "../components/StudentCamera";
import styles from "./styles/Student.module.css";

export default function StudentPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.header}>Student Portal</h1>
      <StudentCamera />
    </main>
  );
}
