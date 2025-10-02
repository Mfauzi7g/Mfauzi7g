import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const WebSocketStatus = () => {
  const [wsStatus, setWsStatus] = useState('checking');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check WebSocket availability
    const checkWebSocket = () => {
      try {
        const testSocket = new WebSocket(`wss://${window.location.host}/socket.io/`);
        
        testSocket.onopen = () => {
          setWsStatus('connected');
          testSocket.close();
        };
        
        testSocket.onerror = () => {
          setWsStatus('unavailable');
        };
        
        testSocket.onclose = () => {
          if (wsStatus === 'checking') {
            setWsStatus('unavailable');
          }
        };
        
        // Timeout after 3 seconds
        setTimeout(() => {
          if (wsStatus === 'checking') {
            setWsStatus('unavailable');
            testSocket.close();
          }
        }, 3000);
        
      } catch (error) {
        setWsStatus('unavailable');
      }
    };

    checkWebSocket();
  }, []);

  if (wsStatus === 'connected') {
    return null; // Don't show anything if WebSocket works
  }

  return (
    <div className="mb-4">
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Real-time Features Limited</p>
                <p className="text-sm text-amber-600">
                  Parent-child device communication requires WebSocket support
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              Demo Mode
            </Badge>
          </div>
          
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <div className="text-sm text-amber-700 space-y-2">
                <p><strong>Available Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>✅ Authentication (Google/Apple/Email)</li>
                  <li>✅ Multi-language support (5 languages)</li>
                  <li>✅ Family sharing and invitations</li>
                  <li>✅ Dashboard and analytics</li>
                  <li>✅ Tasks and rewards management</li>
                </ul>
                <p><strong>Limited Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>⚠️ Real-time parent-child device pairing</li>
                  <li>⚠️ Live family chat messaging</li>
                  <li>⚠️ Instant device control commands</li>
                </ul>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-sm text-amber-600 hover:text-amber-800 underline"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebSocketStatus;