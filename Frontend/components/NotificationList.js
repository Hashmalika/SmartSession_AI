import styles from "./styles/NotificationList.module.css";

export default function NotificationList({ notifications = [] }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Notifications</h3>

      {notifications.length === 0 && (
        <p className={styles.empty}>No notifications</p>
      )}

      <ul className={styles.list}>
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`${styles.item} ${styles[n.type]}`}
          >
            {n.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
