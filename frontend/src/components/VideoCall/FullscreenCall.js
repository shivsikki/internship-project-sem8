import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './FullscreenCall.css';

const FullscreenCall = () => {
  const { id } = useParams();
  const jitsiContainerRef = useRef(null);
  const user = JSON.parse(sessionStorage.getItem('user'));
  const userName = user?.role === 'doctor' ? `Dr. ${user.name}` : user?.name || 'User';

  useEffect(() => {
    // Communication channel back to parent portal
    const channel = new BroadcastChannel('hippocrates_consultation');

    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        const domain = 'meet.jit.si';
        const options = {
          roomName: id || 'Hippocrates-Consultation',
          width: '100%',
          height: '100vh',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: userName
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: true,
            disableDeepLinking: true,
            // PERFORMANCE: Reduce unnecessary UI elements
            desktopSharingFrameRate: { min: 15, max: 30 }
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand',
              'videoquality', 'tileview', 'videobackgroundblur'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);

        // SIGNAL PARENT TAB UPON HANGUP
        api.addEventListener('videoConferenceLeft', () => {
          channel.postMessage({ type: 'call_ended', roomId: id });
          setTimeout(() => {
            window.close(); // Attempt to close the tab automatically
          }, 500);
        });

        // HANDLE MANUAL TAB CLOSURE: Always signal portal if possible
        window.addEventListener('beforeunload', () => {
          channel.postMessage({ type: 'call_ended', roomId: id });
        });

        return () => {
          api.dispose();
          channel.close();
        };
      } else {
        setTimeout(loadJitsiScript, 500);
      }
    };

    loadJitsiScript();
  }, [id, userName]);

  return (
    <div className="fullscreen-call-viewport">
      <div className="jitsi-fullscreen-container" ref={jitsiContainerRef}></div>
      {/* Fallback exit button for browsers that block window.close() */}
      <div className="fullscreen-fallback-banner">
        <p>Consultation Active. This tab will close when you hang up. If not, please close it manually.</p>
      </div>
    </div>
  );
};

export default FullscreenCall;
