import React, { useEffect, useRef } from 'react';
import './JitsiCall.css';

const JitsiCall = ({ roomName, userName, onLeave }) => {
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    // Wait for the External API to load from the script tag in index.html
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName || 'HospitalAppointmentSession',
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: userName || 'User'
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: true,
            disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);

        api.addEventListener('videoConferenceLeft', () => {
          if (onLeave) onLeave();
        });

        return () => api.dispose();
      } else {
        // Retry if not loaded yet
        setTimeout(loadJitsiScript, 500);
      }
    };

    const cleanup = loadJitsiScript();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [roomName, userName, onLeave]);

  return (
    <div className="jitsi-overlay">
      <div className="jitsi-modal">
        <header className="jitsi-modal-header">
          <h3>Video Consultation</h3>
          <button className="jitsi-close-btn" onClick={onLeave}>&times;</button>
        </header>
        <div className="jitsi-container" ref={jitsiContainerRef}></div>
      </div>
    </div>
  );
};

export default JitsiCall;
