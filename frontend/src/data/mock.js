// Mock data for Screen Time parental control app

export const mockChildren = [
  {
    id: '1',
    name: 'Emma',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    age: 12,
    deviceName: 'Emma\'s iPhone',
    screenTime: {
      today: { hours: 3, minutes: 45 },
      thisWeek: { hours: 28, minutes: 30 },
      lastWeek: { hours: 32, minutes: 15 }
    },
    status: 'active' // active, downtime, limited
  },
  {
    id: '2',
    name: 'Alex',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    age: 9,
    deviceName: 'Alex\'s iPad',
    screenTime: {
      today: { hours: 2, minutes: 20 },
      thisWeek: { hours: 18, minutes: 45 },
      lastWeek: { hours: 22, minutes: 10 }
    },
    status: 'downtime'
  }
];

export const mockAppUsage = {
  '1': [
    { 
      name: 'Instagram', 
      icon: '📷', 
      category: 'Social', 
      timeSpent: { hours: 1, minutes: 30 },
      limit: { hours: 2, minutes: 0 },
      status: 'within_limit'
    },
    { 
      name: 'TikTok', 
      icon: '🎵', 
      category: 'Entertainment', 
      timeSpent: { hours: 0, minutes: 45 },
      limit: { hours: 1, minutes: 0 },
      status: 'within_limit'
    },
    { 
      name: 'YouTube', 
      icon: '🎬', 
      category: 'Entertainment', 
      timeSpent: { hours: 1, minutes: 15 },
      limit: { hours: 1, minutes: 0 },
      status: 'over_limit'
    },
    { 
      name: 'Messages', 
      icon: '💬', 
      category: 'Communication', 
      timeSpent: { hours: 0, minutes: 15 },
      limit: null,
      status: 'always_allowed'
    }
  ],
  '2': [
    { 
      name: 'Minecraft', 
      icon: '🟫', 
      category: 'Games', 
      timeSpent: { hours: 1, minutes: 20 },
      limit: { hours: 1, minutes: 30 },
      status: 'within_limit'
    },
    { 
      name: 'Khan Academy Kids', 
      icon: '📚', 
      category: 'Education', 
      timeSpent: { hours: 0, minutes: 30 },
      limit: null,
      status: 'always_allowed'
    },
    { 
      name: 'Roblox', 
      icon: '🎮', 
      category: 'Games', 
      timeSpent: { hours: 0, minutes: 30 },
      limit: { hours: 1, minutes: 0 },
      status: 'within_limit'
    }
  ]
};

export const mockWeeklyData = {
  '1': [
    { day: 'Sun', hours: 4.2 },
    { day: 'Mon', hours: 3.8 },
    { day: 'Tue', hours: 4.5 },
    { day: 'Wed', hours: 3.2 },
    { day: 'Thu', hours: 4.8 },
    { day: 'Fri', hours: 5.2 },
    { day: 'Sat', hours: 3.6 }
  ],
  '2': [
    { day: 'Sun', hours: 2.8 },
    { day: 'Mon', hours: 2.2 },
    { day: 'Tue', hours: 3.1 },
    { day: 'Wed', hours: 2.5 },
    { day: 'Thu', hours: 3.4 },
    { day: 'Fri', hours: 3.8 },
    { day: 'Sat', hours: 2.7 }
  ]
};

export const mockDowntimeSchedule = {
  '1': {
    enabled: true,
    schedule: {
      sunday: { start: '21:00', end: '07:00' },
      monday: { start: '21:00', end: '07:00' },
      tuesday: { start: '21:00', end: '07:00' },
      wednesday: { start: '21:00', end: '07:00' },
      thursday: { start: '21:00', end: '07:00' },
      friday: { start: '22:00', end: '08:00' },
      saturday: { start: '22:00', end: '08:00' }
    }
  },
  '2': {
    enabled: true,
    schedule: {
      sunday: { start: '20:00', end: '07:00' },
      monday: { start: '20:00', end: '07:00' },
      tuesday: { start: '20:00', end: '07:00' },
      wednesday: { start: '20:00', end: '07:00' },
      thursday: { start: '20:00', end: '07:00' },
      friday: { start: '21:00', end: '08:00' },
      saturday: { start: '21:00', end: '08:00' }
    }
  }
};

export const mockSubscriptionData = {
  isSubscribed: false,
  plan: null,
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  subscriptionPlans: [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 4.99,
      interval: 'month',
      features: [
        'Unlimited children',
        'App time limits',
        'Downtime scheduling',
        'Content & privacy restrictions',
        'Real-time notifications',
        'Weekly reports'
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 49.99,
      interval: 'year',
      savings: '17% OFF',
      features: [
        'Everything in Monthly',
        'Priority support',
        'Advanced analytics',
        'Family calendar integration'
      ]
    }
  ]
};