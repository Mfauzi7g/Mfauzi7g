#!/usr/bin/env python3
"""
Simple Socket.IO test to verify basic functionality
"""

import socketio
import asyncio
import requests

# Test Socket.IO connection to the backend
async def test_socketio_connection():
    print("Testing Socket.IO connection...")
    
    # First test if the backend is accessible
    try:
        response = requests.get("https://guardtime.preview.emergentagent.com/api/")
        print(f"Backend HTTP status: {response.status_code}")
        if response.status_code != 200:
            print("Backend is not accessible")
            return False
    except Exception as e:
        print(f"Backend HTTP test failed: {e}")
        return False
    
    # Test Socket.IO connection
    sio = socketio.AsyncClient(logger=True, engineio_logger=True)
    
    connection_successful = False
    connection_error = None
    
    @sio.event
    async def connect():
        nonlocal connection_successful
        connection_successful = True
        print("✅ Socket.IO connected successfully!")
    
    @sio.event
    async def connect_error(data):
        nonlocal connection_error
        connection_error = str(data)
        print(f"❌ Socket.IO connection error: {data}")
    
    @sio.event
    async def disconnect():
        print("Socket.IO disconnected")
    
    try:
        print("Attempting to connect to Socket.IO server...")
        await asyncio.wait_for(
            sio.connect("https://guardtime.preview.emergentagent.com"),
            timeout=15.0
        )
        
        # Wait a bit to see if connection is established
        await asyncio.sleep(3)
        
        if connection_successful:
            print("✅ Socket.IO connection test PASSED")
            await sio.disconnect()
            return True
        else:
            print(f"❌ Socket.IO connection test FAILED: {connection_error}")
            return False
            
    except asyncio.TimeoutError:
        print("❌ Socket.IO connection timeout")
        return False
    except Exception as e:
        print(f"❌ Socket.IO connection exception: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_socketio_connection())
    print(f"\nFinal result: {'SUCCESS' if result else 'FAILED'}")