#!/usr/bin/env python3
"""
Detailed WebSocket debugging for Screen Time app parent-child connection
"""

import socketio
import requests
import time
import json

def test_websocket_connection():
    """Test WebSocket connection with detailed debugging"""
    print("=== WEBSOCKET CONNECTION DEBUGGING ===")
    
    # Test different connection methods
    base_url = "https://screentime-parent.preview.emergentagent.com"
    
    # Method 1: Direct Socket.IO connection
    print("\n1. Testing direct Socket.IO connection...")
    try:
        sio = socketio.SimpleClient(logger=True, engineio_logger=True)
        
        # Try connecting with different transports
        print(f"Connecting to: {base_url}")
        sio.connect(base_url, transports=['websocket', 'polling'])
        
        print("✅ Connection successful!")
        
        # Test basic events
        print("Testing basic events...")
        sio.emit('test_message', {'message': 'Hello from debug client'})
        
        # Wait for response
        try:
            response = sio.receive(timeout=5)
            print(f"Received: {response}")
        except Exception as e:
            print(f"No response received: {e}")
        
        sio.disconnect()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_websocket_with_namespace():
    """Test WebSocket connection with specific namespace"""
    print("\n2. Testing WebSocket with namespace...")
    try:
        sio = socketio.SimpleClient()
        
        # Try with /socket.io namespace
        base_url = "https://screentime-parent.preview.emergentagent.com"
        sio.connect(base_url, namespaces=['/'])
        
        print("✅ Namespace connection successful!")
        
        # Test device registration event
        sio.emit('device_register', {
            'device_id': 'debug_device_123',
            'child_id': 'debug_child_456'
        })
        
        # Test child pairing event
        sio.emit('child_pairing', {
            'child_id': 'debug_child_456',
            'device_name': 'Debug Device'
        })
        
        time.sleep(2)
        sio.disconnect()
        return True
        
    except Exception as e:
        print(f"❌ Namespace connection failed: {e}")
        return False

def test_websocket_upgrade():
    """Test WebSocket upgrade headers"""
    print("\n3. Testing WebSocket upgrade...")
    try:
        headers = {
            'Connection': 'Upgrade',
            'Upgrade': 'websocket',
            'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
            'Sec-WebSocket-Version': '13',
            'Origin': 'https://screentime-parent.preview.emergentagent.com'
        }
        
        response = requests.get(
            'https://screentime-parent.preview.emergentagent.com/socket.io/?EIO=4&transport=websocket',
            headers=headers
        )
        
        print(f"WebSocket upgrade response: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 101:
            print("✅ WebSocket upgrade successful!")
            return True
        else:
            print(f"❌ WebSocket upgrade failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ WebSocket upgrade test failed: {e}")
        return False

def test_socketio_polling():
    """Test Socket.IO polling transport"""
    print("\n4. Testing Socket.IO polling transport...")
    try:
        # Test polling endpoint
        response = requests.get(
            'https://screentime-parent.preview.emergentagent.com/socket.io/?EIO=4&transport=polling'
        )
        
        print(f"Polling response: {response.status_code}")
        print(f"Content: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("✅ Socket.IO polling works!")
            return True
        else:
            print(f"❌ Socket.IO polling failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Socket.IO polling test failed: {e}")
        return False

def test_kubernetes_ingress():
    """Test Kubernetes ingress WebSocket support"""
    print("\n5. Testing Kubernetes ingress WebSocket support...")
    try:
        # Check if ingress supports WebSocket upgrade
        headers = {
            'Connection': 'upgrade',
            'Upgrade': 'websocket',
            'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
            'Sec-WebSocket-Version': '13'
        }
        
        response = requests.get(
            'https://screentime-parent.preview.emergentagent.com/',
            headers=headers,
            allow_redirects=False
        )
        
        print(f"Ingress WebSocket test: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        # Check for WebSocket-specific headers
        upgrade_header = response.headers.get('Upgrade', '').lower()
        connection_header = response.headers.get('Connection', '').lower()
        
        if 'websocket' in upgrade_header and 'upgrade' in connection_header:
            print("✅ Kubernetes ingress supports WebSocket!")
            return True
        else:
            print("❌ Kubernetes ingress may not support WebSocket properly")
            print(f"   Upgrade header: {upgrade_header}")
            print(f"   Connection header: {connection_header}")
            return False
            
    except Exception as e:
        print(f"❌ Kubernetes ingress test failed: {e}")
        return False

def main():
    """Run all WebSocket debugging tests"""
    print("Starting comprehensive WebSocket debugging...")
    
    results = []
    
    # Test 1: Direct connection
    results.append(test_websocket_connection())
    
    # Test 2: Namespace connection
    results.append(test_websocket_with_namespace())
    
    # Test 3: WebSocket upgrade
    results.append(test_websocket_upgrade())
    
    # Test 4: Socket.IO polling
    results.append(test_socketio_polling())
    
    # Test 5: Kubernetes ingress
    results.append(test_kubernetes_ingress())
    
    # Summary
    print("\n" + "="*50)
    print("WEBSOCKET DEBUGGING SUMMARY")
    print("="*50)
    
    test_names = [
        "Direct Socket.IO Connection",
        "Namespace Connection", 
        "WebSocket Upgrade",
        "Socket.IO Polling",
        "Kubernetes Ingress WebSocket Support"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {name}")
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if not results[0] and not results[1]:  # Both connection methods failed
        print("\n🔍 ROOT CAUSE ANALYSIS:")
        print("WebSocket connections are failing, but Socket.IO polling works.")
        print("This indicates a Kubernetes ingress configuration issue.")
        print("\nRECOMMENDED SOLUTION:")
        print("Update Kubernetes ingress with WebSocket support annotations:")
        print("  nginx.ingress.kubernetes.io/proxy-http-version: '1.1'")
        print("  nginx.ingress.kubernetes.io/proxy-set-header-upgrade: '$http_upgrade'")
        print("  nginx.ingress.kubernetes.io/proxy-set-header-connection: 'upgrade'")
        print("  nginx.ingress.kubernetes.io/proxy-read-timeout: '3600'")
        print("  nginx.ingress.kubernetes.io/proxy-send-timeout: '3600'")
        print("  nginx.ingress.kubernetes.io/enable-websocket: 'true'")

if __name__ == "__main__":
    main()