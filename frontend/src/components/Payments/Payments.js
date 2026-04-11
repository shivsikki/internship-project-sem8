import React, { useState } from 'react';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './Payments.css';

const Payments = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeTab, setActiveTab] = useState('history');

  // Dummy payment data
  const dummyPayments = [
    {
      _id: 'pay_001',
      amount: 2500.00,
      status: 'paid',
      paymentType: 'Consultation',
      paymentMethod: 'Credit Card',
      createdAt: '2024-01-15T10:30:00Z',
      description: 'Dr. Sarah Johnson - General Checkup',
      transactionId: 'TXN123456789'
    },
    {
      _id: 'pay_002',
      amount: 4500.00,
      status: 'paid',
      paymentType: 'Lab Tests',
      paymentMethod: 'UPI',
      createdAt: '2024-01-12T14:45:00Z',
      description: 'Blood Test & X-Ray Package',
      transactionId: 'TXN987654321'
    },
    {
      _id: 'pay_003',
      amount: 1200.00,
      status: 'pending',
      paymentType: 'Prescription',
      paymentMethod: 'Net Banking',
      createdAt: '2024-01-18T09:15:00Z',
      description: 'Monthly Medication Refill'
    },
    {
      _id: 'pay_004',
      amount: 8000.00,
      status: 'paid',
      paymentType: 'Surgery',
      paymentMethod: 'Insurance',
      createdAt: '2024-01-10T11:00:00Z',
      description: 'Minor Procedure - Day Care',
      transactionId: 'TXN456789123'
    },
    {
      _id: 'pay_005',
      amount: 1500.00,
      status: 'refunded',
      paymentType: 'Consultation',
      paymentMethod: 'Credit Card',
      createdAt: '2024-01-08T16:20:00Z',
      description: 'Cancelled Appointment - Refunded',
      transactionId: 'TXN789123456'
    },
    {
      _id: 'pay_006',
      amount: 3500.00,
      status: 'paid',
      paymentType: 'Vaccination',
      paymentMethod: 'Debit Card',
      createdAt: '2024-01-05T13:30:00Z',
      description: 'Annual Flu Vaccine + COVID Booster',
      transactionId: 'TXN321654987'
    }
  ];

  // Dummy payment methods
  const paymentMethods = [
    { id: 1, type: 'Credit Card', last4: '4242', brand: 'Visa', expiry: '12/26', isDefault: true },
    { id: 2, type: 'UPI', upiId: 'ram39@sbipay', isDefault: false },
    { id: 3, type: 'Net Banking', bank: 'HDFC Bank', isDefault: false }
  ];

  // Summary stats
  const totalPaid = dummyPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = dummyPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalTransactions = dummyPayments.length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'pending':
        return '⏳';
      case 'refunded':
        return '↺';
      case 'failed':
        return '✕';
      default:
        return '•';
    }
  };

  return (
    <div className="payments-page">
      {/* Hero Header */}
      <div className="payments-header">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="payments-header-content">
          <div className="payments-header-text">
            <p className="payments-hero-eyebrow">Billing & Receipts</p>
            <AnimatedHeading text="Payments" />
            <p className="payments-hero-subtitle">
              Manage your payments, view transaction history, and track your healthcare expenses.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payments-summary-grid">
        <div 
          className={`summary-card ${hoveredCard === 'total' ? 'card-expanded' : ''}`}
          onMouseEnter={() => setHoveredCard('total')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <p className="summary-label">Total Paid</p>
            <h3 className="summary-value">₹{totalPaid.toLocaleString()}</h3>
          </div>
        </div>

        <div 
          className={`summary-card ${hoveredCard === 'pending' ? 'card-expanded' : ''}`}
          onMouseEnter={() => setHoveredCard('pending')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="summary-icon">⏳</div>
          <div className="summary-info">
            <p className="summary-label">Pending</p>
            <h3 className="summary-value">₹{totalPending.toLocaleString()}</h3>
          </div>
        </div>

        <div 
          className={`summary-card ${hoveredCard === 'transactions' ? 'card-expanded' : ''}`}
          onMouseEnter={() => setHoveredCard('transactions')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="summary-icon">📊</div>
          <div className="summary-info">
            <p className="summary-label">Transactions</p>
            <h3 className="summary-value">{totalTransactions}</h3>
          </div>
        </div>

        <div 
          className={`summary-card summary-card-action ${hoveredCard === 'add' ? 'card-expanded' : ''}`}
          onMouseEnter={() => setHoveredCard('add')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="summary-icon">+</div>
          <div className="summary-info">
            <p className="summary-label">Add Method</p>
            <h3 className="summary-value">New</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="payments-tabs">
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Payment History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'methods' ? 'active' : ''}`}
          onClick={() => setActiveTab('methods')}
        >
          Payment Methods
        </button>
        <button 
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices
        </button>
      </div>

      {/* Tab Content */}
      <div className="payments-content">
        {activeTab === 'history' && (
          <div className="payments-history">
            <h2 className="section-title">Recent Transactions</h2>
            <div className="payments-grid">
              {dummyPayments.map((payment, index) => (
                <div 
                  key={payment._id}
                  className={`payment-card-item ${hoveredCard && hoveredCard !== `payment-${index}` ? 'card-shrunk' : ''} ${hoveredCard === `payment-${index}` ? 'card-expanded' : ''}`}
                  onMouseEnter={() => setHoveredCard(`payment-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="payment-card-header">
                    <div 
                      className="payment-status-badge"
                      style={{ backgroundColor: getStatusColor(payment.status) }}
                    >
                      <span className="status-icon">{getStatusIcon(payment.status)}</span>
                      {payment.status.toUpperCase()}
                    </div>
                    <div className="payment-amount-large">
                      ₹{payment.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="payment-card-body">
                    <h4 className="payment-title">{payment.description}</h4>
                    <div className="payment-details">
                      <div className="payment-detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(payment.createdAt)}</span>
                      </div>
                      <div className="payment-detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{payment.paymentType}</span>
                      </div>
                      <div className="payment-detail-row">
                        <span className="detail-label">Method:</span>
                        <span className="detail-value">{payment.paymentMethod}</span>
                      </div>
                      {payment.transactionId && (
                        <div className="payment-detail-row">
                          <span className="detail-label">Transaction ID:</span>
                          <span className="detail-value transaction-id">{payment.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="payment-card-footer">
                    <button className="payment-action-btn secondary">
                      View Receipt
                    </button>
                    {payment.status === 'pending' && (
                      <button className="payment-action-btn primary">
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="payment-methods">
            <h2 className="section-title">Saved Payment Methods</h2>
            <div className="methods-grid">
              {paymentMethods.map((method, index) => (
                <div 
                  key={method.id}
                  className={`method-card ${hoveredCard && hoveredCard !== `method-${index}` ? 'card-shrunk' : ''} ${hoveredCard === `method-${index}` ? 'card-expanded' : ''}`}
                  onMouseEnter={() => setHoveredCard(`method-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="method-header">
                    <div className="method-icon">
                      {method.type === 'Credit Card' && '💳'}
                      {method.type === 'UPI' && '📱'}
                      {method.type === 'Net Banking' && '🏦'}
                    </div>
                    <div className="method-info">
                      <h4 className="method-type">{method.type}</h4>
                      {method.last4 && (
                        <p className="method-detail">•••• {method.last4}</p>
                      )}
                      {method.upiId && (
                        <p className="method-detail">{method.upiId}</p>
                      )}
                      {method.bank && (
                        <p className="method-detail">{method.bank}</p>
                      )}
                    </div>
                    {method.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                  <div className="method-actions">
                    <button className="method-btn secondary">Edit</button>
                    {!method.isDefault && (
                      <button className="method-btn primary">Set Default</button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Add New Method Card */}
              <div 
                className={`method-card method-card-add ${hoveredCard === 'add-method' ? 'card-expanded' : ''}`}
                onMouseEnter={() => setHoveredCard('add-method')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="add-method-content">
                  <div className="add-icon">+</div>
                  <p className="add-text">Add New Payment Method</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="payment-invoices">
            <h2 className="section-title">Invoices & Receipts</h2>
            <div className="invoices-list">
              {dummyPayments.filter(p => p.status === 'paid').map((payment, index) => (
                <div 
                  key={payment._id}
                  className={`invoice-item ${hoveredCard && hoveredCard !== `invoice-${index}` ? 'card-shrunk' : ''} ${hoveredCard === `invoice-${index}` ? 'card-expanded' : ''}`}
                  onMouseEnter={() => setHoveredCard(`invoice-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="invoice-info">
                    <div className="invoice-icon">📄</div>
                    <div className="invoice-details">
                      <h4 className="invoice-title">Invoice #{payment.transactionId}</h4>
                      <p className="invoice-date">{formatDate(payment.createdAt)}</p>
                      <p className="invoice-description">{payment.description}</p>
                    </div>
                  </div>
                  <div className="invoice-amount">
                    <span className="amount">₹{payment.amount.toLocaleString()}</span>
                    <button className="download-btn">
                      ↓ Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
