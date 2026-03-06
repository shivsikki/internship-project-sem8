import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '../components/Toast/ToastProvider';

const useRealTimeSync = (userId, userRole) => {
  const socketRef = useRef(null);
  const toast = useToast();
  const callbacksRef = useRef({
    onTestUpdate: [],
    onPrescriptionUpdate: [],
    onAppointmentUpdate: [],
    onHealthDataUpdate: [],
  });

  useEffect(() => {
    if (!userId) return;

    // Connect to Socket.io
    socketRef.current = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
        userId: userId,
        role: userRole
      }
    });

    const socket = socketRef.current;

    // Join user's personal room for real-time updates
    socket.emit('join', `user_${userId}`);

    // Listen for real-time updates
    socket.on('test:updated', (data) => {
      console.log('Real-time test update:', data);
      
      // Trigger all registered callbacks
      callbacksRef.current.onTestUpdate.forEach(callback => {
        callback(data);
      });

      // Show notification
      if (data.action === 'created') {
        toast.success(`New test assigned: ${data.test.testName}`);
      } else if (data.action === 'updated') {
        toast.info(`Test "${data.test.testName}" has been updated`);
      } else if (data.action === 'completed') {
        toast.success(`Test "${data.test.testName}" completed successfully`);
      }
    });

    socket.on('prescription:updated', (data) => {
      console.log('Real-time prescription update:', data);
      
      // Trigger all registered callbacks
      callbacksRef.current.onPrescriptionUpdate.forEach(callback => {
        callback(data);
      });

      // Show notification
      if (data.action === 'created') {
        toast.success(`New prescription from Dr. ${data.prescription.doctor?.name}`);
      } else if (data.action === 'updated') {
        toast.info('Prescription has been updated');
      }
    });

    socket.on('appointment:updated', (data) => {
      console.log('Real-time appointment update:', data);
      
      // Trigger all registered callbacks
      callbacksRef.current.onAppointmentUpdate.forEach(callback => {
        callback(data);
      });

      // Show notification
      if (data.action === 'created') {
        toast.success(`Appointment scheduled: ${data.appointment.reason}`);
      } else if (data.action === 'updated') {
        toast.info('Appointment has been updated');
      } else if (data.action === 'cancelled') {
        toast.warning('Appointment has been cancelled');
      }
    });

    socket.on('health:updated', (data) => {
      console.log('Real-time health data update:', data);
      
      // Trigger all registered callbacks
      callbacksRef.current.onHealthDataUpdate.forEach(callback => {
        callback(data);
      });
    });

    // Listen for connection status
    socket.on('connect', () => {
      console.log('Real-time sync connected');
    });

    socket.on('disconnect', () => {
      console.log('Real-time sync disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Real-time sync connection error:', error);
    });

    return () => {
      if (socket) {
        socket.emit('leave', `user_${userId}`);
        socket.disconnect();
      }
    };
  }, [userId, userRole]);

  // Register callbacks for different update types
  const registerCallback = (type, callback) => {
    if (callbacksRef.current[type]) {
      callbacksRef.current[type].push(callback);
      
      // Return unregister function
      return () => {
        const index = callbacksRef.current[type].indexOf(callback);
        if (index > -1) {
          callbacksRef.current[type].splice(index, 1);
        }
      };
    }
  };

  // Manual refresh trigger
  const triggerRefresh = (type, data) => {
    if (callbacksRef.current[type]) {
      callbacksRef.current[type].forEach(callback => {
        callback(data);
      });
    }
  };

  return {
    socket: socketRef.current,
    registerCallback,
    triggerRefresh,
    isConnected: socketRef.current?.connected || false
  };
};

export default useRealTimeSync;
