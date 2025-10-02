import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

export const familyAPI = {
  getFamily: async () => {
    const response = await apiClient.get('/family');
    return response.data;
  },
  
  addChild: async (childData) => {
    const response = await apiClient.post('/family/children', childData);
    return response.data;
  },
  
  updateChild: async (childId, updateData) => {
    const response = await apiClient.put(`/family/children/${childId}`, updateData);
    return response.data;
  },
  
  deleteChild: async (childId) => {
    const response = await apiClient.delete(`/family/children/${childId}`);
    return response.data;
  }
};

export const screenTimeAPI = {
  getScreenTime: async (childId) => {
    const response = await apiClient.get(`/screen-time/${childId}`);
    return response.data;
  },
  
  getWeeklyData: async (childId) => {
    const response = await apiClient.get(`/screen-time/${childId}/weekly`);
    return response.data;
  },
  
  getSummary: async (childId) => {
    const response = await apiClient.get(`/screen-time/${childId}/summary`);
    return response.data;
  },
  
  logUsage: async (childId, usageData) => {
    const response = await apiClient.post(`/screen-time/${childId}/usage`, usageData);
    return response.data;
  }
};

export const rewardsAPI = {
  getRewards: async (childId) => {
    const response = await apiClient.get(`/rewards/${childId}`);
    return response.data;
  },
  
  createTask: async (childId, taskData) => {
    const response = await apiClient.post(`/rewards/${childId}/tasks`, taskData);
    return response.data;
  },
  
  completeTask: async (taskId) => {
    const response = await apiClient.put(`/rewards/tasks/${taskId}/complete`);
    return response.data;
  },
  
  approveTask: async (taskId) => {
    const response = await apiClient.put(`/rewards/tasks/${taskId}/approve`);
    return response.data;
  },
  
  rejectTask: async (taskId) => {
    const response = await apiClient.put(`/rewards/tasks/${taskId}/reject`);
    return response.data;
  },
  
  redeemTime: async (childId, minutes) => {
    const response = await apiClient.post(`/rewards/${childId}/redeem`, { minutes_to_redeem: minutes });
    return response.data;
  }
};

// Add chat API functions to services/api.js\n\nexport const chatAPI = {\n  getConversations: async () => {\n    const token = localStorage.getItem('authToken');\n    const response = await fetch(`${API}/chat/conversations`, {\n      headers: {\n        'Authorization': `Bearer ${token}`\n      }\n    });\n    \n    if (!response.ok) throw new Error('Failed to get conversations');\n    return await response.json();\n  },\n  \n  getMessages: async (childId, limit = 50, offset = 0) => {\n    const token = localStorage.getItem('authToken');\n    const response = await fetch(`${API}/chat/messages/${childId}?limit=${limit}&offset=${offset}`, {\n      headers: {\n        'Authorization': `Bearer ${token}`\n      }\n    });\n    \n    if (!response.ok) throw new Error('Failed to get messages');\n    return await response.json();\n  },\n  \n  sendMessage: async (messageData) => {\n    const token = localStorage.getItem('authToken');\n    const response = await fetch(`${API}/chat/send`, {\n      method: 'POST',\n      headers: {\n        'Authorization': `Bearer ${token}`,\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify(messageData)\n    });\n    \n    if (!response.ok) throw new Error('Failed to send message');\n    return await response.json();\n  },\n  \n  markAsRead: async (messageIds) => {\n    const token = localStorage.getItem('authToken');\n    const response = await fetch(`${API}/chat/mark-read`, {\n      method: 'POST',\n      headers: {\n        'Authorization': `Bearer ${token}`,\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify({ message_ids: messageIds })\n    });\n    \n    if (!response.ok) throw new Error('Failed to mark messages as read');\n    return await response.json();\n  },\n  \n  getQuickResponses: async () => {\n    const token = localStorage.getItem('authToken');\n    const response = await fetch(`${API}/chat/quick-responses`, {\n      headers: {\n        'Authorization': `Bearer ${token}`\n      }\n    });\n    \n    if (!response.ok) throw new Error('Failed to get quick responses');\n    return await response.json();\n  },\n  \n  sendEmergencyRequest: async (childId, reason) => {\n    const token = localStorage.getItem('authToken');\n    const response = await fetch(`${API}/chat/emergency-request/${childId}`, {\n      method: 'POST',\n      headers: {\n        'Authorization': `Bearer ${token}`,\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify({ reason })\n    });\n    \n    if (!response.ok) throw new Error('Failed to send emergency request');\n    return await response.json();\n  }\n};