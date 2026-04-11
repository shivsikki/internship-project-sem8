import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './AIHelper.css';

const AIHelper = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_helper_prefill');
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (payload?.question && typeof payload.question === 'string') {
        setQuestion(payload.question);
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('ai_helper_prefill');
    }
  }, []);

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript);
        if (finalTranscript) {
          setQuestion(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setTranscript('');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setTranscript('');
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      setTranscript('Listening...');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const res = await axios.post('/api/ai/ask', { question });
      if (res.data?.success) {
        setAnswer(res.data.answer);
      } else {
        setError(res.data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reach the AI helper right now.');
    } finally {
      setLoading(false);
    }
  };

  const renderAnswer = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let listBuffer = [];

    const flushList = () => {
      if (listBuffer.length === 0) return;
      elements.push(
        <ul key={`list-${elements.length}`} className="ai-helper-list">
          {listBuffer.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listBuffer = [];
    };

    const formatInline = (line) =>
      line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) {
        flushList();
        return;
      }

      if (line.startsWith('* ') || line.startsWith('- ')) {
        const item = formatInline(line.slice(2));
        listBuffer.push(item);
      } else {
        flushList();
        const formatted = formatInline(line);
        elements.push(
          <p
            key={`p-${idx}-${elements.length}`}
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="ai-helper-page">
      <div className="ai-helper-header">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="ai-helper-header-content">
          <p className="ai-helper-hero-eyebrow">medicine, tests, and health</p>
          <AnimatedHeading text="AI Helper" />
          <p className="ai-helper-hero-subtitle">
            Ask general questions about medicines, tests, or health. Answers are for information only and{' '}
            <strong>do not replace your doctor&apos;s advice</strong>.
          </p>
        </div>
      </div>

      <div className="consultation-container">
        <div className="consultation-input-card">
          <h2 className="consultation-title">Consultation Input</h2>
          
          <form onSubmit={handleAnalyze} className="consultation-form">
            <div className="textarea-wrapper">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: I have been experiencing persistent headaches for the past week. They usually occur in the evening and are accompanied by slight nausea. What could be causing this?"
                rows={6}
                className="consultation-textarea"
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`microphone-btn ${isRecording ? 'recording' : ''}`}
                disabled={loading}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
            </div>
            
            {transcript && (
              <div className="transcript-feedback">
                {transcript}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || !question.trim()}
              className="analyze-btn"
            >
              {loading ? 'Analyzing...' : 'Analyze Data'}
            </button>
          </form>
          
          {error && <div className="consultation-error">{error}</div>}
        </div>

        {answer && (
          <div className="consultation-output-card">
            <h3 className="output-title">AI Analysis</h3>
            <div className="consultation-answer">
              {renderAnswer(answer)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHelper;

