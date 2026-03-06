import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './MedicineAIAssistant.css';

const MedicineAIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineInfo, setShowMedicineInfo] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to use the medicine assistant.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('/api/ai/medicine-chat', 
        { message: userMessage.text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          text: response.data.data.response,
          sender: 'ai',
          timestamp: response.data.data.timestamp,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setError(response.data.message || 'Failed to get response from AI assistant.');
      }
    } catch (err) {
      console.error('Medicine chat error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to connect to AI assistant. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMedicineSearch = async (e) => {
    e.preventDefault();
    if (!medicineSearch.trim() || isLoading) return;

    setIsLoading(true);
    setError('');
    setShowMedicineInfo(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to search for medicine information.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('/api/ai/medicine-info',
        { medicine: medicineSearch.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setMedicineInfo(response.data.data);
        setShowMedicineInfo(true);
      } else {
        setError(response.data.message || 'Failed to get medicine information.');
      }
    } catch (err) {
      console.error('Medicine info error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to get medicine information. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  const formatMedicineInfo = (info) => {
    return info.split('\n').map((line, index) => {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        return <li key={index}>{line.substring(1).trim()}</li>;
      } else if (line.trim().length > 0 && !line.toLowerCase().includes('disclaimer')) {
        return <p key={index} className="medicine-info-paragraph">{line}</p>;
      } else if (line.toLowerCase().includes('disclaimer')) {
        return <p key={index} className="medicine-disclaimer">{line}</p>;
      }
      return null;
    });
  };

  return (
    <div className="medicine-ai-container">
      <div className="medicine-ai-header">
        <h2>💊 Medicine Information Assistant</h2>
        <p>Get information about medicines, their uses, side effects, and precautions</p>
      </div>

      <div className="medicine-ai-content">
        {/* Medicine Search Section */}
        <div className="medicine-search-section">
          <h3>Quick Medicine Lookup</h3>
          <form onSubmit={handleMedicineSearch} className="medicine-search-form">
            <input
              type="text"
              value={medicineSearch}
              onChange={(e) => setMedicineSearch(e.target.value)}
              placeholder="Enter medicine name (e.g., Paracetamol, Aspirin)..."
              className="medicine-search-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="medicine-search-button"
              disabled={isLoading || !medicineSearch.trim()}
            >
              {isLoading ? 'Searching...' : 'Get Info'}
            </button>
          </form>

          {showMedicineInfo && medicineInfo && (
            <div className="medicine-info-card">
              <div className="medicine-info-header">
                <h4>{medicineInfo.medicine}</h4>
                <button 
                  className="close-info-button"
                  onClick={() => setShowMedicineInfo(false)}
                >
                  ×
                </button>
              </div>
              <div className="medicine-info-content">
                {formatMedicineInfo(medicineInfo.information)}
              </div>
              <div className="medicine-info-footer">
                <small>Last updated: {new Date(medicineInfo.timestamp).toLocaleString()}</small>
              </div>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="medicine-chat-section">
          <div className="chat-header">
            <h3>Ask About Medicines</h3>
            {messages.length > 0 && (
              <button onClick={clearChat} className="clear-chat-button">
                Clear Chat
              </button>
            )}
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <p>👋 Hi! I'm your medicine assistant. You can ask me about:</p>
                <ul>
                  <li>Medicine uses and benefits</li>
                  <li>Side effects and precautions</li>
                  <li>Drug interactions</li>
                  <li>Dosage information (general)</li>
                  <li>Storage instructions</li>
                </ul>
                <p><strong>Example:</strong> "Is paracetamol safe for children?"</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                >
                  <div className="message-content">
                    {message.text}
                  </div>
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="message ai-message">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about any medicine..."
              className="chat-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="chat-send-button"
              disabled={isLoading || !inputMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <div className="medicine-ai-disclaimer">
        <p><strong>⚠️ Medical Disclaimer:</strong> This information is for educational purposes only. 
        Always consult your doctor or pharmacist for personalized medical advice and before taking any medication.</p>
      </div>
    </div>
  );
};

export default MedicineAIAssistant;
