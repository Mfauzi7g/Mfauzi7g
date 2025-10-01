import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const PARENT_DASHBOARD_URL = 'https://your-parent-dashboard.com';

const PairingScreen = ({ onPaired }) => {
  const [pairingCode, setPairingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePairing = async () => {
    if (!pairingCode || pairingCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit pairing code');
      return;
    }

    setIsLoading(true);

    try {
      const deviceInfo = {
        pairing_code: pairingCode.toUpperCase(),
        device_name: await DeviceInfo.getDeviceName(),
        platform: Platform.OS,
        device_identifier: await DeviceInfo.getUniqueId(),
        app_version: DeviceInfo.getVersion()
      };

      const response = await fetch(`${PARENT_DASHBOARD_URL}/api/device-control/pair-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deviceInfo)
      });

      if (response.ok) {
        const result = await response.json();
        await AsyncStorage.setItem('device_id', result.device_id);
        await AsyncStorage.setItem('child_id', result.child_id);
        Alert.alert('Success', 'Device paired successfully!');
        onPaired(result);
      } else {
        const error = await response.json();
        Alert.alert('Pairing Failed', error.detail || 'Invalid pairing code');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to parent dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>📱</Text>
          <Text style={styles.title}>Screen Time</Text>
          <Text style={styles.subtitle}>Child Device Setup</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.instructions}>
            Ask your parent for the 6-digit pairing code from their Screen Time dashboard
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter pairing code"
            value={pairingCode}
            onChangeText={setPairingCode}
            maxLength={6}
            autoCapitalize="characters"
            keyboardType="ascii-capable"
          />
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handlePairing}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Pairing...' : 'Pair Device'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This app helps your parents manage your screen time safely.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 48
  },
  logo: {
    fontSize: 64,
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 48
  },
  instructions: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24
  },
  input: {
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: 'white'
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    alignItems: 'center'
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  }
});

export default PairingScreen;