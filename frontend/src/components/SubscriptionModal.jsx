import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Crown, X } from 'lucide-react';
import { mockSubscriptionData } from '../data/mock';

const SubscriptionModal = ({ isOpen, onClose, onSubscribe }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (planId) => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onSubscribe(planId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-purple-600" />
              <DialogTitle className="text-2xl font-bold">Upgrade to Premium</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Trial Status */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Free Trial Active</h3>
                <p className="text-sm text-gray-600">
                  {Math.ceil((mockSubscriptionData.trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))} days remaining. 
                  Upgrade now to continue enjoying all features.
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {mockSubscriptionData.subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedPlan === plan.id 
                    ? 'border-purple-500 ring-2 ring-purple-200' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${plan.id === 'yearly' ? 'relative' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.id === 'yearly' && (
                  <Badge className="absolute -top-2 left-4 bg-green-500">
                    {plan.savings}
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedPlan === plan.id 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.id && (
                        <div className="w-full h-full rounded-full bg-white border-2 border-purple-500"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">
                {mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.name}
              </span>
              <span className="font-semibold">
                ${mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.price}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ${mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.price}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Maybe Later
            </Button>
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Start Subscription'
              )}
            </Button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Cancel anytime. No commitments. Your trial will be converted to the selected plan.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;