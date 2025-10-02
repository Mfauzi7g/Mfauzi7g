import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  AlertCircle,
  Clock,
  CheckCheck,
  Smile,
  Image as ImageIcon
} from 'lucide-react';
import { chatAPI } from '../services/api';
import { toast } from 'sonner';

const FamilyChat = ({ selectedChild, onUpdate }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickResponses, setQuickResponses] = useState([]);
  const [showQuickResponses, setShowQuickResponses] = useState(false);

  useEffect(() => {
    loadConversations();
    loadQuickResponses();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadMessages(selectedChild.id);
    }
  }, [selectedChild]);

  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const loadMessages = async (childId) => {
    if (!childId) return;
    
    setLoading(true);
    try {
      const data = await chatAPI.getMessages(childId);
      setMessages(data);
      
      // Mark messages as read
      const unreadMessages = data.filter(msg => msg.sender_type === 'child' && msg.status !== 'read');
      if (unreadMessages.length > 0) {
        await chatAPI.markAsRead(unreadMessages.map(msg => msg.id));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadQuickResponses = async () => {
    try {
      const data = await chatAPI.getQuickResponses();
      setQuickResponses(data.parent_responses || []);
    } catch (error) {
      console.error('Error loading quick responses:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChild) return;
    
    try {
      const message = await chatAPI.sendMessage({
        child_id: selectedChild.id,
        content: newMessage.trim(),
        message_type: 'text'
      });
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      loadConversations(); // Update conversation list
      onUpdate?.();
      
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const sendQuickResponse = async (response) => {
    if (!selectedChild) return;
    
    try {
      const message = await chatAPI.sendMessage({
        child_id: selectedChild.id,
        content: response,
        message_type: 'text'
      });
      
      setMessages(prev => [...prev, message]);
      setShowQuickResponses(false);
      loadConversations();
      onUpdate?.();
      
      toast.success('Quick response sent!');
    } catch (error) {
      console.error('Error sending quick response:', error);
      toast.error('Failed to send message');
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessageStatusIcon = (message) => {
    if (message.sender_type === 'parent') {
      switch (message.status) {
        case 'read':
          return <CheckCheck className="w-3 h-3 text-blue-500" />;
        case 'delivered':
          return <CheckCheck className="w-3 h-3 text-gray-400" />;
        default:
          return <Clock className="w-3 h-3 text-gray-400" />;
      }
    }
    return null;
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'emergency_request':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'task_completed':
        return <CheckCheck className="w-4 h-4 text-green-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!selectedChild) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a family member to start chatting</p>
        </div>
      </div>
    );
  }

  const currentConversation = conversations.find(c => c.child_id === selectedChild.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={selectedChild.avatar} alt={selectedChild.name} />
            <AvatarFallback>{selectedChild.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Chat with {selectedChild.name}
            </h2>
            <p className="text-gray-600">Family Communication</p>
          </div>
        </div>
        
        {currentConversation && currentConversation.unread_count > 0 && (
          <Badge className="bg-red-500">
            {currentConversation.unread_count} new
          </Badge>
        )}
      </div>

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        {/* Messages Area */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[450px] p-4">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'parent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender_type === 'parent'
                          ? 'bg-blue-500 text-white'
                          : message.message_type === 'emergency_request'
                          ? 'bg-red-100 border-red-300 border'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {/* Message Type Icon */}
                      {message.message_type !== 'text' && (
                        <div className="flex items-center space-x-2 mb-1">
                          {getMessageTypeIcon(message.message_type)}
                          <span className="text-xs font-medium">
                            {message.message_type === 'emergency_request' && 'Emergency Request'}
                            {message.message_type === 'task_completed' && 'Task Completed'}
                          </span>
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div className="break-words">{message.content}</div>
                      
                      {/* Message Info */}
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        message.sender_type === 'parent' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4 space-y-3">
          {/* Quick Responses */}
          {showQuickResponses && (
            <div className="flex flex-wrap gap-2 pb-2 border-b">
              {quickResponses.slice(0, 6).map((response, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => sendQuickResponse(response)}
                  className="text-xs"
                >
                  {response}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowQuickResponses(!showQuickResponses)}
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Emergency Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span>Emergency Communication</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => sendQuickResponse("Emergency unlock approved - 30 minutes")}
            >
              <Phone className="w-4 h-4" />
              <span>Grant Emergency Access</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => sendQuickResponse("Please call me right now - it's important")}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Request Immediate Call</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyChat;