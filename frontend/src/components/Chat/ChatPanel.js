import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../realtime';
import './Chat.css';

const ChatPanel = ({ user }) => {
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    const baseRoom = `user:${user._id}`;
    setRoomId(baseRoom);
    socket.emit('join', baseRoom);

    const handler = (msg) => {
      if (msg.roomId !== baseRoom) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat:message', handler);
    return () => {
      socket.off('chat:message', handler);
    };
  }, [user._id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const socket = getSocket();
    const payload = {
      roomId,
      message: {
        from: user.name,
        text: trimmed,
      },
    };
    socket.emit('chat:send', payload);
    setMessages((prev) => [
      ...prev,
      { roomId, message: payload.message, at: new Date().toISOString() },
    ]);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Chat (beta)</h2>
        <p>Share room ID with another user to chat in the same room.</p>
        <div className="chat-room-row">
          <span className="chat-room-label">Room ID</span>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet.</div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.message?.from === user.name ? 'chat-message chat-message-self' : 'chat-message'
              }
            >
              <div className="chat-meta">
                <span className="chat-from">{m.message?.from}</span>
                <span className="chat-time">
                  {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="chat-text">{m.message?.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message and press Enter..."
          className="form-textarea"
          rows={2}
        />
        <button type="button" onClick={send} className="submit-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;

