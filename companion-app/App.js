import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PairingScreen from './src/PairingScreen';
import ChildDashboard from './src/ChildDashboard';

const App = () => {
  const [isPaired, setIsPaired] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPairingStatus();
  }, []);

  const checkPairingStatus = async () => {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      const childId = await AsyncStorage.getItem('child_id');
      
      if (deviceId && childId) {
        setDeviceInfo({ deviceId, childId });
        setIsPaired(true);
      }
    } catch (error) {
      console.error('Error checking pairing status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaired = (pairingData) => {
    setDeviceInfo(pairingData);
    setIsPaired(true);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'device_id', 
        'child_id', 
        'app_limits', 
        'downtime_schedule',
        'earned_minutes'
      ]);
      setIsPaired(false);
      setDeviceInfo(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return isPaired ? (
    <ChildDashboard 
      deviceInfo={deviceInfo} 
      onLogout={handleLogout} 
    />
  ) : (
    <PairingScreen onPaired={handlePaired} />
  );
};

export default App;