import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './AIVoiceAssistant.css';

const AIVoiceAssistant = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
        await sendToServer(blob);
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

  const sendToServer = async (blob) => {
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

  return (
    <div className="ai-voice-panel">
      <header className="ai-voice-header">
        <h2>AI Voice Assistant</h2>
        <p>
          Hold the button and speak to ask about your appointments, prescriptions, or tests. This
          assistant cannot diagnose conditions and is not a replacement for your doctor.
        </p>
      </header>

      <div className="ai-voice-main">
        <div className="ai-voice-controls">
          <button
            type="button"
            className={`ai-voice-record-button ${
              isRecording ? 'ai-voice-recording' : ''
            }`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={isRecording ? stopRecording : undefined}
            disabled={isProcessing}
          >
            {isRecording ? 'Release to send' : isProcessing ? 'Processing...' : 'Hold to talk'}
          </button>
          <p className="ai-voice-hint">
            Press and hold, speak clearly, then release to send your question.
          </p>
        </div>

        <div className="ai-voice-status">
          {error && <div className="ai-voice-error">{error}</div>}
          {transcript && (
            <div className="ai-voice-section">
              <h3>Your last message</h3>
              <p>{transcript}</p>
            </div>
          )}
          {aiReply && (
            <div className="ai-voice-section">
              <h3>AI reply</h3>
              <p>{aiReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIVoiceAssistant;

