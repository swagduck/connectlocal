import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [workerLocation, setWorkerLocation] = useState(null);
  const locationWatchId = useRef(null);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined' && typeof import.meta !== 'undefined') {
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      newSocket.on('connect', () => {
        console.log('🔗 Connected to server');
        setConnected(true);
        
        // Add user to online users
        if (userId) {
          newSocket.emit('add_user', userId);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        setConnected(false);
        
        // Stop location tracking
        if (locationWatchId.current) {
          navigator.geolocation.clearWatch(locationWatchId.current);
          locationWatchId.current = null;
        }
      });

      // Listen for job status updates
      newSocket.on('job_status_update', (data) => {
        console.log('📊 Job status update:', data);
        setJobStatus(data);
        
        // Show browser notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Cập nhật công việc', {
            body: data.message,
            icon: '/favicon.ico'
          });
        }
      });

      // Listen for worker location updates
      newSocket.on('worker_location_update', (data) => {
        console.log('📍 Worker location update:', data);
        setWorkerLocation(data);
      });

      // Listen for job taken notifications
      newSocket.on('job_taken', (data) => {
        console.log('🚫 Job taken by another worker:', data);
        setJobStatus(prev => ({
          ...prev,
          status: 'taken',
          message: 'Công việc đã được nhận bởi thợ khác'
        }));
      });

      setSocket(newSocket);
    } else {
      console.warn('⚠️ Socket.io not available in this environment');
    }
  }, [userId]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Worker accepts job
  const acceptJob = (jobId, workerLocation) => {
    if (socket && userId) {
      socket.emit('job_accepted', {
        jobId,
        workerId: userId,
        customerId: jobStatus?.customerId,
        workerLocation
      });
    }
  };

  // Worker starts job
  const startJob = (jobId) => {
    if (socket && userId) {
      socket.emit('job_started', {
        jobId,
        workerId: userId
      });
    }
  };

  // Worker completes job
  const completeJob = (jobId) => {
    if (socket && userId) {
      socket.emit('job_completed', {
        jobId,
        workerId: userId
      });
    }
  };

  // Start location tracking (for workers)
  const startLocationTracking = (jobId) => {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      return;
    }

    locationWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };

        // Send location update to server
        if (socket && userId) {
          socket.emit('worker_location_update', {
            jobId,
            workerId: userId,
            location
          });
        }
      },
      (error) => {
        console.error('❌ Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  };

  // Get job status
  const getJobStatus = (jobId) => {
    if (socket) {
      socket.emit('get_job_status', { jobId });
    }
  };

  return {
    socket,
    connected,
    jobStatus,
    workerLocation,
    acceptJob,
    startJob,
    completeJob,
    startLocationTracking,
    stopLocationTracking,
    getJobStatus
  };
};

export default useSocket;
