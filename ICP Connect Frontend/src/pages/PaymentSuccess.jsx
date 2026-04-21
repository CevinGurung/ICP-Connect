import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Heart, Home, ArrowRight } from "lucide-react";
import { confirmDonation } from "../services/donationService";
import { useNotification } from "../context/NotificationContext.jsx";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      const dataParam = searchParams.get("data");
      if (!dataParam) {
        showToast("error", "Invalid payment data received.");
        navigate("/");
        return;
      }

      try {
        // eSewa v2 returns a base64 encoded JSON string
        const decodedString = atob(dataParam);
        const paymentData = JSON.parse(decodedString);
        setDetails(paymentData);

        // Confirm with our backend
        await confirmDonation(paymentData.transaction_uuid);
        
        setLoading(false);
        // Show the special thank you modal after a brief delay
        setTimeout(() => setShowThankYou(true), 800);
      } catch (err) {
        console.error("Payment confirmation failed:", err);
        showToast("error", "Failed to verify transaction. Please contact support.");
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, navigate, showToast]);

  return (
    <div className="payment-result-page container">
      <div className="result-card glass fade-in">
        <div className="status-icon success-animation">
          <CheckCircle size={80} color="#25a072" />
        </div>
        
        <h1>Payment Successful!</h1>
        <p className="subtitle">Thank you for your generous support. Your contribution makes a real difference!</p>

        {details && (
          <div className="payment-details">
            <div className="detail-row">
              <span>Amount Paid</span>
              <span className="amount">Rs. {details.total_amount}</span>
            </div>
            <div className="detail-row">
              <span>Transaction ID</span>
              <span className="mono">{details.transaction_code}</span>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            <Home size={18} /> Back to Home
          </Link>
        </div>
      </div>

      {/* Developer Thank You Modal */}
      {showThankYou && (
        <div className="thank-you-overlay">
          <div className="thank-you-modal glass pop-in">
            <div className="developer-avatar">
              <Heart size={40} fill="var(--primary)" color="var(--primary)" />
            </div>
            <h2>A Message from the Developer</h2>
            <div className="message-content">
              <p>Dear Supporter,</p>
              <p>I am truly grateful for your support! Your contribution of <strong>Rs. {details?.total_amount}</strong> helps me maintain and improve ICP Connect for everyone.</p>
              <p>It means the world to see students like you giving back to the community.</p>
              <p className="signature">- The Developer</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowThankYou(false)}>
              You're Welcome! <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .payment-result-page {
          height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .result-card {
          max-width: 500px;
          width: 100%;
          padding: 48px;
          text-align: center;
          border-radius: 20px;
          border: 1px solid var(--border);
        }
        .status-icon { margin-bottom: 24px; display: flex; justify-content: center; }
        .result-card h1 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
        .subtitle { color: var(--text-secondary); margin-bottom: 32px; }
        
        .payment-details {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 32px;
          text-align: left;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .detail-row:last-child { margin-bottom: 0; }
        .amount { color: #25a072; font-weight: 800; font-size: 18px; }
        .mono { font-family: monospace; color: var(--text-muted); }

        .action-buttons { display: flex; gap: 16px; justify-content: center; }

        .thank-you-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(8px);
        }
        .thank-you-modal {
          max-width: 450px;
          padding: 40px;
          text-align: center;
          border-radius: 24px;
          border: 1px solid var(--primary);
          box-shadow: 0 0 40px rgba(88, 166, 255, 0.2);
        }
        .developer-avatar { margin-bottom: 24px; animation: heartbeat 1.5s infinite; }
        @keyframes heartbeat {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .message-content {
          text-align: left;
          line-height: 1.6;
          color: var(--text-primary);
          margin-bottom: 32px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }
        .signature {
          margin-top: 20px;
          font-weight: 700;
          color: var(--primary);
          font-style: italic;
        }

        .success-animation {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
