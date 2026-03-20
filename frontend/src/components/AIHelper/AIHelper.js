import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './AIHelper.css';

const AIHelper = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleAsk = async (e) => {
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
        <div>
          <AnimatedHeading text="AI Helper" />
          <p>
            Ask general questions about medicines, tests, or health. Answers are for information only and{' '}
            <strong>do not replace your doctor&apos;s advice</strong>.
          </p>
        </div>
      </div>

      <div className="ai-helper-layout">
        <div className="ai-helper-card ai-helper-input">
          <h3>Ask a question</h3>
          <form onSubmit={handleAsk} className="ai-helper-form">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Example: What are common side effects of paracetamol?"
              rows={5}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Thinking...' : 'Ask AI'}
            </button>
          </form>
          {error && <div className="ai-helper-error">{error}</div>}
        </div>

        <div className="ai-helper-card ai-helper-output">
          <h3>AI Answer</h3>
          {answer ? (
            <div className="ai-helper-answer">
              {renderAnswer(answer)}
            </div>
          ) : (
            <p className="ai-helper-placeholder">
              Your answer will appear here. Remember: always confirm with your doctor before taking any medicine or
              changing treatment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIHelper;

