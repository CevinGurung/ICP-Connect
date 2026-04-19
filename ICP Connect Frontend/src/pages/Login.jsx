import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../services/authService.js";
import { setTokens } from "../auth/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    setErr("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await loginApi(form);
      
      if (data.otpRequired) {
        setStep(2);
        setSuccess("Secure OTP sent to your email.");
        setResendTimer(30);
      } else {
        setTokens(data.accessToken, data.refreshToken);
        navigate("/", { replace: true });
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Login failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    onSubmit(); // Re-submit credentials to trigger new OTP
  };

  return (
    <section className="container">
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1 className="title">{step === 1 ? "Welcome back" : "Verify identity"}</h1>
          <p className="muted" style={{ fontSize: '14px' }}>
            {step === 1 ? "Login to access your account." : `We've sent a code to ${form.email}`}
          </p>

          {err ? <div className="alert alert-error">{err}</div> : null}
          {success ? <div className="alert alert-success">{success}</div> : null}

          {step === 1 ? (
            <form className="form" onSubmit={onSubmit}>
              <label className="field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="name@icp.edu.np"
                  required
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  required
                />
              </label>

              <button className="btn btn-primary" disabled={loading} type="submit" style={{ marginTop: '8px' }}>
                {loading ? "Verifying..." : "Continue"}
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <label className="field" style={{ textAlign: 'center' }}>
                <span style={{ dispaly: 'block', marginBottom: '8px' }}>Enter 6-digit OTP</span>
                <input
                  name="otp"
                  value={form.otp}
                  onChange={onChange}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  style={{ textAlign: 'center', letterSpacing: '8.5px', fontSize: '1.6rem', fontWeight: 'bold' }}
                />
              </label>

              <button className="btn btn-primary" disabled={loading} type="submit" style={{ marginTop: '8px' }}>
                {loading ? "Authenticating..." : "Login"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleResend}
                  style={{ width: '100%' }}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend OTP"}
                </button>
                
                <button 
                  type="button" 
                  className="link-btn" 
                  onClick={() => setStep(1)}
                  style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

          <p className="muted small" style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            Don’t have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '500' }}>Create one</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
