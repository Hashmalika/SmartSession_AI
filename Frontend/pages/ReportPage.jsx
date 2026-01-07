
// // pages/ReportPage.jsx
// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import dynamic from "next/dynamic";
// import { api } from "../api";
// import styles from "./styles/ReportPage.module.css";

// // ✅ Dynamic import fixes Next.js + Chart.js SSR crash
// const Line = dynamic(() => import("react-chartjs-2").then(m => m.Line), {
//   ssr: false,
// });

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// export default function ReportPage() {
//   const router = useRouter();
//   const { student_id } = router.query;

//   const [reportData, setReportData] = useState(null);

//   useEffect(() => {
//     if (!student_id) return;

//     async function fetchReport() {
//       try {
//         const res = await api(`/report/student/${student_id}`);
//         const data = await res.json();
//         setReportData(data);
//       } catch (err) {
//         console.error("Report fetch failed:", err);
//       }
//     }

//     fetchReport();
//   }, [student_id]);

//   if (!reportData) return <div>Loading...</div>;

//   // ✅ Safe extract
//   const student = reportData.student || {};
//   const summary = reportData.summary || {};
//   const timeline = Array.isArray(reportData.timeline) ? reportData.timeline : [];

//   const studentName = String(student.name || `Student ${student_id}`);

//   const confused_pct = Number(summary.confused_pct ?? 0);
//   const focused_pct = Number(summary.focused_pct ?? 0);
//   const happy_pct = Number(summary.happy_pct ?? 0);

//   const labels = timeline.map(t =>
//     t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "?"
//   );

//   const confusionData = timeline.map(t =>
//     typeof t.smoothed_confusion === "number" ? t.smoothed_confusion : 0
//   );

//   const chartData = {
//     labels,
//     datasets: [
//       {
//         label: "Confusion",
//         data: confusionData,
//         tension: 0.3,
//         borderWidth: 2,
//         pointRadius: 2,
//       },
//     ],
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     scales: {
//       y: { min: 0, max: 1 },
//     },
//   };

//   return (
//     <div className={styles.page}>
//       <h1>Student Report: {studentName}</h1>

//       <div className={styles.summary}>
//         <ul>
//           <li>Confused: {confused_pct}%</li>
//           <li>Focused: {focused_pct}%</li>
//           <li>Happy: {happy_pct}%</li>
//         </ul>
//       </div>

//       <div className={styles.chart}>
//         <Line data={chartData} options={chartOptions} />
//       </div>
//     </div>
//   );
// }


// pages/ReportPage.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import styles from "./styles/ReportPage.module.css";

// ✅ Dynamic import to fix Next.js + Chart.js SSR issues
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

  // ✅ Use report from query if available
  useEffect(() => {
    if (!report) return;

    try {
      setReportData(JSON.parse(report));
    } catch (err) {
      console.error("Failed to parse report JSON:", err);
    }
  }, [report]);

  if (!reportData) return <div>Loading report...</div>;

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
        borderColor: "#f59e0b", // orange line
        backgroundColor: "rgba(245,158,11,0.2)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 1 },
    },
  };

  return (
    <div className={styles.page}>
      <h1>Student Report: {studentName}</h1>

      <div className={styles.summary}>
        <ul>
          <li>Confused: {confused_pct}%</li>
          <li>Focused: {focused_pct}%</li>
          <li>Happy: {happy_pct}%</li>
        </ul>
      </div>

      <div className={styles.chart}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
