import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import styles from "./styles/Login.module.css";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email,
          password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Login failed");
        return;
      }

      const userRes = await api("/me");
      const user = await userRes.json();

      user.role === "student"
        ? router.push("/student/dashboard")
        : router.push("/teacher/dashboard");

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>

        {/* SVG LOGO */}
        <div className={styles.svgContainer}>
          <img 
            src="/smartsession.svg" 
            alt="SmartSession Logo" 
            className={styles.logoImage}
          />
        </div>

        {/* HEADER */}
        <div className={styles.loginHeader}>
          <h2>Sign in</h2>
        </div>

        {/* FORM */}
        <form className={styles.loginForm} onSubmit={handleSubmit}>

          {/* EMAIL */}
          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="" 
                autoComplete="off"
              />
              <label>Email</label>
              <span className={styles.inputLine}></span>
            </div>
          </div>

          {/* PASSWORD */}
          <div className={styles.formGroup}>
            <div className={`${styles.inputWrapper} ${styles.passwordWrapper}`}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 72))}
                 placeholder="" 
                autoComplete="new-password"

              />
              <label>Password</label>
              <span className={styles.inputLine}></span>

              {password && (
                <span
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              )}
            </div>
          </div>

          {/* ERROR */}
          {error && <p className={styles.error}>{error}</p>}

          {/* BUTTON */}
          <button
            type="submit"
            className={`${styles.loginBtn} ${loading ? styles.loading : ""}`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>

        {/* FOOTER */}
        <div className={styles.footer}>
          <p> Don't have an account</p>
          <span onClick={() => router.push("/register")}>
            Register
          </span>
        </div>

      </div>
    </div>
  );
}
