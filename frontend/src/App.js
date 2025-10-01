import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import SubscriptionModal from './components/SubscriptionModal';
import { mockChildren } from './data/mock';

const Dashboard = () => {
  const [selectedChild, setSelectedChild] = useState(mockChildren[0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview selectedChild={selectedChild} />;
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
            <p className="text-gray-600">App settings and preferences...</p>
          </div>
        );
      default:
        return <Overview selectedChild={selectedChild} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        selectedChild={selectedChild}
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

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;