import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Clock, 
  Smartphone, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { screenTimeAPI } from '../services/api';
import { toast } from 'sonner';

const Overview = ({ selectedChild }) => {
  const [appUsage, setAppUsage] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      loadScreenTimeData();
    }
  }, [selectedChild]);

  const loadScreenTimeData = async () => {
    if (!selectedChild) return;
    
    setLoading(true);
    try {
      const [apps, weekly, summary] = await Promise.all([
        screenTimeAPI.getScreenTime(selectedChild.id),
        screenTimeAPI.getWeeklyData(selectedChild.id),
        screenTimeAPI.getSummary(selectedChild.id)
      ]);
      
      setAppUsage(apps);
      setWeeklyData(weekly);
      setSummaryData(summary);
    } catch (error) {
      console.error('Error loading screen time data:', error);
      // Show fallback data instead of error for better UX
      setAppUsage([]);
      setWeeklyData([]);
      setSummaryData({ today: { hours: 0, minutes: 0 }, this_week: { hours: 0, minutes: 0 }, last_week: { hours: 0, minutes: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours, minutes) => {
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'over_limit': return 'text-red-600';
      case 'within_limit': return 'text-green-600';
      case 'always_allowed': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'over_limit': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'within_limit': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };

  if (!selectedChild) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a family member to view their screen time</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todayScreenTime = summaryData?.today;
  const thisWeekScreenTime = summaryData?.this_week;
  const lastWeekScreenTime = summaryData?.last_week;

  // Calculate weekly change
  const weeklyChange = thisWeekScreenTime && lastWeekScreenTime ? 
    ((thisWeekScreenTime.hours + thisWeekScreenTime.minutes / 60) - 
     (lastWeekScreenTime.hours + lastWeekScreenTime.minutes / 60)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {selectedChild.name}'s Screen Time
        </h2>
        <p className="text-gray-600">{selectedChild.device_name}</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Today's Screen Time
            </CardTitle>
            <Clock className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(todayScreenTime?.hours || 0, todayScreenTime?.minutes || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Week
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(thisWeekScreenTime?.hours || 0, thisWeekScreenTime?.minutes || 0)}
            </div>
            {weeklyChange !== 0 && (
              <div className="flex items-center text-sm mt-1">
                {weeklyChange > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500 mr-1" />
                )}
                <span className={weeklyChange > 0 ? 'text-red-500' : 'text-green-500'}>
                  {Math.abs(weeklyChange).toFixed(1)}h vs last week
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              App Status
            </CardTitle>
            <Smartphone className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {appUsage.filter(app => app.status === 'over_limit').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Apps over limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Apps */}
      {appUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Most Used Apps Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appUsage.slice(0, 5).map((app, index) => {
                const totalMinutes = app.time_spent.hours * 60 + app.time_spent.minutes;
                const limitMinutes = app.limit ? app.limit.hours * 60 + app.limit.minutes : null;
                const progressPercentage = limitMinutes ? (totalMinutes / limitMinutes) * 100 : 0;
                
                // Get emoji for app
                const getAppEmoji = (appName) => {
                  const emojiMap = {
                    'Instagram': '📷',
                    'TikTok': '🎵',
                    'YouTube': '🎬',
                    'Messages': '💬',
                    'Minecraft': '🟫',
                    'Khan Academy Kids': '📚',
                    'Roblox': '🎮'
                  };
                  return emojiMap[appName] || '📱';
                };
                
                return (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getAppEmoji(app.name)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{app.name}</p>
                        <p className="text-sm text-gray-500">{app.category}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(app.time_spent.hours, app.time_spent.minutes)}
                        </p>
                        {app.limit && (
                          <p className="text-xs text-gray-500">
                            of {formatTime(app.limit.hours, app.limit.minutes)}
                          </p>
                        )}
                      </div>
                      {app.status !== 'always_allowed' && (
                        <div className="w-16">
                          <Progress 
                            value={Math.min(progressPercentage, 100)} 
                            className="h-2"
                          />
                        </div>
                      )}
                      {getStatusIcon(app.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Chart */}
      {weeklyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Weekly Screen Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-32 space-x-2">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                  <div 
                    className="bg-blue-500 rounded-t w-full transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max((day.hours / 6) * 100, 2)}%` }}
                  ></div>
                  <span className="text-xs text-gray-500">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-gray-500">
              <span>0h</span>
              <span>6h</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {appUsage.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Screen Time Data</h3>
            <p className="text-gray-500">
              No app usage recorded for {selectedChild.name} today.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Overview;