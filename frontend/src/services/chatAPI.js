// Add chat API functions to existing API service

export const chatAPI = {
  getConversations: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/chat/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to get conversations');
    return await response.json();
  },
  
  getMessages: async (childId, limit = 50, offset = 0) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/chat/messages/${childId}?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to get messages');
    return await response.json();
  },
  
  sendMessage: async (messageData) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    return await response.json();
  },
  
  markAsRead: async (messageIds) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/chat/mark-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message_ids: messageIds })
    });
    
    if (!response.ok) throw new Error('Failed to mark messages as read');
    return await response.json();
  },
  
  getQuickResponses: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/chat/quick-responses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to get quick responses');
    return await response.json();
  },
  
  sendEmergencyRequest: async (childId, reason) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BACKEND_URL}/api/chat/emergency-request/${childId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) throw new Error('Failed to send emergency request');
    return await response.json();
  }
};