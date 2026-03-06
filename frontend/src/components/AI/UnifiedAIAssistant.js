import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './UnifiedAIAssistant.css';

const UnifiedAIAssistant = () => {
  // Voice Assistant States
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Medicine Chat States
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineInfo, setShowMedicineInfo] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // UI States
  const [activeTab, setActiveTab] = useState('voice');
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Assistant Functions
  const ensureMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permission in your browser.');
      return false;
    }
  };

  const startRecording = async () => {
    setError('');
    const ok = await ensureMicPermission();
    if (!ok) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendVoiceToServer(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording', err);
      setError('Could not start recording. Your browser may not support audio recording.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const sendVoiceToServer = async (blob) => {
    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not signed in. Please sign in again.');
        setIsProcessing(false);
        return;
      }

      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await axios.post('/api/ai/voice-chat', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
      });

      const contentType = response.headers['content-type'] || '';
      if (!contentType.startsWith('audio/')) {
        setError('Unexpected response from AI server.');
        setIsProcessing(false);
        return;
      }

      const arrayBuffer = response.data;
      const audioBlob = new Blob([arrayBuffer], { type: contentType });
      const audioUrl = URL.createObjectURL(audioBlob);

      const aiTextHeader = response.headers['x-ai-text'];
      if (aiTextHeader) {
        try {
          const decoded = decodeURIComponent(aiTextHeader);
          setAiReply(decoded);
        } catch {
          setAiReply('');
        }
      }

      // Play AI reply audio
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.error('Error playing audio', err);
        setError('Could not play AI response audio. Check your output device.');
      });

      setTranscript('(last message sent – transcription happens on server)');
    } catch (err) {
      console.error('AI voice chat error', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to contact AI assistant. Please try again.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Medicine Chat Functions
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
    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to use medicine assistant.');
        setIsProcessing(false);
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
      setIsProcessing(false);
    }
  };

  const handleMedicineSearch = async (e) => {
    e.preventDefault();
    if (!medicineSearch.trim() || isProcessing) return;

    setIsProcessing(true);
    setError('');
    setShowMedicineInfo(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to search for medicine information.');
        setIsProcessing(false);
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
      setIsProcessing(false);
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

  const isLoading = isProcessing;

  return (
    <div className="unified-ai-container">
      <div className="unified-ai-header">
        <h2>🤖 AI Medical Assistant</h2>
        <p>Your comprehensive healthcare companion - Voice chat & Medicine information</p>
      </div>

      <div className="ai-tabs">
        <button 
          className={`tab-button ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          🎤 Voice Assistant
        </button>
        <button 
          className={`tab-button ${activeTab === 'medicine' ? 'active' : ''}`}
          onClick={() => setActiveTab('medicine')}
        >
          💊 Medicine Info
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Voice Assistant Tab */}
      {activeTab === 'voice' && (
        <div className="voice-assistant-section">
          <div className="voice-controls">
            <button
              type="button"
              className={`voice-record-button ${isRecording ? 'recording' : ''}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={isRecording ? stopRecording : undefined}
              disabled={isLoading}
            >
              {isRecording ? '🔴 Release to send' : isLoading ? '⏳ Processing...' : '🎤 Hold to talk'}
            </button>
            <p className="voice-hint">
              Press and hold, speak clearly about your appointments, prescriptions, or tests, then release.
            </p>
          </div>

          <div className="voice-status">
            {transcript && (
              <div className="voice-section">
                <h4>Your last message</h4>
                <p>{transcript}</p>
              </div>
            )}
            {aiReply && (
              <div className="voice-section">
                <h4>AI reply</h4>
                <p>{aiReply}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medicine Info Tab */}
      {activeTab === 'medicine' && (
        <div className="medicine-assistant-section">
          <div className="medicine-content">
            {/* Medicine Search */}
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

            {/* Medicine Chat */}
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
                
                {isLoading && activeTab === 'medicine' && (
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
        </div>
      )}

      <div className="unified-ai-disclaimer">
        <p><strong>⚠️ Medical Disclaimer:</strong> This AI assistant provides information for educational purposes only. 
        Always consult your doctor or pharmacist for personalized medical advice and before taking any medication.</p>
      </div>
    </div>
  );
};

export default UnifiedAIAssistant;
