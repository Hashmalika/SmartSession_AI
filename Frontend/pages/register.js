import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../api";
import styles from "./styles/Register.module.css"; // use the new CSS

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // empty for placeholder
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);


  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Register
      const res = await api("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || errData.message || "Registration failed");
        return;
      }

      // 2️⃣ Auto-login
      const loginRes = await api("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });

      if (!loginRes.ok) {
        const loginError = await loginRes.json();
        setError(loginError.detail || loginError.message || "Login failed");
        return;
      }

      // 3️⃣ Fetch user info
      const userRes = await api("/me");
      if (!userRes.ok) {
        setError("Failed to fetch user info");
        return;
      }

      const user = await userRes.json();

      // 4️⃣ Redirect
      user.role === "student" ? router.push("/student") : router.push("/teacher");

    } catch (err) {
      console.error("Register error:", err);
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
          <h2>Create Account</h2>
        </div>

        {/* FORM */}
        <form className={styles.loginForm} onSubmit={handleRegister}>

          {/* NAME */}
          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                 placeholder="" 
                autoComplete="off"
              />
              <label>Full Name</label>
              <span className={styles.inputLine}></span>
            </div>
          </div>

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

         {/* ROLE */}
          {/* <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="" disabled hidden></option> 
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <label>Role</label>
              <span className={styles.inputLine}></span>
            </div>
          </div> */}
          {/* ROLE */}
          <div className={styles.formGroup}>
            <div
              className={`${styles.customSelect} ${roleOpen ? styles.open : ""}`}
              tabIndex={0}
              onClick={() => setRoleOpen(!roleOpen)}
              onBlur={() => setRoleOpen(false)}
            >
              <div className={styles.selectTrigger}>
                <span className={styles.selectedValue}>
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : ""}
                </span>
                <span className={styles.arrow}>▾</span>
              </div>

              <label className={role ? styles.filled : ""}>Role</label>

              {roleOpen && (
                <div className={styles.options}>
                  <div
                    className={`${styles.option} ${role === "student" ? styles.selected : ""}`}
                    onMouseDown={() => setRole("student")}
                  >
                    Student
                  </div>
                  <div
                    className={`${styles.option} ${role === "teacher" ? styles.selected : ""}`}
                    onMouseDown={() => setRole("teacher")}
                  >
                    Teacher
                  </div>
                </div>
              )}

              <span className={styles.inputLine}></span>
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
            {loading ? "Registering..." : "REGISTER"}
          </button>
        </form>

        {/* FOOTER */}
        <div className={styles.footer}>
          <p>Already have an account?</p>
          <span onClick={() => router.push("/login")}>Login</span>
        </div>
      </div>
    </div>
  );
}
