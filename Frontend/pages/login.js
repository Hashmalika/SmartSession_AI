// import { useState } from "react";
// import { useRouter } from "next/router";
// import { api } from "../api";
// import styles from "./styles/Login.module.css";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);

//   async function handleLogin(e) {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res =await api("/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: new URLSearchParams({
//         username: email,  // email from input
//         password: password // password from input
//       }),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         alert(err.detail || err.message || "Login failed");
//         setLoading(false);
//         return;
//       }

//       // Fetch user info
//       const userRes = await api("/me");
//       if (!userRes.ok) {
//         alert("Failed to fetch user info");
//         setLoading(false);
//         return;
//       }
       
//       const user = await userRes.json();

//       // Redirect based on role
//       if (user.role === "student") router.push("/student");
//       else router.push("/teacher");

//     }catch (err) {
//     console.error("Login error:", err);
//     alert("Something went wrong during login.");
//     setLoading(false);

//     }

//   }

//   return (
//   <div className={styles.container}>
//     <form className={styles.card} onSubmit={handleLogin}>
//       <div className={styles.title}>Secure Login</div>

//       <div className={styles.inputGroup}>
//         <label className={styles.label}>Email</label>
//         <input
//           className={styles.input}
//           placeholder="Enter your email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//       </div>

//       <div className={styles.inputGroup}>
//         <label className={styles.label}>Password</label>
//         <input
//           className={styles.input}
//           type="password"
//           placeholder="Enter your password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//       </div>

//       <button className={styles.button} type="submit" disabled={loading}>
//         {loading ? "Please wait..." : "Login"}
//       </button>


//       <div className={styles.footer}>
//         AI Proctoring System • Secure Access
//         <br />
//         <span style={{ cursor: "pointer", color: "blue" }} onClick={() => router.push("/register")}>
//           Don't have an account? Register
//         </span>
//       </div>

//     </form>
//   </div>
// );

// }


import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../api";
import styles from "./styles/Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Login request using Form data to match FastAPI
      const res = await api("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email, // must match backend username
          password: password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || err.message || "Login failed");
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch user info
      const userRes = await api("/me");
      if (!userRes.ok) {
        alert("Failed to fetch user info");
        setLoading(false);
        return;
      }

      const user = await userRes.json();

      // 3️⃣ Redirect based on role
      if (user.role === "student") router.push("/student");
      else router.push("/teacher");

    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong during login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleLogin}>
        <div className={styles.title}>Secure Login</div>

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
            onChange={(e) => setPassword(e.target.value.slice(0, 72))}
            required
          />
        </div>

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>

        <div className={styles.footer}>
          AI Proctoring System • Secure Access
          <br />
          <span
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => router.push("/register")}
          >
            Don't have an account? Register
          </span>
        </div>
      </form>
    </div>
  );
}
