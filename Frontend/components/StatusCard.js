import styles from "./styles/StatusCard.module.css";

export default function StatusCard({
  cameraStatus,
  session,
  teacherName,
  live,
  timingStatus // New prop for timing status
}) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Session Status</h3>

      <div className={styles.row}>
        <span>Camera</span>
        <span
          className={`${styles.badge} ${
            cameraStatus === "ON" ? styles.green : styles.red
          }`}
        >
          {cameraStatus}
        </span>
      </div>

      <div className={styles.row}>
        <span>Teacher</span>
        <span>{teacherName}</span>
      </div>

      <div className={styles.row}>
        <span>Session</span>
        <span
          className={`${styles.badge} ${
            live ? styles.green : styles.gray
          }`}
        >
          {live ? "LIVE" : "Not Started"}
        </span>
      </div>

      <div className={styles.row}>
        <span>Timing</span>
        <span
          className={`${styles.badge} ${
            timingStatus === "On Time"
              ? styles.green
              : timingStatus === "Late"
              ? styles.red
              : styles.gray
          }`}
        >
          {timingStatus || "Unknown"}
        </span>
      </div>
    </div>
  );
}
