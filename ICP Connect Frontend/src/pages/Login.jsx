import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../services/authService.js";
import { setTokens } from "../auth/auth.js";
import { useNotification } from "../App.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
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

  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!form.email.trim().endsWith("@icp.edu.np")) {
      showToast("error", "Only @icp.edu.np emails are allowed");
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(form);
      
      if (data.otpRequired) {
        setStep(2);
        showToast("success", "Secure OTP sent to your email.");
        setResendTimer(30);
      } else {
        setTokens(data.accessToken, data.refreshToken);
        navigate("/", { replace: true });
      }
    } catch (error) {
      let msg = "Login failed";
      const status = error?.response?.status;
      const errorMsg = error?.response?.data?.message || "";

      if (status === 404 || errorMsg.toLowerCase().includes("not found")) {
        msg = "Account not found. Please register first.";
      } else if (status === 401 || errorMsg.toLowerCase().includes("credentials")) {
        msg = "Invalid email or password";
      } else if (errorMsg) {
        msg = errorMsg;
      }
      
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setForm(prev => ({ ...prev, otp: "" }));
    // Small timeout to ensure state is updated before submission
    setTimeout(() => onSubmit(), 0);
  };

  return (
    <section className="container">
      <div className="auth-wrap">
        <div className="card auth-card">
          <h1 className="title">{step === 1 ? "Welcome back" : "Verify identity"}</h1>
          <p className="muted" style={{ fontSize: '14px' }}>
            {step === 1 ? "Login to access your account." : `We've sent a code to ${form.email}`}
          </p>

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
                <div className="password-wrap">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                    placeholder="••••••••"
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

              <button className="btn btn-primary" disabled={loading} type="submit" style={{ marginTop: '8px' }}>
                {loading ? "Verifying..." : "Continue"}
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <label className="field" style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', marginBottom: '8px' }}>Enter 6-digit OTP</span>
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
