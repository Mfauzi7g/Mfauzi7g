import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import TaskManager from './components/TaskManager';
import SubscriptionModal from './components/SubscriptionModal';
import { familyAPI, screenTimeAPI } from './services/api';

const Dashboard = () => {
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    setLoading(true);
    try {
      const familyData = await familyAPI.getFamily();
      setChildren(familyData);
      if (familyData.length > 0 && !selectedChild) {
        setSelectedChild(familyData[0]);
      } else if (familyData.length === 0) {
        // If there are no children, create sample data
        await createSampleChildren();
      }
    } catch (error) {
      console.error('Error loading family:', error);
      toast.error('Failed to load family data');
      // If there are no children, create sample data
      await createSampleChildren();
    } finally {
      setLoading(false);
    }
  };

  const createSampleChildren = async () => {
    try {
      // Create Emma
      const emma = await familyAPI.addChild({
        name: 'Emma',
        age: 12,
        device_name: 'Emma\'s iPhone',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
      });

      // Create Alex
      const alex = await familyAPI.addChild({
        name: 'Alex',
        age: 9,
        device_name: 'Alex\'s iPad',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
      });

      const newChildren = [emma, alex];
      setChildren(newChildren);
      setSelectedChild(newChildren[0]);

      // Add some sample screen time data
      await addSampleScreenTimeData(emma.id, alex.id);
      
      toast.success('Sample family data created!');
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Failed to create sample data');
    }
  };

  const addSampleScreenTimeData = async (emmaId, alexId) => {
    try {
      // Add some sample data for Emma
      const emmaApps = [
        { app_name: 'Instagram', category: 'Social', minutes_used: 90 },
        { app_name: 'TikTok', category: 'Entertainment', minutes_used: 45 },
        { app_name: 'YouTube', category: 'Entertainment', minutes_used: 75 },
        { app_name: 'Messages', category: 'Communication', minutes_used: 15 }
      ];

      const alexApps = [
        { app_name: 'Minecraft', category: 'Games', minutes_used: 80 },
        { app_name: 'Khan Academy Kids', category: 'Education', minutes_used: 30 },
        { app_name: 'Roblox', category: 'Games', minutes_used: 30 }
      ];

      for (const app of emmaApps) {
        await screenTimeAPI.logUsage(emmaId, app);
      }

      for (const app of alexApps) {
        await screenTimeAPI.logUsage(alexId, app);
      }
    } catch (error) {
      console.error('Error adding sample screen time data:', error);
    }
  };

  const handleSelectChild = (child) => {
    setSelectedChild(child);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleSubscribe = (planId) => {
    toast.success(`Successfully subscribed to ${planId} plan!`);
    // Here you would handle the actual subscription logic
  };

  const handleTaskUpdate = () => {
    // Refresh child data when tasks are updated
    loadFamily();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview selectedChild={selectedChild} />;
      case 'rewards':
        return <TaskManager selectedChild={selectedChild} onTaskUpdate={handleTaskUpdate} />;
      case 'screen-time':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Screen Time Details</h2>
            <p className="text-gray-600">Detailed screen time analytics and controls coming soon...</p>
          </div>
        );
      case 'app-limits':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">App Limits</h2>
            <p className="text-gray-600">Set time limits for specific apps and categories...</p>
          </div>
        );
      case 'downtime':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Downtime</h2>
            <p className="text-gray-600">Schedule downtime periods when device usage is limited...</p>
          </div>
        );
      case 'content':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Content & Privacy</h2>
            <p className="text-gray-600">Manage content restrictions and privacy settings...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Account</h3>
                  <p className="text-sm text-gray-500">{user?.name} ({user?.email})</p>
                </div>
                <button 
                  onClick={logout}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <Overview selectedChild={selectedChild} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        selectedChild={selectedChild}
        children={children}
        onSelectChild={handleSelectChild}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onUpgrade={handleUpgrade}
      />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>

      <SubscriptionModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSubscribe={handleSubscribe}
      />

      <Toaster position="top-right" />
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <AuthPage />;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;