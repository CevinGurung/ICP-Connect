import React, { useState } from "react";
import { X, Heart, Landmark, MessageSquare, Send } from "lucide-react";
import { initiateDonation } from "../services/donationService";
import { useNotification } from "../App";

export default function DonationModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useNotification();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const donorAmount = parseInt(amount);
    
    if (isNaN(donorAmount) || donorAmount <= 0) {
      showToast("error", "Please enter a valid positive integer amount.");
      return;
    }

    setLoading(true);
    try {
      const data = await initiateDonation(donorAmount, message);
      
      // Create a hidden form and submit it to eSewa
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", data.esewaUrl);

      const fields = {
        amount: data.amount,
        tax_amount: data.taxAmount,
        total_amount: data.totalAmount,
        transaction_uuid: data.transactionUuid,
        product_code: data.productCode,
        product_service_charge: data.productServiceCharge,
        product_delivery_charge: data.productDeliveryCharge,
        success_url: data.successUrl,
        failure_url: data.failureUrl,
        signed_field_names: data.signedFieldNames,
        signature: data.signature
      };

      for (const key in fields) {
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", key);
        input.setAttribute("value", fields[key]);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      showToast("error", "Failed to initiate donation. Try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content donation-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-icon">
            <Heart size={24} color="var(--primary)" fill="var(--primary)" />
          </div>
          <h3>Support the Developer</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="donation-form">
          <p className="form-info">Your support helps us keep ICP Connect alive and improving! ❤️</p>

          <div className="input-group">
            <label><Landmark size={18} /> Amount (Rs.)</label>
            <input 
              type="number" 
              placeholder="e.g. 500" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="1"
            />
          </div>

          <div className="input-group">
            <label><MessageSquare size={18} /> Message (Optional)</label>
            <textarea 
              placeholder="Leave a word for the developer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="form-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-pay" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
              ) : (
                <><Send size={18} /> Pay with eSewa</>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .donation-modal {
          max-width: 450px;
          padding: 24px;
        }
        .header-icon {
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }
        .form-info {
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 24px;
        }
        .donation-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 600;
        }
        .input-group input, .input-group textarea {
          background: #38434F;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }
        .input-group input:focus, .input-group textarea:focus {
          border-color: var(--primary);
        }
        .input-group textarea {
          height: 100px;
          resize: none;
        }
        .form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }
        .btn-pay {
          background: #25a072; /* eSewa Green */
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-pay:hover {
          background: #1e855d;
        }
      `}</style>
    </div>
  );
}
