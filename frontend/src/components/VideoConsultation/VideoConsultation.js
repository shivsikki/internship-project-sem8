import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './VideoConsultation.css';

const VideoConsultation = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [consultation, setConsultation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [prescription, setPrescription] = useState({ medications: [] });
  const [diagnosis, setDiagnosis] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    if (appointmentId) {
      loadConsultation(appointmentId);
    }
    
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isConnected) {
      startCallTimer();
    } else {
      stopCallTimer();
    }
    
    return () => stopCallTimer();
  }, [isConnected]);

  const loadConsultation = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setConsultation(response.data.data);
      }
    } catch (error) {
      console.error('Error loading consultation:', error);
    }
  };

  const startCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;
      
      // Initialize WebRTC connection
      await initializePeerConnection();
      
      // Connect to signaling server
      connectToSignalingServer();
      
      setIsConnected(true);
      
      // Start the consultation
      if (consultation) {
        await updateConsultationStatus('in-progress');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to start video call. Please check your camera and microphone permissions.');
    }
  };

  const initializePeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream
    localStreamRef.current.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, localStreamRef.current);
    });
    
    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', event.candidate);
      }
    };
    
    // Create offer
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    
    socketRef.current?.emit('offer', offer);
  };

  const connectToSignalingServer = () => {
    // This would connect to your WebSocket server
    // For demo purposes, we'll simulate the connection
    setTimeout(() => {
      simulateRemoteConnection();
    }, 2000);
  };

  const simulateRemoteConnection = async () => {
    // Simulate remote peer connecting
    if (remoteVideoRef.current) {
      // Create a mock remote video stream for demo
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      // Draw a placeholder video
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Dr. Smith - Connected', 320, 240);
      
      const stream = canvas.captureStream(30);
      remoteVideoRef.current.srcObject = stream;
    }
  };

  const endCall = async () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      setIsConnected(false);
      
      // Update consultation status
      if (consultation) {
        await updateConsultationStatus('completed');
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        
        // Stop screen share when ended
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          // Restore camera
          toggleVideo();
          toggleVideo();
        };
      } else {
        // Restore camera
        toggleVideo();
        toggleVideo();
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: user.role,
      senderName: user.name,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, message]);
    
    // Send via WebSocket
    socketRef.current?.emit('chat-message', message);
    
    setNewMessage('');
  };

  const updateConsultationStatus = async (status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/appointments/${consultation._id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating consultation status:', error);
    }
  };

  const addMedication = () => {
    setPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const updateMedication = (index, field, value) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedication = (index) => {
    setPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const saveConsultation = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Save prescription
      if (prescription.medications.length > 0) {
        await axios.post('/api/prescriptions', {
          patient: consultation.patient,
          doctor: consultation.doctor,
          appointment: consultation._id,
          medications: prescription.medications,
          instructions: prescription.instructions,
          status: 'active'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Save consultation notes
      await axios.patch(`/api/appointments/${consultation._id}`, {
        notes: consultationNotes,
        diagnosis: diagnosis
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Consultation saved successfully!');
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert('Failed to save consultation');
    }
  };

  const startCallTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionQualityColor = (quality) => {
    const colors = {
      excellent: '#28a745',
      good: '#ffc107',
      fair: '#fd7e14',
      poor: '#dc3545'
    };
    return colors[quality] || '#6c757d';
  };

  if (!consultation) {
    return (
      <div className="video-consultation-loading">
        <div className="loading-spinner"></div>
        <p>Loading consultation...</p>
      </div>
    );
  }

  return (
    <div className="video-consultation">
      <div className="consultation-header">
        <div className="consultation-info">
          <h2>Video Consultation</h2>
          <div className="participant-info">
            <div className="participant">
              <strong>{user.name}</strong> ({user.role})
            </div>
            <div className="vs">VS</div>
            <div className="participant">
              <strong>Dr. {consultation.doctor?.name || 'Smith'}</strong> (Doctor)
            </div>
          </div>
        </div>
        
        <div className="consultation-controls">
          <div className="call-info">
            <span className="duration">{formatDuration(callDuration)}</span>
            <div className="connection-quality" style={{ color: getConnectionQualityColor(connectionQuality) }}>
              ● {connectionQuality}
            </div>
          </div>
          
          <div className="control-buttons">
            {!isConnected ? (
              <button onClick={startCall} className="btn btn-success btn-modern">
                📹 Start Call
              </button>
            ) : (
              <>
                <button 
                  onClick={toggleVideo} 
                  className={`btn ${isVideoEnabled ? 'btn-primary' : 'btn-secondary'} btn-modern`}
                >
                  {isVideoEnabled ? '📹' : '📹❌'}
                </button>
                <button 
                  onClick={toggleAudio} 
                  className={`btn ${isAudioEnabled ? 'btn-primary' : 'btn-secondary'} btn-modern`}
                >
                  {isAudioEnabled ? '🎤' : '🎤❌'}
                </button>
                <button 
                  onClick={toggleScreenShare} 
                  className={`btn ${isScreenSharing ? 'btn-warning' : 'btn-secondary'} btn-modern`}
                >
                  🖥️ {isScreenSharing ? 'Stop' : 'Share'}
                </button>
                <button 
                  onClick={() => setIsRecording(!isRecording)} 
                  className={`btn ${isRecording ? 'btn-danger pulse-emergency' : 'btn-secondary'} btn-modern`}
                >
                  {isRecording ? '⏹️ Stop' : '⏺️ Record'}
                </button>
                <button onClick={endCall} className="btn btn-danger btn-modern">
                  📞 End Call
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="consultation-main">
        <div className="video-section">
          <div className="video-grid">
            <div className="video-container">
              <h3>You</h3>
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline
                className={`local-video ${!isVideoEnabled ? 'video-disabled' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="video-placeholder">
                  <div className="avatar">{user.name.charAt(0)}</div>
                  <p>Camera Off</p>
                </div>
              )}
            </div>
            
            <div className="video-container">
              <h3>Dr. {consultation.doctor?.name || 'Smith'}</h3>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline
                className="remote-video"
              />
              {!isConnected && (
                <div className="video-placeholder waiting">
                  <div className="loading-spinner"></div>
                  <p>Waiting for doctor to join...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="consultation-sidebar">
          <div className="chat-section">
            <h3>Consultation Chat</h3>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-welcome">
                  <p>Start a conversation during the consultation</p>
                </div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className={`message ${message.sender}`}>
                    <div className="message-header">
                      <strong>{message.senderName}</strong>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{message.text}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={!isConnected}
              />
              <button type="submit" disabled={!isConnected || !newMessage.trim()}>
                Send
              </button>
            </form>
          </div>

          {user.role === 'doctor' && (
            <div className="consultation-tools">
              <h3>Consultation Tools</h3>
              
              <div className="tool-section">
                <h4>Diagnosis</h4>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                  rows="3"
                />
              </div>

              <div className="tool-section">
                <h4>Consultation Notes</h4>
                <textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Enter consultation notes..."
                  rows="4"
                />
              </div>

              <div className="tool-section">
                <h4>Prescription</h4>
                {prescription.medications.map((med, index) => (
                  <div key={index} className="medication-item">
                    <input
                      type="text"
                      placeholder="Medication name"
                      value={med.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={() => removeMedication(index)}
                      className="btn btn-sm btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={addMedication}
                  className="btn btn-sm btn-primary"
                >
                  + Add Medication
                </button>
                
                <textarea
                  value={prescription.instructions || ''}
                  onChange={(e) => setPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Additional instructions..."
                  rows="2"
                  className="mt-2"
                />
              </div>

              <button onClick={saveConsultation} className="btn btn-success btn-modern w-100">
                💾 Save Consultation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConsultation;
