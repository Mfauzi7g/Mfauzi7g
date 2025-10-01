import React from 'react';
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
import { mockAppUsage, mockWeeklyData } from '../data/mock';

const Overview = ({ selectedChild }) => {
  const childAppUsage = mockAppUsage[selectedChild?.id] || [];
  const weeklyData = mockWeeklyData[selectedChild?.id] || [];
  const todayScreenTime = selectedChild?.screenTime?.today;
  const thisWeekScreenTime = selectedChild?.screenTime?.thisWeek;
  const lastWeekScreenTime = selectedChild?.screenTime?.lastWeek;

  // Calculate weekly change
  const weeklyChange = thisWeekScreenTime && lastWeekScreenTime ? 
    ((thisWeekScreenTime.hours + thisWeekScreenTime.minutes / 60) - 
     (lastWeekScreenTime.hours + lastWeekScreenTime.minutes / 60)) : 0;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {selectedChild.name}'s Screen Time
        </h2>
        <p className="text-gray-600">{selectedChild.deviceName}</p>
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
              {childAppUsage.filter(app => app.status === 'over_limit').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Apps over limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Most Used Apps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Most Used Apps Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {childAppUsage.slice(0, 5).map((app, index) => {
              const totalMinutes = app.timeSpent.hours * 60 + app.timeSpent.minutes;
              const limitMinutes = app.limit ? app.limit.hours * 60 + app.limit.minutes : null;
              const progressPercentage = limitMinutes ? (totalMinutes / limitMinutes) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{app.icon}</div>
                    <div>
                      <p className="font-medium text-gray-900">{app.name}</p>
                      <p className="text-sm text-gray-500">{app.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(app.timeSpent.hours, app.timeSpent.minutes)}
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

      {/* Weekly Chart */}
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
                  style={{ height: `${(day.hours / 6) * 100}%` }}
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
    </div>
  );
};

export default Overview;