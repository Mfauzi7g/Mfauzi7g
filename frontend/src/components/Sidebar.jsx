import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import LanguageSelector from './LanguageSelector';
import { 
  Clock, 
  Smartphone, 
  Shield, 
  BarChart3, 
  Settings, 
  Crown,
  Users,
  Gift,
  Radio,
  MessageCircle
} from 'lucide-react';
import { mockSubscriptionData } from '../data/mock';

const Sidebar = ({ selectedChild, children, onSelectChild, activeTab, onTabChange, onUpgrade }) => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview'), icon: BarChart3 },
    { id: 'chat', label: t('sidebar.family_chat'), icon: MessageCircle },
    { id: 'rewards', label: t('sidebar.tasks_rewards'), icon: Gift },
    { id: 'device-control', label: t('sidebar.device_control'), icon: Radio },
    { id: 'screen-time', label: t('sidebar.screen_time'), icon: Clock },
    { id: 'app-limits', label: t('sidebar.app_limits'), icon: Smartphone },
    { id: 'downtime', label: t('sidebar.downtime'), icon: Shield },
    { id: 'content', label: t('sidebar.content_privacy'), icon: Shield },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{t('app.title')}</h1>
              <p className="text-sm text-gray-500">{t('app.subtitle')}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </div>

      {/* Subscription Status */}
      {!mockSubscriptionData.isSubscribed && (
        <div className="p-4">
          <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">{t('sidebar.free_trial')}</span>
              </div>
              <p className="text-sm mb-3 opacity-90">
                {Math.ceil((mockSubscriptionData.trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))} {t('sidebar.days_left')}
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full bg-white text-purple-600 hover:bg-gray-50"
                onClick={onUpgrade}
              >
                {t('sidebar.upgrade_now')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Children Selection */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('sidebar.family_members')}</span>
        </div>
        <div className="space-y-2">
          {children.map((child) => (
            <div 
              key={child.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedChild?.id === child.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectChild(child)}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={child.avatar} alt={child.name} />
                  <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {child.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {child.device_name}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <Badge 
                    variant={child.status === 'active' ? 'default' : 
                            child.status === 'downtime' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {child.status === 'active' ? 'Active' : 
                     child.status === 'downtime' ? 'Downtime' : 'Limited'}
                  </Badge>
                  {child.earned_minutes > 0 && (
                    <span className="text-xs text-green-600 mt-1">
                      +{child.earned_minutes}m
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className="w-full justify-start text-left"
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;