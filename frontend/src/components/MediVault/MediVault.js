import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './MediVault.css';

const CURRENCY_MAP = {
  'India': { code: 'INR', symbol: '₹' },
  'United States': { code: 'USD', symbol: '$' },
  'United Kingdom': { code: 'GBP', symbol: '£' },
  'Canada': { code: 'CAD', symbol: 'C$' },
  'Australia': { code: 'AUD', symbol: 'A$' },
  'Germany': { code: 'EUR', symbol: '€' },
  'France': { code: 'EUR', symbol: '€' },
  'Japan': { code: 'JPY', symbol: '¥' },
  'China': { code: 'CNY', symbol: '¥' },
  'Brazil': { code: 'BRL', symbol: 'R$' },
  'Mexico': { code: 'MXN', symbol: 'Mex$' },
  'Singapore': { code: 'SGD', symbol: 'S$' },
  'UAE': { code: 'AED', symbol: 'AED' },
  'South Africa': { code: 'ZAR', symbol: 'R' },
};

const DEFAULT_COUNTRY = 'India';

// Medicine icons mapping
const getMedicineIcon = (name) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('tablet') || lowerName.includes('pill')) return '💊';
  if (lowerName.includes('capsule')) return '💊';
  if (lowerName.includes('syrup') || lowerName.includes('liquid')) return '🍶';
  if (lowerName.includes('cream') || lowerName.includes('ointment')) return '🧴';
  if (lowerName.includes('injection') || lowerName.includes('ampoule')) return '💉';
  if (lowerName.includes('drop')) return '💧';
  if (lowerName.includes('inhaler')) return '🌬️';
  return '💊';
};

const MediVault = () => {
  const [searchType, setSearchType] = useState('name');
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [country, setCountry] = useState(() => {
    const saved = localStorage.getItem('medivault_country');
    return saved || DEFAULT_COUNTRY;
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('medivault_cart');
      return saved ? JSON.parse(saved) : [
        {
          id: 'med-1',
          name: 'Paracetamol',
          dosage: '500mg Oral Tablet',
          priceValue: 12.00,
          quantity: 1,
          icon: '💊'
        },
        {
          id: 'med-2',
          name: 'Amoxicillin',
          dosage: '250mg Capsule',
          priceValue: 24.50,
          quantity: 1,
          icon: '💊'
        }
      ];
    } catch {
      return [
        {
          id: 'med-1',
          name: 'Paracetamol',
          dosage: '500mg Oral Tablet',
          priceValue: 12.00,
          quantity: 1,
          icon: '💊'
        },
        {
          id: 'med-2',
          name: 'Amoxicillin',
          dosage: '250mg Capsule',
          priceValue: 24.50,
          quantity: 1,
          icon: '💊'
        }
      ];
    }
  });

  const currency = CURRENCY_MAP[country] || CURRENCY_MAP[DEFAULT_COUNTRY];

  useEffect(() => {
    localStorage.setItem('medivault_country', country);
  }, [country]);

  useEffect(() => {
    localStorage.setItem('medivault_cart', JSON.stringify(cart));
  }, [cart]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setMedicines([]);

    try {
      const res = await axios.post('/api/medivault/search', {
        query: query.trim(),
        searchType,
        country,
        currency: currency.code
      });

      if (res.data?.success) {
        // Add stock status and icon to each medicine
        const enhancedMedicines = (res.data.medicines || []).map((med, index) => ({
          ...med,
          id: med.id || `med-${index}`,
          icon: getMedicineIcon(med.name),
          stockStatus: index % 4 === 3 ? 'LOW STOCK' : 'IN STOCK',
          dosage: med.dosage || '500mg Oral Tablet'
        }));
        setMedicines(enhancedMedicines);
        if (res.data.medicines?.length === 0) {
          setError('No medicines found. Try different search terms.');
        }
      } else {
        setError(res.data?.message || 'Search failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to search medicines right now.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === medicine.id);
      if (exists) {
        return prev.map((item) =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId) => {
    setCart((prev) => prev.filter((item) => item.id !== medicineId));
  };

  const updateQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === medicineId ? { ...item, quantity } : item
      )
    );
  };

  const getPlaceholder = () => {
    return searchType === 'symptom'
      ? 'Enter symptoms...'
      : 'Enter medicine name...';
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.priceValue || 0) * item.quantity, 0);
  const clinicalFee = 5.00;
  const total = subtotal + clinicalFee;

  return (
    <div className="medivault-page">
      {/* Header matching Book Appointment style */}
      <header className="medivault-hero">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="medivault-hero-content">
          <p className="medivault-hero-eyebrow">Medicines</p>
          <AnimatedHeading text="MediVault" />
          <p className="medivault-hero-subtitle">
            Search for medicines by name or symptoms. Get detailed information about medicines,
            their uses, side effects, and dosage. Add medicines to your cart for easy ordering.
          </p>
        </div>
      </header>

      <div className="medivault-main-layout">
        {/* Left Column - Search and Inventory */}
        <div className="medivault-left-column">
          {/* Search Bar - Horizontal Design */}
          <div className="medivault-search-bar">
            <div className="search-bar-section">
              <label className="search-bar-label">YOUR COUNTRY</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="search-bar-select"
              >
                {Object.keys(CURRENCY_MAP).sort().map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="search-bar-divider" />

            <div className="search-bar-section">
              <label className="search-bar-label">SEARCH BY</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="search-bar-select"
              >
                <option value="name">Medicine Name</option>
                <option value="symptom">Symptoms</option>
              </select>
            </div>

            <div className="search-bar-divider" />

            <div className="search-bar-section search-bar-input-section">
              <label className="search-bar-label">SEARCH MEDICINE</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={getPlaceholder()}
                className="search-bar-input"
              />
            </div>

            <button 
              onClick={handleSearch} 
              disabled={loading} 
              className="search-bar-button"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5Z" stroke="white" strokeWidth="1.5"/>
                <path d="M9 9L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Recent Inventory Section */}
          <div className="medivault-inventory-section">
            <div className="inventory-header">
              <h3 className="inventory-title">Recent Inventory</h3>
              <div className="inventory-view-toggle">
                <button className="view-btn active">⊞</button>
                <button className="view-btn">☰</button>
              </div>
            </div>

            {/* Results Grid */}
            {medicines.length > 0 && (
              <div className="medivault-inventory-grid">
                {medicines.map((medicine) => (
                  <div key={medicine.id} className="inventory-card">
                    <div className="inventory-card-icon">
                      {medicine.icon}
                    </div>
                    <div className="inventory-card-info">
                      <h4 className="inventory-card-name">{medicine.name}</h4>
                      <p className="inventory-card-dosage">{medicine.dosage}</p>
                    </div>
                    <div className="inventory-card-footer">
                      <span className={`stock-badge ${medicine.stockStatus === 'LOW STOCK' ? 'low' : ''}`}>
                        {medicine.stockStatus}
                      </span>
                      <button 
                        className="inventory-add-btn" 
                        onClick={() => addToCart(medicine)}
                        title="Add to cart"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="medivault-skeleton">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-icon shimmer" />
                    <div className="skeleton-body">
                      <div className="skeleton-line shimmer" style={{ width: '60%' }} />
                      <div className="skeleton-line shimmer" style={{ width: '40%', height: '10px', marginTop: '6px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && medicines.length === 0 && !error && (
              <div className="medivault-empty-state">
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="18" r="10" stroke="#c4c9c4" strokeWidth="2"/>
                    <path d="M26 26L33 33" stroke="#c4c9c4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p>Search for medicines to see results</p>
                <span className="empty-hint">Try &ldquo;Paracetamol&rdquo;, &ldquo;Ibuprofen&rdquo;, or &ldquo;headache&rdquo;</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="medivault-error-state">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Cart */}
        <div className="medivault-right-column">
          <div className="medivault-cart-panel">
            <div className="cart-panel-header">
              <h3>Your Sanctuary Cart</h3>
              <button className="cart-close-btn">✕</button>
            </div>

            <div className="cart-panel-items">
              {cart.length === 0 ? (
                <div className="cart-empty-state">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6h3l2.4 12h13.2l2.4-9H9" stroke="#d0d5d0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="14" cy="28" r="1.5" fill="#d0d5d0"/>
                    <circle cx="23" cy="28" r="1.5" fill="#d0d5d0"/>
                  </svg>
                  <p>Your cart is empty</p>
                  <span>Search for medicines and add them here</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-panel-item">
                    <div className="cart-item-icon">{item.icon}</div>
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <p>{item.dosage}</p>
                    </div>
                    <div className="cart-item-right">
                      <span className="price">{currency.symbol}{(item.priceValue * item.quantity).toFixed(2)}</span>
                      <div className="cart-qty-stepper">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >−</button>
                        <span className="qty-count">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-panel-footer">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>{currency.symbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Clinical Fee</span>
                  <span>{currency.symbol}{clinicalFee.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row total">
                  <span>Total</span>
                  <span>{currency.symbol}{total.toFixed(2)}</span>
                </div>
                <button className="secure-checkout-btn">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1L2 3V7C2 9.76 4.24 12.35 7 13C9.76 12.35 12 9.76 12 7V3L7 1Z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                  Secure Checkout
                </button>
                <p className="hipaa-text">HIPAA COMPLIANT &amp; ENCRYPTED</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediVault;
