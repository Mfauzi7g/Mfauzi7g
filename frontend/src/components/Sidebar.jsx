import React, { useState, useEffect } from 'react';
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
  MessageCircle,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import { mockSubscriptionData } from '../data/mock';

const Sidebar = ({ selectedChild, children, onSelectChild, activeTab, onTabChange, onUpgrade, isCollapsed, onToggleCollapse }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const menuItems = [
    { id: 'overview', label: t('sidebar.overview'), icon: BarChart3 },
    { id: 'chat', label: t('sidebar.family_chat'), icon: MessageCircle },
    { id: 'family-sharing', label: t('sidebar.family_sharing'), icon: Users },
    { id: 'rewards', label: t('sidebar.tasks_rewards'), icon: Gift },
    { id: 'device-control', label: t('sidebar.device_control'), icon: Radio },
    { id: 'screen-time', label: t('sidebar.screen_time'), icon: Clock },
    { id: 'app-limits', label: t('sidebar.app_limits'), icon: Smartphone },
    { id: 'downtime', label: t('sidebar.downtime'), icon: Shield },
    { id: 'content', label: t('sidebar.content_privacy'), icon: Shield },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggleCollapse}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        h-full flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-50
        ${isCollapsed ? 'w-16' : 'w-80'}
        ${isMobile ? 'fixed left-0 top-0 shadow-lg' : 'relative'}
        ${isMobile && isCollapsed ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{t('app.title')}</h1>
                  <p className="text-sm text-gray-500">{t('app.subtitle')}</p>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <Clock className="w-8 h-8 text-blue-600 mx-auto" />
            )}
            
            <div className="flex items-center space-x-2">
              {!isCollapsed && <LanguageSelector />}
              
              {/* Collapse Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="p-2 hover:bg-gray-100"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <Menu className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </Button>
            </div>
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
                    {child.status === 'active' ? t('sidebar.active') : 
                     child.status === 'downtime' ? t('sidebar.downtime') : t('sidebar.limited')}
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