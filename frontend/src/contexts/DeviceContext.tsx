import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface DeviceStatus {
  deviceId: string;
  deviceName: string;
  platform: string;
  isOnline: boolean;
  lastSeen: string;
  currentStatus: string;
}

interface DeviceContextType {
  socket: Socket | null;
  connectedDevices: DeviceStatus[];
  sendCommand: (childId: string, command: any) => Promise<boolean>;
  generatePairingCode: (childId: string) => Promise<string>;
  getDeviceStatus: (childId: string) => Promise<DeviceStatus[]>;
  setAppLimits: (childId: string, limits: any[]) => Promise<boolean>;
  setDowntime: (childId: string, schedules: any[]) => Promise<boolean>;
  emergencyUnlock: (childId: string, durationMinutes?: number) => Promise<boolean>;
}

const DeviceContext = createContext<DeviceContextType | null>(null);

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<DeviceStatus[]>([]);

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

  const sendCommand = async (childId: string, command: any): Promise<boolean> => {
    if (!socket) return false;
    
    return new Promise((resolve) => {
      socket.emit('send_command', { childId, command }, (response: any) => {
        resolve(response.success || false);
      });
    });
  };

  const generatePairingCode = async (childId: string): Promise<string> => {
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

  const getDeviceStatus = async (childId: string): Promise<DeviceStatus[]> => {
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

  const setAppLimits = async (childId: string, limits: any[]): Promise<boolean> => {
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

  const setDowntime = async (childId: string, schedules: any[]): Promise<boolean> => {
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

  const emergencyUnlock = async (childId: string, durationMinutes = 30): Promise<boolean> => {
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