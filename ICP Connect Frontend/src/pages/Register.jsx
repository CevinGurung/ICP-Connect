import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi, sendOtp } from "../services/authService.js";
import { setTokens } from "../auth/auth.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phoneNumber: "",
    password: "",
    otp: "",
  });

  const [step, setStep] = useState(1); // 1: Info, 2: OTP
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

  const validateEmail = (email) => {
    return email.endsWith("@icp.edu.np");
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErr("");
    setSuccess("");
    
    if (!validateEmail(form.email)) {
      setErr("Email must be an @icp.edu.np domain");
      return;
    }

    setLoading(true);
    try {
      await sendOtp(form.email);
      setSuccess("OTP sent to your email!");
      setStep(2);
      setResendTimer(30);
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to send OTP";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

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
        "Registration failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container">
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1 className="title">Create account</h1>
          <p className="muted" style={{ fontSize: '14px' }}>Join the ICP Connect community.</p>

          {err ? <div className="alert alert-error">{err}</div> : null}
          {success ? <div className="alert alert-success">{success}</div> : null}

          {step === 1 ? (
            <form className="form" onSubmit={handleRequestOtp}>
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
                  value={form.email}
                  onChange={onChange}
                  placeholder="name@icp.edu.np"
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
                  value={form.password}
                  onChange={onChange}
                  placeholder="Min 6+ characters"
                  required
                />
              </label>

              <button className="btn btn-primary" disabled={loading} type="submit" style={{ marginTop: '8px' }}>
                {loading ? "Sending OTP..." : "Get OTP"}
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <div style={{ padding: '8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p>We've sent a 6-digit code to <strong>{form.email}</strong></p>
                <button 
                  type="button" 
                  className="link-btn" 
                  onClick={() => setStep(1)}
                  style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px' }}
                >
                  Change Email?
                </button>
              </div>

              <label className="field" style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', marginBottom: '8px' }}>6-Digit OTP</span>
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
                {loading ? "Verifying..." : "Register"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resendTimer > 0 || loading}
                  onClick={() => handleRequestOtp()}
                  style={{ width: '100%' }}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          <p className="muted small" style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>Login</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
