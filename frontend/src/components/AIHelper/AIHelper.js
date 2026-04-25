import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import AnimatedHeading from '../AnimatedHeading/AnimatedHeading';
import './AIHelper.css';

const AIHelper = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [savedChats, setSavedChats] = useState([]);
  const [activeTab, setActiveTab] = useState('helper');
  const [activeChatId, setActiveChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const hasStartedChat = messages.length > 0;
  const isDirty = hasStartedChat;
  const authHeaders = useMemo(() => {
    const token = sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const getChatTitle = () => {
    const firstQuestion = messages.find((message) => message.role === 'user')?.content || input;
    const compact = (firstQuestion || '').replace(/\s+/g, ' ').trim();
    if (!compact) return 'New chat';
    return compact.length > 60 ? `${compact.slice(0, 57)}...` : compact;
  };

  const fetchSavedChats = async () => {
    try {
      const res = await axios.get('/api/ai/chats', { headers: authHeaders });
      if (res.data?.success) {
        setSavedChats(res.data.chats || []);
      }
    } catch {
      // ignore list fetch issues for now
    }
  };

  const persistCurrentChat = async () => {
    if (!messages.length) return null;

    setSaving(true);
    try {
      if (activeChatId) {
        await axios.put(
          `/api/ai/chats/${activeChatId}`,
          { title: getChatTitle(), messages },
          { headers: authHeaders }
        );
        await fetchSavedChats();
        return activeChatId;
      }

      const res = await axios.post(
        '/api/ai/chats',
        { title: getChatTitle(), messages },
        { headers: authHeaders }
      );

      if (res.data?.success && res.data.chatId) {
        setActiveChatId(res.data.chatId);
        await fetchSavedChats();
        return res.data.chatId;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this chat right now.');
      return null;
    } finally {
      setSaving(false);
    }

    return null;
  };

  const openSavedChat = async (chatId) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`/api/ai/chats/${chatId}`, { headers: authHeaders });
      if (res.data?.success && res.data.chat) {
        setMessages(res.data.chat.messages || []);
        setActiveChatId(res.data.chat._id);
        setActiveTab('helper');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to open this chat.');
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setError('');
    setActiveChatId(null);
    setActiveTab('helper');
  };

  useEffect(() => {
    fetchSavedChats();
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('ai_helper_prefill');
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (payload?.question && typeof payload.question === 'string') {
        setInput(payload.question);
      }
    } catch {
      // ignore
    } finally {
      sessionStorage.removeItem('ai_helper_prefill');
    }
  }, []);

  useEffect(() => {
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
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += `${piece} `;
          } else {
            interimTranscript += piece;
          }
        }

        setTranscript(interimTranscript);
        if (finalTranscript) {
          setInput((prev) => `${prev}${finalTranscript}`);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setTranscript('');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, activeTab]);

  useEffect(() => {
    if (!hasStartedChat) return undefined;

    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasStartedChat]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setTranscript('');
      return;
    }

    recognitionRef.current.start();
    setIsRecording(true);
    setTranscript('Listening...');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    const priorHistory = messages.map((message) => ({
      role: message.role,
      content: message.content
    }));
    const nextMessages = [...messages, { role: 'user', content: question }];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');
    setActiveTab('helper');

    try {
      const res = await axios.post('/api/ai/ask', { question, history: priorHistory });
      if (res.data?.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
      } else {
        setError(res.data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reach the AI helper right now.');
      setMessages(nextMessages);
    } finally {
      setLoading(false);
    }
  };

  const requestTabSwitch = (tabId) => {
    if (tabId === activeTab) return;
    if (tabId === 'chats' && hasStartedChat) {
      setPendingTab(tabId);
      setShowSavePrompt(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleSavePromptAction = async (action) => {
    if (action === 'save') {
      const chatId = await persistCurrentChat();
      if (!chatId && !activeChatId) return;
    }

    if (action !== 'cancel' && pendingTab) {
      setActiveTab(pendingTab);
    }

    setPendingTab(null);
    setShowSavePrompt(false);
  };

  const renderMessageContent = (text) => {
    const lines = (text || '').split('\n');
    const elements = [];
    let listBuffer = [];

    const flushList = () => {
      if (!listBuffer.length) return;
      elements.push(
        <ul key={`list-${elements.length}`} className="ai-helper-list">
          {listBuffer.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listBuffer = [];
    };

    const formatInline = (line) => {
      let out = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      out = out.replace(/\[\[INFO\]\](.*?)\[\[\/INFO\]\]/g, '<span class="ai-token ai-token--info">$1</span>');
      out = out.replace(/\[\[ACCENT\]\](.*?)\[\[\/ACCENT\]\]/g, '<span class="ai-token ai-token--accent">$1</span>');
      out = out.replace(/\[\[NOTE\]\](.*?)\[\[\/NOTE\]\]/g, '<span class="ai-token ai-token--note">$1</span>');
      return out;
    };

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) {
        flushList();
        return;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        listBuffer.push(formatInline(line.slice(2)));
        return;
      }
      flushList();
      if (line.startsWith('## ')) {
        elements.push(
          <h4
            key={`h4-${idx}-${elements.length}`}
            className="ai-section-title"
            dangerouslySetInnerHTML={{ __html: formatInline(line.slice(3).trim()) }}
          />
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h5
            key={`h5-${idx}-${elements.length}`}
            className="ai-subsection-title"
            dangerouslySetInnerHTML={{ __html: formatInline(line.slice(4).trim()) }}
          />
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <p
            key={`q-${idx}-${elements.length}`}
            className="ai-quote"
            dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2).trim()) }}
          />
        );
      } else {
        elements.push(
          <p
            key={`p-${idx}-${elements.length}`}
            dangerouslySetInnerHTML={{ __html: formatInline(line) }}
          />
        );
      }
    });

    flushList();
    return elements;
  };

  const renderSavedChats = () => {
    if (!savedChats.length) {
      return (
        <div className="ai-empty-state">
          <h3>No saved chats yet</h3>
          <p>Save a conversation from Helper and it will appear here.</p>
        </div>
      );
    }

    return (
      <div className="ai-saved-chat-list">
        {savedChats.map((chat) => (
          <button
            key={chat._id}
            type="button"
            className="ai-saved-chat-card"
            onClick={() => openSavedChat(chat._id)}
          >
            <div className="ai-saved-chat-head">
              <h4>{chat.title}</h4>
              <span>{new Date(chat.updatedAt).toLocaleString()}</span>
            </div>
            <p>{chat.preview || 'No preview available.'}</p>
            <div className="ai-saved-chat-meta">{chat.messageCount} messages</div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="ai-helper-page">
      <div className="ai-helper-header">
        <div className="hero-bg-pattern" aria-hidden="true" />
        <div className="ai-helper-header-content">
          <p className="ai-helper-hero-eyebrow">medicine, tests, health, and doctor search</p>
          <AnimatedHeading text="AI Helper" />
          <p className="ai-helper-hero-subtitle">
            Ask health-related questions or search doctors by city and specialization. Answers are for information only and{' '}
            <strong>do not replace your doctor&apos;s advice</strong>.
          </p>
        </div>
      </div>

      <div className="consultation-container">
        <div className="portal-tabs ai-helper-tabs">
          <button
            type="button"
            className={`portal-tab ${activeTab === 'helper' ? 'active' : ''}`}
            onClick={() => requestTabSwitch('helper')}
          >
            Helper
          </button>
          <button
            type="button"
            className={`portal-tab ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => requestTabSwitch('chats')}
          >
            Chats
          </button>
        </div>

        {activeTab === 'helper' && (
          <div className={`ai-chat-shell ${hasStartedChat ? 'chat-mode' : 'initial-mode'}`}>
            {!hasStartedChat ? (
              <div className="ai-initial-stage">
                <div className="consultation-input-card ai-initial-card">
                  <h2 className="consultation-title">Start a conversation</h2>
                  <form onSubmit={handleSend} className="consultation-form">
                    <div className="textarea-wrapper">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Try: I am in Nadiad and I need doctors for General Practice."
                        rows={7}
                        className="consultation-textarea ai-initial-textarea"
                      />
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`microphone-btn ${isRecording ? 'recording' : ''}`}
                        disabled={loading}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      </button>
                    </div>
                    {transcript && <div className="transcript-feedback">{transcript}</div>}
                    <button type="submit" disabled={loading || !input.trim()} className="analyze-btn">
                      {loading ? 'Analyzing...' : 'Ask AI Helper'}
                    </button>
                  </form>
                  {error && <div className="consultation-error">{error}</div>}
                </div>
              </div>
            ) : (
              <div className="ai-chat-stage">
                <div className="consultation-output-card ai-chat-card">
                  <div className="ai-chat-topbar">
                    <div>
                      <h3 className="output-title">Conversation</h3>
                      <p className="ai-chat-subtitle">{activeChatId ? 'Saved thread loaded' : 'Current draft chat'}</p>
                    </div>
                    <div className="ai-chat-actions">
                      <button type="button" className="ai-secondary-btn" onClick={startNewChat}>
                        New Chat
                      </button>
                      <button type="button" className="ai-primary-btn" onClick={persistCurrentChat} disabled={saving || !messages.length}>
                        {saving ? 'Saving...' : activeChatId ? 'Update Chat' : 'Save Chat'}
                      </button>
                    </div>
                  </div>

                  <div className="ai-message-list">
                    {messages.map((message, idx) => (
                      <div key={`${message.role}-${idx}`} className={`ai-message-row ai-message-row--${message.role}`}>
                        <div className={`ai-message-bubble ai-message-bubble--${message.role}`}>
                          <div className="ai-message-role">{message.role === 'user' ? 'You' : 'AI Helper'}</div>
                          <div className="consultation-answer">{renderMessageContent(message.content)}</div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="ai-message-row ai-message-row--assistant">
                        <div className="ai-message-bubble ai-message-bubble--assistant ai-message-bubble--loading">
                          <div className="ai-message-role">AI Helper</div>
                          <p>Thinking...</p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSend} className="consultation-form ai-chat-composer">
                    <div className="textarea-wrapper">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        rows={4}
                        className="consultation-textarea"
                      />
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`microphone-btn ${isRecording ? 'recording' : ''}`}
                        disabled={loading}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" y1="19" x2="12" y2="23"></line>
                          <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                      </button>
                    </div>
                    {transcript && <div className="transcript-feedback">{transcript}</div>}
                    <div className="ai-chat-submit-row">
                      {error && <div className="consultation-error">{error}</div>}
                      <button type="submit" disabled={loading || !input.trim()} className="analyze-btn">
                        {loading ? 'Analyzing...' : 'Send to chat box'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="consultation-output-card ai-chats-view">
            <div className="ai-chat-topbar">
              <div>
                <h3 className="output-title">Saved Chats</h3>
                <p className="ai-chat-subtitle">Reopen previous AI Helper conversations.</p>
              </div>
              <button type="button" className="ai-primary-btn" onClick={startNewChat}>
                Start Fresh
              </button>
            </div>
            {renderSavedChats()}
          </div>
        )}
      </div>

      {showSavePrompt && (
        <div className="ai-save-overlay">
          <div className="ai-save-modal">
            <h3>Do you want to save this chat?</h3>
            <p>You have an active AI Helper conversation. Save it before moving away?</p>
            <div className="ai-save-actions">
              <button type="button" className="ai-secondary-btn" onClick={() => handleSavePromptAction('discard')}>
                Don&apos;t Save
              </button>
              <button type="button" className="ai-secondary-btn" onClick={() => handleSavePromptAction('cancel')}>
                Cancel
              </button>
              <button type="button" className="ai-primary-btn" onClick={() => handleSavePromptAction('save')}>
                Save Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHelper;

