
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Sidebar from "../components/Sidebar";
import styles from "./styles/ReportPage.module.css"; // added import for ReportPage.module.css

// Chart.js setup
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportPage() {
  const router = useRouter();
  const { student_id, report } = router.query;
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (!report) return;
    try {
      setReportData(JSON.parse(report));
    } catch (err) {
      console.error("Failed to parse report JSON:", err);
    }
  }, [report]);

  if (!reportData)
    return (
      <div className={styles.layout}>
        <Sidebar role="teacher" />
        <main className={styles.main}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "70vh",
              fontSize: 24,
              color: "#475569",
            }}
          >
            Loading report...
          </div>
        </main>
      </div>
    );

  // Safe extraction
  const student = reportData.student || {};
  const summary = reportData.summary || {};
  const timeline = Array.isArray(reportData.timeline) ? reportData.timeline : [];

  const studentName = student.name || `Student ${student_id}`;

  const confused_pct = Number(summary.confused_pct ?? 0);
  const focused_pct = Number(summary.focused_pct ?? 0);
  const happy_pct = Number(summary.happy_pct ?? 0);

  // Chart labels and data
  const labels = timeline.map((t) =>
    t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "?"
  );

  const confusionData = timeline.map((t) =>
    typeof t.smoothed_confusion === "number" ? t.smoothed_confusion : 0
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Confusion",
        data: confusionData,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
        fill: true,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.16)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#111827",
          font: { size: 15 },
          boxHeight: 32,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 1,
        ticks: { color: "#1e293b", stepSize: 0.2 },
        grid: { color: "#e5e7eb" },
      },
      x: {
        ticks: { color: "#1e293b" },
        grid: { color: "rgba(229,231,235,0.14)" },
      },
    },
  };

  return (
    <div className={styles.layout}>
      <Sidebar role="teacher" />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>
            Student Report <span style={{ color: "#1d4ed8" }}>{studentName}</span>
          </h1>
          <span className={styles.subtext}>Session Engagement & Confusion Timeline</span>
        </header>

        <div className={styles.grid} style={{ marginBottom: 34, gridTemplateColumns: "1fr" }}>
          {/* Card: Report Summary */}
          <div className={styles.cardItem} >
            <h3 style={{ fontWeight: 700, fontSize: "1.32rem", marginBottom: 13, color: "#0f172a" }}>
              Summary
            </h3>
            <ul className={styles.summaryList}>
              <li className={styles.summaryItem}>
                <span className={styles.summarySwatch} />
                Confused{" "}
                <span className={`${styles.summaryPct} ${styles.confused}`}>
                  {confused_pct}%
                </span>
              </li>
              <li className={styles.summaryItem}>
                <span className={`${styles.summarySwatch} ${styles.focused}`} />
                Focused{" "}
                <span className={`${styles.summaryPct} ${styles.focused}`}>
                  {focused_pct}%
                </span>
              </li>
              <li className={styles.summaryItem}>
                <span className={`${styles.summarySwatch} ${styles.happy}`} />
                Happy{" "}
                <span className={`${styles.summaryPct} ${styles.happy}`}>
                  {happy_pct}%
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card: Confusion Timeline Chart */}
        <div className={styles.cardItem + " " + styles.confusionChartBox}>
          <div className={styles.confusionChartTitle}>
            Confusion Over Time
          </div>
          <div className={styles.confusionChartCanvas}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </main>
    </div>
  );
}

