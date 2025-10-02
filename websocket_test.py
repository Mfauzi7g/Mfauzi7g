#!/usr/bin/env python3
"""
WebSocket Connection Testing for Screen Time App
Tests parent-child device pairing and real-time communication
"""

import asyncio
import socketio
import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://screentime-parent.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"
WEBSOCKET_URL = BACKEND_URL

class WebSocketTester:
    def __init__(self):
        self.auth_token = None
        self.child_id = None
        self.pairing_code = None
        self.device_id = None
        self.parent_sio = None
        self.child_sio = None
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success:
            print()
    
    def make_request(self, method: str, endpoint: str, data=None, headers=None):
        """Make HTTP request with proper error handling"""
        url = f"{API_URL}{endpoint}"
        request_headers = headers or {}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def setup_authentication(self):
        """Setup authentication for testing"""
        try:
            # Register a test user
            timestamp = int(time.time())
            user_data = {
                "email": f"websocket_test_{timestamp}@example.com",
                "password": "securepassword123",
                "name": "WebSocket Test Parent"
            }
            
            response = self.make_request("POST", "/auth/register", user_data)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.log_test("Authentication Setup", True, f"User registered: {data.get('user', {}).get('email')}")
                return True
            else:
                self.log_test("Authentication Setup", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Authentication Setup", False, f"Exception: {str(e)}")
            return False
    
    def create_test_child(self):
        """Create a test child for device pairing"""
        try:
            child_data = {
                "name": "WebSocket Test Child",
                "age": 10,
                "device_name": "Test Child's Device",
                "avatar": "👦"
            }
            
            response = self.make_request("POST", "/family/children", child_data)
            if response.status_code == 200:
                data = response.json()
                self.child_id = data.get("id")
                self.log_test("Create Test Child", True, f"Child created: {data.get('name')}, ID: {self.child_id}")
                return True
            else:
                self.log_test("Create Test Child", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Test Child", False, f"Exception: {str(e)}")
            return False
    
    def test_pairing_code_generation(self):
        """Test generating device pairing code"""
        if not self.child_id:
            self.log_test("Generate Pairing Code", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("POST", f"/device-control/pairing-code/{self.child_id}")
            if response.status_code == 200:
                data = response.json()
                self.pairing_code = data.get("code")
                self.log_test("Generate Pairing Code", True, f"Code: {self.pairing_code}, Expires in: {data.get('expires_in_minutes')} minutes")
                return True
            else:
                self.log_test("Generate Pairing Code", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Generate Pairing Code", False, f"Exception: {str(e)}")
            return False
    
    def test_device_pairing(self):
        """Test device pairing with pairing code"""
        if not self.pairing_code:
            self.log_test("Device Pairing", False, "No pairing code available")
            return False
        
        try:
            device_data = {
                "pairing_code": self.pairing_code,
                "device_name": "Test Child Device",
                "platform": "ios",
                "device_identifier": f"test_device_{int(time.time())}",
                "app_version": "1.0.0"
            }
            
            response = self.make_request("POST", "/device-control/pair-device", device_data)
            if response.status_code == 200:
                data = response.json()
                self.device_id = data.get("device_id")
                self.log_test("Device Pairing", True, f"Device paired: {data.get('status')}, Device ID: {self.device_id}")
                return True
            else:
                self.log_test("Device Pairing", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Device Pairing", False, f"Exception: {str(e)}")
            return False
    
    def test_websocket_server_accessibility(self):
        """Test if WebSocket server is accessible"""
        try:
            # Try to connect to WebSocket endpoint
            import urllib.request
            import urllib.error
            
            # Test HTTP endpoint first
            response = self.make_request("GET", "/")
            if response.status_code == 200:
                self.log_test("WebSocket Server HTTP Check", True, f"Backend server is accessible: {response.status_code}")
            else:
                self.log_test("WebSocket Server HTTP Check", False, f"Backend server not accessible: {response.status_code}")
                return False
            
            # Test WebSocket endpoint accessibility (basic connectivity)
            try:
                # This is a basic test to see if the WebSocket port is open
                import socket
                from urllib.parse import urlparse
                
                parsed_url = urlparse(WEBSOCKET_URL)
                host = parsed_url.hostname
                port = parsed_url.port or (443 if parsed_url.scheme == 'https' else 80)
                
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex((host, port))
                sock.close()
                
                if result == 0:
                    self.log_test("WebSocket Port Accessibility", True, f"Port {port} is accessible on {host}")
                    return True
                else:
                    self.log_test("WebSocket Port Accessibility", False, f"Port {port} is not accessible on {host}")
                    return False
                    
            except Exception as e:
                self.log_test("WebSocket Port Accessibility", False, f"Socket test failed: {str(e)}")
                return False
                
        except Exception as e:
            self.log_test("WebSocket Server HTTP Check", False, f"Exception: {str(e)}")
            return False
    
    async def test_parent_websocket_connection(self):
        """Test parent WebSocket connection"""
        try:
            self.parent_sio = socketio.AsyncClient(
                logger=False,
                engineio_logger=False
            )
            
            connection_successful = False
            connection_error = None
            
            @self.parent_sio.event
            async def connect():
                nonlocal connection_successful
                connection_successful = True
                print("   Parent WebSocket connected successfully")
            
            @self.parent_sio.event
            async def connect_error(data):
                nonlocal connection_error
                connection_error = str(data)
                print(f"   Parent WebSocket connection error: {data}")
            
            @self.parent_sio.event
            async def disconnect():
                print("   Parent WebSocket disconnected")
            
            # Try to connect
            try:
                await asyncio.wait_for(
                    self.parent_sio.connect(f"{WEBSOCKET_URL}/socket.io"),
                    timeout=10.0
                )
                
                # Wait a bit to see if connection is established
                await asyncio.sleep(2)
                
                if connection_successful:
                    self.log_test("Parent WebSocket Connection", True, "Successfully connected to WebSocket server")
                    return True
                else:
                    self.log_test("Parent WebSocket Connection", False, f"Connection failed: {connection_error or 'Unknown error'}")
                    return False
                    
            except asyncio.TimeoutError:
                self.log_test("Parent WebSocket Connection", False, "Connection timeout after 10 seconds")
                return False
            except Exception as e:
                self.log_test("Parent WebSocket Connection", False, f"Connection exception: {str(e)}")
                return False
                
        except Exception as e:
            self.log_test("Parent WebSocket Connection", False, f"Setup exception: {str(e)}")
            return False
    
    async def test_child_websocket_connection(self):
        """Test child device WebSocket connection"""
        try:
            self.child_sio = socketio.AsyncClient(
                logger=False,
                engineio_logger=False
            )
            
            connection_successful = False
            registration_confirmed = False
            connection_error = None
            
            @self.child_sio.event
            async def connect():
                nonlocal connection_successful
                connection_successful = True
                print("   Child WebSocket connected successfully")
                
                # Register as a device
                if self.device_id:
                    await self.child_sio.emit('device_register', {
                        'device_id': self.device_id
                    })
            
            @self.child_sio.event
            async def connect_error(data):
                nonlocal connection_error
                connection_error = str(data)
                print(f"   Child WebSocket connection error: {data}")
            
            @self.child_sio.event
            async def registration_confirmed(data):
                nonlocal registration_confirmed
                registration_confirmed = True
                print(f"   Device registration confirmed: {data}")
            
            @self.child_sio.event
            async def execute_command(data):
                print(f"   Child received command: {data}")
                # Acknowledge command execution
                await self.child_sio.emit('command_executed', {
                    'command': data.get('command'),
                    'status': 'executed',
                    'timestamp': datetime.utcnow().isoformat()
                })
            
            @self.child_sio.event
            async def disconnect():
                print("   Child WebSocket disconnected")
            
            # Try to connect
            try:
                await asyncio.wait_for(
                    self.child_sio.connect(f"{WEBSOCKET_URL}/socket.io"),
                    timeout=10.0
                )
                
                # Wait for connection and registration
                await asyncio.sleep(3)
                
                if connection_successful:
                    details = "Successfully connected to WebSocket server"
                    if registration_confirmed:
                        details += " and device registered"
                    self.log_test("Child WebSocket Connection", True, details)
                    return True
                else:
                    self.log_test("Child WebSocket Connection", False, f"Connection failed: {connection_error or 'Unknown error'}")
                    return False
                    
            except asyncio.TimeoutError:
                self.log_test("Child WebSocket Connection", False, "Connection timeout after 10 seconds")
                return False
            except Exception as e:
                self.log_test("Child WebSocket Connection", False, f"Connection exception: {str(e)}")
                return False
                
        except Exception as e:
            self.log_test("Child WebSocket Connection", False, f"Setup exception: {str(e)}")
            return False
    
    async def test_parent_child_communication(self):
        """Test real-time communication between parent and child"""
        if not self.parent_sio or not self.child_sio:
            self.log_test("Parent-Child Communication", False, "WebSocket connections not established")
            return False
        
        try:
            command_received = False
            command_data = None
            
            @self.child_sio.event
            async def execute_command(data):
                nonlocal command_received, command_data
                command_received = True
                command_data = data
                print(f"   Child received command: {data}")
                
                # Acknowledge command execution
                await self.child_sio.emit('command_executed', {
                    'command': data.get('command'),
                    'status': 'executed',
                    'timestamp': datetime.utcnow().isoformat()
                })
            
            # Send a test command from parent to child
            if self.child_id:
                response = self.make_request("POST", f"/device-control/emergency-unlock/{self.child_id}", {
                    "duration_minutes": 5
                })
                
                if response.status_code == 200:
                    # Wait for command to be received
                    await asyncio.sleep(3)
                    
                    if command_received:
                        self.log_test("Parent-Child Communication", True, f"Command successfully sent and received: {command_data.get('command')}")
                        return True
                    else:
                        self.log_test("Parent-Child Communication", False, "Command sent but not received by child device")
                        return False
                else:
                    self.log_test("Parent-Child Communication", False, f"Failed to send command: {response.status_code}")
                    return False
            else:
                self.log_test("Parent-Child Communication", False, "No child ID available for testing")
                return False
                
        except Exception as e:
            self.log_test("Parent-Child Communication", False, f"Exception: {str(e)}")
            return False
    
    async def test_device_status_monitoring(self):
        """Test device status monitoring"""
        if not self.child_id:
            self.log_test("Device Status Monitoring", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/device-control/device-status/{self.child_id}")
            if response.status_code == 200:
                data = response.json()
                total_devices = data.get("total_devices", 0)
                online_devices = data.get("online_devices", 0)
                
                self.log_test("Device Status Monitoring", True, f"Status retrieved: {total_devices} total devices, {online_devices} online")
                return True
            else:
                self.log_test("Device Status Monitoring", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Device Status Monitoring", False, f"Exception: {str(e)}")
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration for WebSocket connections"""
        try:
            # Test preflight request
            headers = {
                'Origin': 'https://screentime-parent.preview.emergentagent.com',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization'
            }
            
            response = requests.options(f"{API_URL}/", headers=headers)
            
            if response.status_code == 200:
                cors_headers = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
                }
                
                self.log_test("CORS Configuration", True, f"CORS headers: {cors_headers}")
                return True
            else:
                self.log_test("CORS Configuration", False, f"Preflight failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Exception: {str(e)}")
            return False
    
    async def cleanup_connections(self):
        """Clean up WebSocket connections"""
        try:
            if self.parent_sio and self.parent_sio.connected:
                await self.parent_sio.disconnect()
            if self.child_sio and self.child_sio.connected:
                await self.child_sio.disconnect()
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    async def run_websocket_tests(self):
        """Run all WebSocket-related tests"""
        print("="*60)
        print("WEBSOCKET CONNECTION DEBUGGING FOR SCREEN TIME APP")
        print("="*60)
        
        # Setup phase
        if not self.setup_authentication():
            return False
        
        if not self.create_test_child():
            return False
        
        # Test 1: WebSocket Server Status
        print("\n1. WEBSOCKET SERVER STATUS:")
        server_accessible = self.test_websocket_server_accessibility()
        
        # Test 2: Device Control API Testing
        print("\n2. DEVICE CONTROL API TESTING:")
        pairing_code_success = self.test_pairing_code_generation()
        device_pairing_success = self.test_device_pairing()
        
        # Test 3: Real-time Communication Testing
        print("\n3. REAL-TIME COMMUNICATION TESTING:")
        parent_connection = await self.test_parent_websocket_connection()
        child_connection = await self.test_child_websocket_connection()
        
        if parent_connection and child_connection:
            communication_success = await self.test_parent_child_communication()
        else:
            communication_success = False
            self.log_test("Parent-Child Communication", False, "WebSocket connections failed")
        
        # Test 4: Network Configuration
        print("\n4. NETWORK CONFIGURATION:")
        cors_success = self.test_cors_configuration()
        
        # Test 5: Database Integration
        print("\n5. DATABASE INTEGRATION:")
        status_monitoring_success = await self.test_device_status_monitoring()
        
        # Cleanup
        await self.cleanup_connections()
        
        # Summary
        print("\n" + "="*60)
        print("WEBSOCKET TESTING SUMMARY:")
        print("="*60)
        
        tests = [
            ("WebSocket Server Accessibility", server_accessible),
            ("Pairing Code Generation", pairing_code_success),
            ("Device Pairing", device_pairing_success),
            ("Parent WebSocket Connection", parent_connection),
            ("Child WebSocket Connection", child_connection),
            ("Parent-Child Communication", communication_success),
            ("CORS Configuration", cors_success),
            ("Device Status Monitoring", status_monitoring_success)
        ]
        
        passed_tests = sum(1 for _, success in tests if success)
        total_tests = len(tests)
        
        for test_name, success in tests:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nOVERALL RESULT: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("🎉 ALL WEBSOCKET TESTS PASSED!")
            return True
        else:
            print("❌ SOME WEBSOCKET TESTS FAILED!")
            
            # Provide specific debugging information
            print("\nDEBUGGING INFORMATION:")
            if not server_accessible:
                print("- WebSocket server may not be running or accessible")
            if not parent_connection or not child_connection:
                print("- WebSocket connections are failing - check CORS settings and server configuration")
            if not communication_success:
                print("- Real-time communication is not working - check WebSocket event handling")
            if not cors_success:
                print("- CORS configuration may be blocking WebSocket connections")
            
            return False

async def main():
    """Main test execution"""
    tester = WebSocketTester()
    return await tester.run_websocket_tests()

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)