import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../services/authService.js";
import { setTokens } from "../auth/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await loginApi(form);
      setTokens(data.accessToken, data.refreshToken);
      navigate("/", { replace: true });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data ||
        "Login failed";
      setErr(typeof msg === "string" ? msg : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container">
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1 className="title">Welcome back</h1>
          <p className="muted">Login to continue.</p>

          {err ? <div className="alert">{err}</div> : null}

          <form className="form" onSubmit={onSubmit}>
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
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={onChange}
                placeholder="••••••••"
                required
              />
            </label>

            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="muted small">
            Don’t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
