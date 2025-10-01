import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Switch
} from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PARENT_DASHBOARD_URL = 'https://your-parent-dashboard.com';

const ChildDashboard = ({ deviceInfo, onLogout }) => {
  const [socket, setSocket] = useState(null);
  const [appLimits, setAppLimits] = useState([]);
  const [downtimeSchedule, setDowntimeSchedule] = useState([]);
  const [currentStatus, setCurrentStatus] = useState('active');
  const [earnedMinutes, setEarnedMinutes] = useState(0);
  const [todayUsage, setTodayUsage] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeSocket();
    loadLocalData();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = async () => {
    const deviceId = await AsyncStorage.getItem('device_id');
    const childId = await AsyncStorage.getItem('child_id');

    const newSocket = io(PARENT_DASHBOARD_URL, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to parent dashboard');
      setIsConnected(true);
      
      // Register this device
      newSocket.emit('device_register', {
        device_id: deviceId,
        child_id: childId
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from parent dashboard');
      setIsConnected(false);
    });

    newSocket.on('execute_command', async (command) => {
      console.log('Received command:', command);
      await handleParentCommand(command);
    });

    setSocket(newSocket);
  };

  const handleParentCommand = async (command) => {
    try {
      switch (command.command) {
        case 'set_app_limits':
          setAppLimits(command.parameters.limits);
          await AsyncStorage.setItem('app_limits', JSON.stringify(command.parameters.limits));
          await enforceAppLimits(command.parameters.limits);
          break;
          
        case 'set_downtime':
          setDowntimeSchedule(command.parameters.schedules);
          await AsyncStorage.setItem('downtime_schedule', JSON.stringify(command.parameters.schedules));
          await enforceDowntime(command.parameters.schedules);
          break;
          
        case 'emergency_unlock':
          await emergencyUnlock(command.parameters.duration_minutes);
          break;
          
        default:
          console.log('Unknown command:', command.command);
      }

      // Confirm command execution
      if (socket) {
        socket.emit('command_executed', {
          command: command.command,
          status: 'success',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error executing command:', error);
      
      if (socket) {
        socket.emit('command_executed', {
          command: command.command,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const enforceAppLimits = async (limits) => {
    // This would integrate with native iOS/Android APIs
    // For iOS: Use Screen Time API
    // For Android: Use Digital Wellbeing API or Device Admin
    
    console.log('Enforcing app limits:', limits);
    
    // Example implementation (pseudocode):
    // for (const limit of limits) {
    //   await NativeScreenTimeModule.setAppLimit(
    //     limit.bundle_id,
    //     limit.daily_limit_minutes * 60
    //   );
    // }
  };

  const enforceDowntime = async (schedules) => {
    console.log('Enforcing downtime:', schedules);
    
    // Example implementation (pseudocode):
    // await NativeScreenTimeModule.setDowntimeSchedule(schedules);
  };

  const emergencyUnlock = async (durationMinutes) => {
    Alert.alert(
      'Emergency Unlock',
      `Your parent has unlocked your device for ${durationMinutes} minutes.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setCurrentStatus('unlocked');
            setTimeout(() => {
              setCurrentStatus('active');
            }, durationMinutes * 60 * 1000);
          }
        }
      ]
    );
  };

  const loadLocalData = async () => {
    try {
      const savedLimits = await AsyncStorage.getItem('app_limits');
      const savedSchedule = await AsyncStorage.getItem('downtime_schedule');
      const savedEarnedMinutes = await AsyncStorage.getItem('earned_minutes');
      
      if (savedLimits) setAppLimits(JSON.parse(savedLimits));
      if (savedSchedule) setDowntimeSchedule(JSON.parse(savedSchedule));
      if (savedEarnedMinutes) setEarnedMinutes(parseInt(savedEarnedMinutes));
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'active': return '#4CAF50';
      case 'restricted': return '#FF9800';
      case 'downtime': return '#F44336';
      case 'unlocked': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'active': return 'Active';
      case 'restricted': return 'App limits active';
      case 'downtime': return 'Downtime - Device restricted';
      case 'unlocked': return 'Emergency unlock active';
      default: return 'Unknown';
    }
  };

  const renderAppLimit = ({ item }) => (
    <View style={styles.appLimitCard}>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.app_name}</Text>
        <Text style={styles.appCategory}>{item.category}</Text>
      </View>
      <View style={styles.limitInfo}>
        <Text style={styles.limitText}>
          {Math.floor(item.daily_limit_minutes / 60)}h {item.daily_limit_minutes % 60}m
        </Text>
        <Text style={styles.limitLabel}>Daily limit</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: getStatusColor() }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Screen Time</Text>
            <Text style={styles.headerSubtitle}>{getStatusText()}</Text>
          </View>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot, 
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Earned Minutes */}
        {earnedMinutes > 0 && (
          <View style={styles.earnedMinutesCard}>
            <Text style={styles.earnedMinutesTitle}>🎉 Bonus Time Available</Text>
            <Text style={styles.earnedMinutesValue}>{earnedMinutes} minutes</Text>
            <Text style={styles.earnedMinutesSubtitle}>Earned by completing tasks</Text>
          </View>
        )}

        {/* App Limits */}
        {appLimits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Limits</Text>
            <FlatList
              data={appLimits}
              renderItem={renderAppLimit}
              keyExtractor={(item) => item.bundle_id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Settings */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Unpair Device',
              'Are you sure you want to unpair this device? You\'ll need a new pairing code to reconnect.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Unpair', 
                  style: 'destructive',
                  onPress: onLogout 
                }
              ]
            );
          }}
        >
          <Text style={styles.logoutText}>Unpair Device</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  connectionText: {
    color: 'white',
    fontSize: 12
  },
  content: {
    flex: 1,
    padding: 24
  },
  earnedMinutesCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center'
  },
  earnedMinutesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8
  },
  earnedMinutesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4
  },
  earnedMinutesSubtitle: {
    fontSize: 14,
    color: '#4CAF50'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16
  },
  appLimitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  appInfo: {
    flex: 1
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  appCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  limitInfo: {
    alignItems: 'flex-end'
  },
  limitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2'
  },
  limitLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto'
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ChildDashboard;