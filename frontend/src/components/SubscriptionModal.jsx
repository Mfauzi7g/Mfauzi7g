import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Crown, X, Calculator } from 'lucide-react';
import { mockSubscriptionData } from '../data/mock';

const SubscriptionModal = ({ isOpen, onClose, onSubscribe, childrenCount = 1 }) => {
  const [selectedPlan, setSelectedPlan] = useState('monthly_per_child');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async (planId) => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onSubscribe(planId);
    onClose();
  };

  const calculatePrice = (planPrice) => {
    return (planPrice * childrenCount).toFixed(2);
  };

  const calculateSavings = (monthlyPrice) => {
    const yearlyTotal = monthlyPrice * 12 * childrenCount;
    const yearlyPlanTotal = 49.99 * childrenCount;
    const savings = yearlyTotal - yearlyPlanTotal;
    return savings.toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-purple-600" />
              <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Pricing Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Per-Child Pricing Model</h3>
                <p className="text-sm text-gray-600">
                  You have {childrenCount} {childrenCount === 1 ? 'child' : 'children'} in your family. 
                  Pricing is $4.99/month or $49.99/year per child.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {childrenCount} × Price = Total
                </span>
              </div>
            </div>
          </div>

          {/* Trial Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Free Trial Active</h3>
                <p className="text-sm text-green-700">
                  {Math.ceil((mockSubscriptionData.trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))} days remaining. 
                  Full access to all features for all children.
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {mockSubscriptionData.subscriptionPlans.map((plan) => {
              const totalPrice = calculatePrice(plan.price);
              const isYearly = plan.interval === 'year';
              
              return (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedPlan === plan.id 
                      ? 'border-purple-500 ring-2 ring-purple-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isYearly ? 'relative' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {isYearly && (
                    <Badge className="absolute -top-2 left-4 bg-green-500">
                      {plan.savings} • Save ${calculateSavings(4.99)}
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
                    
                    {/* Pricing Display */}
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold">${totalPrice}</span>
                        <span className="text-gray-500">/{plan.interval}</span>
                      </div>
                      
                      {childrenCount > 1 && (
                        <div className="text-sm text-gray-600">
                          ${plan.price} per child × {childrenCount} children
                        </div>
                      )}
                      
                      {isYearly && (
                        <div className="text-sm text-green-600 font-medium">
                          Save ${calculateSavings(4.99)} vs monthly billing
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Per-Child Benefits */}
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium text-purple-900 mb-1">
                        Covers {childrenCount === 1 ? 'your child' : `all ${childrenCount} children`}:
                      </div>
                      <div className="text-xs text-purple-700">
                        • Individual device control & monitoring<br />
                        • Separate task & reward systems<br />
                        • Personal family chat conversations<br />
                        • Custom screen time rules per child
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            
            {/* Plan Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  {mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                </span>
                <span className="font-semibold">
                  ${mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.price} per child
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Number of children</span>
                <span className="font-semibold">× {childrenCount}</span>
              </div>
              
              {selectedPlan.includes('yearly') && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Annual discount</span>
                  <span className="font-semibold">-${calculateSavings(4.99)}</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ${calculatePrice(mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.price)}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  /{mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.interval}
                </span>
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
                `Start Subscription - $${calculatePrice(mockSubscriptionData.subscriptionPlans.find(p => p.id === selectedPlan)?.price)}`
              )}
            </Button>
          </div>

          {/* Fine Print */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Cancel anytime. No commitments. Pricing is per child - add or remove children anytime.
            Your trial will be converted to the selected plan.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;