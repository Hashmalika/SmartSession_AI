// import { useState } from "react";
// import { useRouter } from "next/router";
// import { api } from "../api";
// import styles from "./styles/Login.module.css"; // Reusing same CSS

// export default function Register() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const router = useRouter();

//     async function handleRegister(e) {
//     e.preventDefault();

//     try {
//         // Register
//         const res = await api("/register", {
//         method: "POST",
//         body: JSON.stringify({ name, email, password,role: "student"}),
//         headers: { "Content-Type": "application/json" },
//         });

//         if (!res.ok) {
//         const errorData = await res.json();
//         alert(errorData.message || "Registration failed");
//         return;
//         }

//         // Log in immediately
//         const loginRes = await api("/login", {
//         method: "POST",
//         body: JSON.stringify({ email, password }), // use JSON instead of URLSearchParams
//         headers: { "Content-Type": "application/json" },
//         });

//         if (!loginRes.ok) {
//         const loginError = await loginRes.json();
//         alert(loginError.message || "Login after registration failed");
//         return;
//         }

//         // Get user info
//         const userRes = await api("/me");
//         if (!userRes.ok) {
//         alert("Failed to fetch user info");
//         return;
//         }

//         const user = await userRes.json();

//         // Redirect based on role
//         if (user.role === "student") router.push("/student");
//         else router.push("/teacher");
//     } catch (err) {
//         console.error("Register error:", err);
//         alert("Something went wrong. Please try again.");
//     }
//     }


//   return (
//     <div className={styles.container}>
//       <form className={styles.card} onSubmit={handleRegister}>
//         <div className={styles.title}>Create Account</div>

//         <div className={styles.inputGroup}>
//           <label className={styles.label}>Name</label>
//           <input
//             className={styles.input}
//             placeholder="Enter your full name"
//             onChange={(e) => setName(e.target.value)}
//           />
//         </div>

//         <div className={styles.inputGroup}>
//           <label className={styles.label}>Email</label>
//           <input
//             className={styles.input}
//             placeholder="Enter your email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//         </div>

//         <div className={styles.inputGroup}>
//           <label className={styles.label}>Password</label>
//           <input
//             className={styles.input}
//             type="password"
//             placeholder="Enter your password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>

//         <button className={styles.button} type="submit">
//           Register
//         </button>

//         <div className={styles.footer}>
//           AI Proctoring System • Secure Access
//            <br/>
//            <span style={{ cursor: "pointer", color: "blue" }} onClick={() => router.push("/login")}>
//               Already have an account? Login
//           </span>
//        </div>

//       </form>
//     </div>
//   );
// }

import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../api";
import styles from "./styles/Login.module.css"; // reusing same CSS

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // default role
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Register user
      const res = await api("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.detail || errorData.message || "Registration failed");
        setLoading(false);
        return;
      }

      // 2️⃣ Auto-login after registration
      const loginRes = await api("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email, // must match FastAPI login "username"
          password: password,
        }),
      });

      if (!loginRes.ok) {
        const loginError = await loginRes.json();
        alert(loginError.detail || loginError.message || "Login after registration failed");
        setLoading(false);
        return;
      }

      // 3️⃣ Fetch user info
      const userRes = await api("/me");
      if (!userRes.ok) {
        alert("Failed to fetch user info");
        setLoading(false);
        return;
      }

      const user = await userRes.json();

      // 4️⃣ Redirect based on role
      if (user.role === "student") router.push("/student");
      else router.push("/teacher");

    } catch (err) {
      console.error("Register error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleRegister}>
        <div className={styles.title}>Create Account</div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Role</label>
          <select
            className={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Register"}
        </button>

        <div className={styles.footer}>
          AI Proctoring System • Secure Access
          <br />
          <span
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => router.push("/login")}
          >
            Already have an account? Login
          </span>
        </div>
      </form>
    </div>
  );
}
