import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "../services/authService.js";
import { setTokens } from "../auth/auth.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await registerApi(form);
      setTokens(data.accessToken, data.refreshToken);
      navigate("/", { replace: true });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        "Registration failed";
      setErr(typeof msg === "string" ? msg : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container">
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1 className="title">Create account</h1>
          <p className="muted">Simple, clean, and consistent.</p>

          {err ? <div className="alert">{err}</div> : null}

          <form className="form" onSubmit={onSubmit}>
            <label className="field">
              <span>Username</span>
              <input
                name="userName"
                value={form.userName}
                onChange={onChange}
                placeholder="Cevin Gurung"
                required
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="field">
              <span>Phone Number</span>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={onChange}
                placeholder="98xxxxxxxx"
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={onChange}
                placeholder="Min 6+ recommended"
                required
              />
            </label>

            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="muted small">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
