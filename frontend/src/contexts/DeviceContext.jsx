import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const DeviceContext = createContext();

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const DeviceProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(`${BACKEND_URL}`, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to device control server');
    });

    newSocket.on('device_status_update', (data) => {
      setConnectedDevices(prev => 
        prev.map(device => 
          device.deviceId === data.deviceId 
            ? { ...device, ...data }
            : device
        )
      );
    });

    newSocket.on('command_result', (data) => {
      console.log('Command result:', data);
      // Handle command execution results
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const sendCommand = async (childId, command) => {
    if (!socket) return false;
    
    return new Promise((resolve) => {
      socket.emit('send_command', { childId, command }, (response) => {
        resolve(response.success || false);
      });
    });
  };

  const generatePairingCode = async (childId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/device-control/pairing-code/${childId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to generate pairing code');
    const data = await response.json();
    return data.code;
  };

  const getDeviceStatus = async (childId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/device-control/device-status/${childId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to get device status');
    const data = await response.json();
    setConnectedDevices(data.devices);
    return data.devices;
  };

  const setAppLimits = async (childId, limits) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/device-control/set-app-limits/${childId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(limits)
    });
    
    return response.ok;
  };

  const setDowntime = async (childId, schedules) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/device-control/set-downtime/${childId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(schedules)
    });
    
    return response.ok;
  };

  const emergencyUnlock = async (childId, durationMinutes = 30) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/device-control/emergency-unlock/${childId}?duration_minutes=${durationMinutes}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  };

  const value = {
    socket,
    connectedDevices,
    sendCommand,
    generatePairingCode,
    getDeviceStatus,
    setAppLimits,
    setDowntime,
    emergencyUnlock
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};