import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi, sendOtp } from "../services/authService.js";
import { setTokens } from "../auth/auth.js";
import { useNotification } from "../App.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
    program: "BIT",
    year: "1",
    section: "",
    otp: "",
  });

  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    
    const emailToUse = form.email.trim();
    if (!validateEmail(emailToUse)) {
      showToast("error", "Only @icp.edu.np emails are allowed");
      return;
    }

    if (form.password.length < 8) {
      showToast("error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await sendOtp(emailToUse);
      showToast("success", "OTP sent to your email!");
      setStep(2);
      setResendTimer(30);
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to send OTP";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const cleanedForm = { ...form, email: form.email.trim() };
    try {
      const data = await registerApi(cleanedForm);
      setTokens(data.accessToken, data.refreshToken);
      showToast("success", "Account created successfully! Logging you in...");
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Registration failed";
      showToast("error", msg);
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

          {step === 1 ? (
            <form className="form" onSubmit={handleRequestOtp}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                <label className="field">
                  <span>Full Name</span>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange}
                    placeholder="e.g. Cevin Gurung"
                    required
                  />
                </label>
                <label className="field">
                  <span>Username</span>
                  <input
                    name="userName"
                    value={form.userName}
                    onChange={onChange}
                    placeholder="cecil"
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>College Email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="name@icp.edu.np"
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                <label className="field">
                  <span>Program</span>
                  <select name="program" value={form.program} onChange={onChange} className="field-select">
                    <option value="BIT">BIT</option>
                    <option value="BBA">BBA</option>
                  </select>
                </label>
                <label className="field">
                  <span>Year</span>
                  <select name="year" value={form.year} onChange={onChange} className="field-select">
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                <label className="field">
                  <span>Section</span>
                  <input
                    name="section"
                    value={form.section}
                    onChange={onChange}
                    placeholder="e.g. C1, C2, C3"
                    required
                  />
                </label>
                <label className="field">
                  <span>Password</span>
                  <div className="password-wrap">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={onChange}
                      placeholder="••••••••"
                      minLength={8}
                      required
                    />
                    <button 
                      type="button" 
                      className="toggle-pass" 
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </label>
              </div>

              <button className="btn btn-primary" disabled={loading} type="submit" style={{ marginTop: '12px' }}>
                {loading ? "Sending OTP..." : "Get Verification Code"}
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
                  Edit details?
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
                {loading ? "Creating account..." : "Complete Registration"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resendTimer > 0 || loading}
                  onClick={(e) => handleRequestOtp(e)}
                  style={{ width: '100%', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer' }}
                >
                  {resendTimer > 0 ? `Wait ${resendTimer}s to resend` : "Resend OTP Code"}
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
