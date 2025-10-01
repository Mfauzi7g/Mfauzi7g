import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Shield, 
  Clock, 
  Plus,
  Unlock,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useDevice } from '../contexts/DeviceContext';
import { toast } from 'sonner';

const DeviceControl = ({ selectedChild, onUpdate }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPairingDialog, setShowPairingDialog] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [appLimits, setAppLimits] = useState([]);
  const [downtimeSchedules, setDowntimeSchedules] = useState([]);
  const [showAppLimitDialog, setShowAppLimitDialog] = useState(false);
  const [showDowntimeDialog, setShowDowntimeDialog] = useState(false);
  const [newAppLimit, setNewAppLimit] = useState({
    app_name: '',
    bundle_id: '',
    daily_limit_minutes: 60,
    category: 'Entertainment'
  });

  const {
    connectedDevices,
    generatePairingCode,
    getDeviceStatus,
    setAppLimits: setDeviceAppLimits,
    setDowntime,
    emergencyUnlock
  } = useDevice();

  useEffect(() => {
    if (selectedChild) {
      loadDeviceStatus();
      loadCurrentSettings();
    }
  }, [selectedChild]);

  const loadDeviceStatus = async () => {
    if (!selectedChild) return;
    
    setLoading(true);
    try {
      const deviceData = await getDeviceStatus(selectedChild.id);
      setDevices(deviceData);
    } catch (error) {
      console.error('Error loading device status:', error);
      toast.error('Failed to load device status');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSettings = async () => {
    // Load current app limits and downtime schedules
    // This would typically come from your existing API
    setAppLimits([
      { app_name: 'TikTok', bundle_id: 'com.zhiliaoapp.musically', daily_limit_minutes: 60, category: 'Entertainment' },
      { app_name: 'Instagram', bundle_id: 'com.burbn.instagram', daily_limit_minutes: 90, category: 'Social' },
      { app_name: 'YouTube', bundle_id: 'com.google.ios.youtube', daily_limit_minutes: 120, category: 'Entertainment' }
    ]);
    
    setDowntimeSchedules([
      { day_of_week: 1, start_hour: 21, start_minute: 0, end_hour: 7, end_minute: 0, enabled: true }, // Monday
      { day_of_week: 2, start_hour: 21, start_minute: 0, end_hour: 7, end_minute: 0, enabled: true }, // Tuesday
      // ... other days
    ]);
  };

  const handleGeneratePairingCode = async () => {
    if (!selectedChild) return;
    
    try {
      const code = await generatePairingCode(selectedChild.id);
      setPairingCode(code);
      setShowPairingDialog(true);
      toast.success('Pairing code generated! Code expires in 15 minutes.');
    } catch (error) {
      console.error('Error generating pairing code:', error);
      toast.error('Failed to generate pairing code');
    }
  };

  const handleSetAppLimit = async () => {
    if (!selectedChild || !newAppLimit.app_name || !newAppLimit.bundle_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const updatedLimits = [...appLimits, newAppLimit];
      await setAppLimits(selectedChild.id, updatedLimits);
      setAppLimits(updatedLimits);
      setNewAppLimit({
        app_name: '',
        bundle_id: '',
        daily_limit_minutes: 60,
        category: 'Entertainment'
      });
      setShowAppLimitDialog(false);
      toast.success(`App limit set for ${newAppLimit.app_name}`);
    } catch (error) {
      console.error('Error setting app limit:', error);
      toast.error('Failed to set app limit');
    }
  };

  const handleEmergencyUnlock = async (durationMinutes = 30) => {
    if (!selectedChild) return;
    
    try {
      await emergencyUnlock(selectedChild.id, durationMinutes);
      toast.success(`Emergency unlock activated for ${durationMinutes} minutes`);
      loadDeviceStatus(); // Refresh device status
    } catch (error) {
      console.error('Error during emergency unlock:', error);
      toast.error('Failed to unlock devices');
    }
  };

  const handleUpdateDowntime = async () => {
    if (!selectedChild) return;
    
    try {
      await setDowntime(selectedChild.id, downtimeSchedules);
      setShowDowntimeDialog(false);
      toast.success('Downtime schedule updated');
    } catch (error) {
      console.error('Error updating downtime:', error);
      toast.error('Failed to update downtime schedule');
    }
  };

  if (!selectedChild) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a family member to manage their devices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedChild.name}'s Devices
          </h2>
          <p className="text-gray-600">Real-time device control and monitoring</p>
        </div>
        <Button 
          onClick={handleGeneratePairingCode}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <QrCode className="w-4 h-4 mr-2" />
          Pair New Device
        </Button>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.length > 0 ? (
          devices.map((device) => (
            <Card key={device.deviceId} className={`${device.isOnline ? 'border-green-200' : 'border-gray-200'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{device.deviceName}</CardTitle>
                  {device.isOnline ? (
                    <Badge variant="default" className="bg-green-500">
                      <Wifi className="w-3 h-3 mr-1" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Platform:</span>
                    <span className="capitalize">{device.platform}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <Badge 
                      variant={device.currentStatus === 'restricted' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {device.currentStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Seen:</span>
                    <span>{new Date(device.lastSeen).toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Paired</h3>
              <p className="text-gray-500 mb-4">
                Pair {selectedChild.name}'s device to start monitoring and controlling screen time.
              </p>
              <Button onClick={handleGeneratePairingCode} className="bg-blue-600 hover:bg-blue-700">
                <QrCode className="w-4 h-4 mr-2" />
                Generate Pairing Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      {devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setShowAppLimitDialog(true)}
            variant="outline"
            className="h-16 flex-col"
          >
            <Shield className="w-5 h-5 mb-1" />
            Set App Limits
          </Button>
          
          <Button
            onClick={() => setShowDowntimeDialog(true)}
            variant="outline"
            className="h-16 flex-col"
          >
            <Clock className="w-5 h-5 mb-1" />
            Schedule Downtime
          </Button>
          
          <Button
            onClick={() => handleEmergencyUnlock(30)}
            variant="outline"
            className="h-16 flex-col text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Unlock className="w-5 h-5 mb-1" />
            Emergency Unlock
          </Button>
          
          <Button
            onClick={loadDeviceStatus}
            variant="outline"
            className="h-16 flex-col"
          >
            <Settings className="w-5 h-5 mb-1" />
            Refresh Status
          </Button>
        </div>
      )}

      {/* Current App Limits */}
      {appLimits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active App Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appLimits.map((limit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{limit.app_name}</p>
                    <p className="text-sm text-gray-500">{limit.category}</p>
                  </div>
                  <Badge variant="outline">
                    {Math.floor(limit.daily_limit_minutes / 60)}h {limit.daily_limit_minutes % 60}m
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pairing Dialog */}
      <Dialog open={showPairingDialog} onOpenChange={setShowPairingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pair {selectedChild.name}'s Device</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="text-6xl font-mono font-bold text-blue-600 mb-4">
              {pairingCode}
            </div>
            <p className="text-gray-600 mb-4">
              Enter this code in the Screen Time app on {selectedChild.name}'s device
            </p>
            <p className="text-sm text-gray-500">
              Code expires in 15 minutes
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* App Limit Dialog */}
      <Dialog open={showAppLimitDialog} onOpenChange={setShowAppLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set App Limit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="app_name">App Name</Label>
              <Input
                id="app_name"
                value={newAppLimit.app_name}
                onChange={(e) => setNewAppLimit({...newAppLimit, app_name: e.target.value})}
                placeholder="e.g., TikTok"
              />
            </div>
            <div>
              <Label htmlFor="bundle_id">Bundle/Package ID</Label>
              <Input
                id="bundle_id"
                value={newAppLimit.bundle_id}
                onChange={(e) => setNewAppLimit({...newAppLimit, bundle_id: e.target.value})}
                placeholder="e.g., com.zhiliaoapp.musically"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newAppLimit.category} onValueChange={(value) => setNewAppLimit({...newAppLimit, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Games">Games</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Productivity">Productivity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="limit">Daily Limit (minutes)</Label>
              <Input
                id="limit"
                type="number"
                min="5"
                max="1440"
                value={newAppLimit.daily_limit_minutes}
                onChange={(e) => setNewAppLimit({...newAppLimit, daily_limit_minutes: parseInt(e.target.value)})}
              />
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAppLimitDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSetAppLimit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Set Limit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceControl;