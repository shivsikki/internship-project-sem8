import React, { useState } from 'react';
import axios from 'axios';
import './Payments.css';

const PaymentButton = ({ amount, appointmentId, description, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => {
        setError('Failed to load Razorpay. Please refresh the page.');
        resolve(null);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Load Razorpay script
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        setLoading(false);
        return;
      }

      // Create order on backend
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/payments/create-order',
        {
          amount: amount * 100, // Convert to paise
          appointmentId,
          description
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create order');
      }

      const { orderId, keyId } = response.data;

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'Hospital Management System',
        description: description || 'Payment for appointment',
        order_id: orderId,
        handler: async function (response) {
          // Verify payment on backend
          try {
            const verifyResponse = await axios.post(
              '/api/payments/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount,
                appointmentId,
                paymentType: 'appointment',
                paymentMethod: 'online'
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (verifyResponse.data.success) {
              alert('Payment successful!');
              if (onSuccess) onSuccess();
            } else {
              alert('Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : '',
          email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : ''
        },
        theme: {
          color: '#4a5568'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="payment-button-container">
      {error && <div className="error-message">{error}</div>}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="razorpay-button"
      >
        {loading ? 'Processing...' : `Pay ₹${amount}`}
      </button>
    </div>
  );
};

export default PaymentButton;

