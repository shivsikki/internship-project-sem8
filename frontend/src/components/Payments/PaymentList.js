import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlitchText from '../GlitchText/GlitchText';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Payments.css';

const PaymentList = ({ userRole }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = sessionStorage.getItem('token');
      let endpoint = userRole === 'admin' ? '/api/payments/all' : '/api/payments/patient';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPayments(response.data.payments);
        if (response.data.totalRevenue) {
          setTotalRevenue(response.data.totalRevenue);
        }
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'refunded':
        return '#2196F3';
      case 'failed':
        return '#F44336';
      default:
        return '#666';
    }
  };

  if (loading) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="payments-list-container">
      <div className="payments-header">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="payments-header-content">
          <div className="payments-header-text">
            <p className="payments-hero-eyebrow">Billing & Receipts</p>
            <AnimatedHeading text="Payments" />
            <p className="payments-hero-subtitle">Track your payments and payment history in one place.</p>
          </div>
          {userRole === 'admin' && (
            <div className="revenue-card">
              <strong>Total Revenue:</strong>
              <span className="revenue-amount">${totalRevenue.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state-center">
          <GlitchText speed={1} enableShadows enableOnHover={false}>
            No Payments
          </GlitchText>
        </div>
      ) : (
        <div className="payments-grid">
          {payments.map((payment) => (
            <div key={payment._id} className="payment-card-item">
              <div className="payment-header">
                <div className="payment-status" style={{ backgroundColor: getStatusColor(payment.status) }}>
                  {payment.status.toUpperCase()}
                </div>
                <div className="payment-amount">
                  ${payment.amount.toFixed(2)}
                </div>
              </div>

              <div className="payment-body">
                <div className="payment-info">
                  <p><strong>Date:</strong> {formatDate(payment.createdAt)}</p>
                  <p><strong>Type:</strong> {payment.paymentType}</p>
                  <p><strong>Method:</strong> {payment.paymentMethod}</p>
                  {payment.appointment && (
                    <p><strong>Appointment:</strong> {new Date(payment.appointment.appointmentDate).toLocaleDateString()}</p>
                  )}
                  {payment.description && (
                    <p><strong>Description:</strong> {payment.description}</p>
                  )}
                  {payment.transactionId && (
                    <p><strong>Transaction ID:</strong> {payment.transactionId}</p>
                  )}
                  {userRole === 'admin' && payment.patient && (
                    <p><strong>Patient:</strong> {payment.patient.name}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentList;

