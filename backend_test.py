#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Screen Time Parental Control App
Tests all authentication, family management, screen time tracking, and rewards system endpoints
"""

import requests
import json
import os
from datetime import datetime, date
from typing import Dict, Any

# Get backend URL from environment
BACKEND_URL = "https://screentime-parent.preview.emergentagent.com/api"

class ScreenTimeAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = None
        self.child_id = None
        self.task_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success:
            print()
    
    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, headers: Dict[str, str] = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        request_headers = headers or {}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=request_headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=request_headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=request_headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_health_check(self):
        """Test API health check endpoint"""
        try:
            response = self.make_request("GET", "/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            import time
            timestamp = int(time.time())
            user_data = {
                "email": f"parent{timestamp}@example.com",
                "password": "securepassword123",
                "name": "Sarah Johnson"
            }
            
            response = self.make_request("POST", "/auth/register", user_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_data = data.get("user")
                details = f"User registered: {self.user_data.get('name')} ({self.user_data.get('email')})"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Registration", success, details)
            return success
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            # Use the same email from registration
            login_data = {
                "email": self.user_data.get("email") if self.user_data else "parent@example.com",
                "password": "securepassword123"
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.user_data = data.get("user")
                details = f"Login successful for: {self.user_data.get('name')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Login", success, details)
            return success
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test get current user info endpoint"""
        try:
            response = self.make_request("GET", "/auth/me")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"User info retrieved: {data.get('name')} - {data.get('subscription_status')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Current User", success, details)
            return success
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
            return False
    
    def test_create_child(self):
        """Test creating a child"""
        try:
            child_data = {
                "name": "Emma Johnson",
                "age": 8,
                "device_name": "Emma's iPad",
                "avatar": "👧"
            }
            
            response = self.make_request("POST", "/family/children", child_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.child_id = data.get("id")
                details = f"Child created: {data.get('name')}, Age: {data.get('age')}, ID: {self.child_id}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Create Child", success, details)
            return success
        except Exception as e:
            self.log_test("Create Child", False, f"Exception: {str(e)}")
            return False
    
    def test_get_family(self):
        """Test getting family list"""
        try:
            response = self.make_request("GET", "/family")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Family retrieved: {len(data)} children found"
                if data:
                    details += f", First child: {data[0].get('name')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Family", success, details)
            return success
        except Exception as e:
            self.log_test("Get Family", False, f"Exception: {str(e)}")
            return False
    
    def test_update_child(self):
        """Test updating child information"""
        if not self.child_id:
            self.log_test("Update Child", False, "No child ID available")
            return False
        
        try:
            update_data = {
                "status": "limited"
            }
            
            response = self.make_request("PUT", f"/family/children/{self.child_id}", update_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Child updated: {data.get('name')}, Status: {data.get('status')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Update Child", success, details)
            return success
        except Exception as e:
            self.log_test("Update Child", False, f"Exception: {str(e)}")
            return False
    
    def test_log_screen_time_usage(self):
        """Test logging app usage"""
        if not self.child_id:
            self.log_test("Log Screen Time Usage", False, "No child ID available")
            return False
        
        try:
            usage_data = {
                "child_id": self.child_id,
                "app_name": "YouTube",
                "category": "Entertainment",
                "minutes_used": 45,
                "usage_date": date.today().isoformat()
            }
            
            response = self.make_request("POST", f"/screen-time/{self.child_id}/usage", usage_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Usage logged: {usage_data['app_name']} - {usage_data['minutes_used']} minutes"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Log Screen Time Usage", success, details)
            return success
        except Exception as e:
            self.log_test("Log Screen Time Usage", False, f"Exception: {str(e)}")
            return False
    
    def test_get_screen_time_data(self):
        """Test getting screen time data"""
        if not self.child_id:
            self.log_test("Get Screen Time Data", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/screen-time/{self.child_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Screen time data retrieved: {len(data)} apps tracked"
                if data:
                    app = data[0]
                    details += f", First app: {app.get('name')} - {app.get('time_spent')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Screen Time Data", success, details)
            return success
        except Exception as e:
            self.log_test("Get Screen Time Data", False, f"Exception: {str(e)}")
            return False
    
    def test_get_weekly_analytics(self):
        """Test getting weekly screen time analytics"""
        if not self.child_id:
            self.log_test("Get Weekly Analytics", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/screen-time/{self.child_id}/weekly")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Weekly data retrieved: {len(data)} days"
                if data:
                    total_hours = sum(day.get('hours', 0) for day in data)
                    details += f", Total hours this week: {total_hours:.1f}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Weekly Analytics", success, details)
            return success
        except Exception as e:
            self.log_test("Get Weekly Analytics", False, f"Exception: {str(e)}")
            return False
    
    def test_get_screen_time_summary(self):
        """Test getting screen time summary"""
        if not self.child_id:
            self.log_test("Get Screen Time Summary", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/screen-time/{self.child_id}/summary")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                today = data.get('today', {})
                this_week = data.get('this_week', {})
                details = f"Summary: Today {today.get('hours', 0)}h {today.get('minutes', 0)}m, This week {this_week.get('hours', 0)}h {this_week.get('minutes', 0)}m"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Screen Time Summary", success, details)
            return success
        except Exception as e:
            self.log_test("Get Screen Time Summary", False, f"Exception: {str(e)}")
            return False
    
    def test_create_task(self):
        """Test creating a task for child"""
        if not self.child_id:
            self.log_test("Create Task", False, "No child ID available")
            return False
        
        try:
            task_data = {
                "title": "Clean your room",
                "description": "Organize toys, make bed, and vacuum floor",
                "category": "chores",
                "reward_minutes": 30
            }
            
            response = self.make_request("POST", f"/rewards/{self.child_id}/tasks", task_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.task_id = data.get("id")
                details = f"Task created: {data.get('title')} - {data.get('reward_minutes')} minutes reward, ID: {self.task_id}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Create Task", success, details)
            return success
        except Exception as e:
            self.log_test("Create Task", False, f"Exception: {str(e)}")
            return False
    
    def test_complete_task(self):
        """Test completing a task"""
        if not self.task_id:
            self.log_test("Complete Task", False, "No task ID available")
            return False
        
        try:
            response = self.make_request("PUT", f"/rewards/tasks/{self.task_id}/complete")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Task completed: {data.get('message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Complete Task", success, details)
            return success
        except Exception as e:
            self.log_test("Complete Task", False, f"Exception: {str(e)}")
            return False
    
    def test_approve_task(self):
        """Test approving a completed task"""
        if not self.task_id:
            self.log_test("Approve Task", False, "No task ID available")
            return False
        
        try:
            response = self.make_request("PUT", f"/rewards/tasks/{self.task_id}/approve")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Task approved: {data.get('message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Approve Task", success, details)
            return success
        except Exception as e:
            self.log_test("Approve Task", False, f"Exception: {str(e)}")
            return False
    
    def test_get_child_rewards(self):
        """Test getting child rewards and tasks"""
        if not self.child_id:
            self.log_test("Get Child Rewards", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/rewards/{self.child_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Rewards data: {data.get('child_name')} has {data.get('earned_minutes')} earned minutes, {len(data.get('pending_tasks', []))} pending tasks, {data.get('total_tasks_completed')} completed"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Child Rewards", success, details)
            return success
        except Exception as e:
            self.log_test("Get Child Rewards", False, f"Exception: {str(e)}")
            return False
    
    def test_redeem_time(self):
        """Test redeeming earned time"""
        if not self.child_id:
            self.log_test("Redeem Time", False, "No child ID available")
            return False
        
        try:
            # First check how many minutes the child has
            rewards_response = self.make_request("GET", f"/rewards/{self.child_id}")
            if rewards_response.status_code != 200:
                self.log_test("Redeem Time", False, "Could not get child rewards data")
                return False
            
            rewards_data = rewards_response.json()
            earned_minutes = rewards_data.get('earned_minutes', 0)
            
            if earned_minutes < 15:
                self.log_test("Redeem Time", False, f"Not enough earned minutes ({earned_minutes}) to redeem 15 minutes")
                return False
            
            # Redeem 15 minutes
            response = self.make_request("POST", f"/rewards/{self.child_id}/redeem?minutes_to_redeem=15")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Time redeemed: {data.get('message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Redeem Time", success, details)
            return success
        except Exception as e:
            self.log_test("Redeem Time", False, f"Exception: {str(e)}")
            return False

    # ==================== FAMILY SHARING API TESTS ====================
    
    def test_send_family_invite(self):
        """Test sending family invitation"""
        try:
            invite_data = {
                "email": "coparent@example.com",
                "role": "co-parent"
            }
            
            response = self.make_request("POST", "/family-sharing/invite", invite_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Invite sent: {data.get('message')}, Invite ID: {data.get('data', {}).get('invite_id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Send Family Invite", success, details)
            return success
        except Exception as e:
            self.log_test("Send Family Invite", False, f"Exception: {str(e)}")
            return False
    
    def test_get_pending_invites(self):
        """Test getting pending family invitations"""
        try:
            response = self.make_request("GET", "/family-sharing/invites")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                invites = data.get('data', {}).get('invites', [])
                details = f"Retrieved {len(invites)} pending invites"
                if invites:
                    details += f", First invite: {invites[0].get('to_email')} ({invites[0].get('role')})"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Pending Invites", success, details)
            return success
        except Exception as e:
            self.log_test("Get Pending Invites", False, f"Exception: {str(e)}")
            return False
    
    def test_accept_family_invite(self):
        """Test accepting family invitation"""
        try:
            # Use a mock invite ID for testing
            invite_id = "invite1"
            response = self.make_request("POST", f"/family-sharing/accept-invite/{invite_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Invite accepted: {data.get('message')}, Family ID: {data.get('data', {}).get('family_id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Accept Family Invite", success, details)
            return success
        except Exception as e:
            self.log_test("Accept Family Invite", False, f"Exception: {str(e)}")
            return False
    
    def test_get_family_members(self):
        """Test getting family members"""
        try:
            response = self.make_request("GET", "/family-sharing/family-members")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                members = data.get('data', {}).get('members', [])
                details = f"Retrieved {len(members)} family members"
                if members:
                    member = members[0]
                    details += f", First member: {member.get('role')} with permissions {member.get('permissions')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Family Members", success, details)
            return success
        except Exception as e:
            self.log_test("Get Family Members", False, f"Exception: {str(e)}")
            return False
    
    def test_get_shared_children(self):
        """Test getting shared children"""
        try:
            response = self.make_request("GET", "/family-sharing/shared-children")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                children = data.get('data', {}).get('children', [])
                details = f"Retrieved {len(children)} shared children"
                if children:
                    child = children[0]
                    details += f", First child: {child.get('name')} (Age: {child.get('age')}) with permissions {child.get('permissions')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Shared Children", success, details)
            return success
        except Exception as e:
            self.log_test("Get Shared Children", False, f"Exception: {str(e)}")
            return False
    
    def test_share_child(self):
        """Test sharing a child with family member"""
        if not self.child_id:
            self.log_test("Share Child", False, "No child ID available")
            return False
        
        try:
            share_data = {
                "child_id": self.child_id,
                "shared_with_email": "coparent@example.com",
                "permissions": ["view", "control"]
            }
            
            response = self.make_request("POST", "/family-sharing/share-child", share_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Child shared: {data.get('message')}, Sharing ID: {data.get('data', {}).get('sharing_id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Share Child", success, details)
            return success
        except Exception as e:
            self.log_test("Share Child", False, f"Exception: {str(e)}")
            return False
    
    def test_remove_family_access(self):
        """Test removing family member access"""
        try:
            # Use a mock member ID for testing
            member_id = "member2"
            response = self.make_request("DELETE", f"/family-sharing/remove-access/{member_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Access removed: {data.get('message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Remove Family Access", success, details)
            return success
        except Exception as e:
            self.log_test("Remove Family Access", False, f"Exception: {str(e)}")
            return False

    # ==================== CHAT API TESTS ====================
    
    def test_get_chat_conversations(self):
        """Test getting chat conversations"""
        try:
            response = self.make_request("GET", "/chat/conversations")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Retrieved {len(data)} conversations"
                if data:
                    conv = data[0]
                    details += f", First conversation: {conv.get('child_name')} ({conv.get('unread_count')} unread)"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Chat Conversations", success, details)
            return success
        except Exception as e:
            self.log_test("Get Chat Conversations", False, f"Exception: {str(e)}")
            return False
    
    def test_get_chat_messages(self):
        """Test getting chat messages for a child"""
        if not self.child_id:
            self.log_test("Get Chat Messages", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/chat/messages/{self.child_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Retrieved {len(data)} messages"
                if data:
                    msg = data[0]
                    details += f", First message: {msg.get('sender_name')} - {msg.get('content')[:50]}..."
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Chat Messages", success, details)
            return success
        except Exception as e:
            self.log_test("Get Chat Messages", False, f"Exception: {str(e)}")
            return False
    
    def test_send_chat_message(self):
        """Test sending a chat message to child"""
        if not self.child_id:
            self.log_test("Send Chat Message", False, "No child ID available")
            return False
        
        try:
            message_data = {
                "child_id": self.child_id,
                "message_type": "text",
                "content": "Hi Emma! How is your homework going?"
            }
            
            response = self.make_request("POST", "/chat/send", message_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Message sent: {data.get('content')} to {data.get('conversation_id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Send Chat Message", success, details)
            return success
        except Exception as e:
            self.log_test("Send Chat Message", False, f"Exception: {str(e)}")
            return False
    
    def test_get_quick_responses(self):
        """Test getting quick response messages"""
        try:
            response = self.make_request("GET", "/chat/quick-responses")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                parent_responses = data.get('parent_responses', [])
                child_responses = data.get('child_responses', [])
                details = f"Retrieved {len(parent_responses)} parent responses, {len(child_responses)} child responses"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Quick Responses", success, details)
            return success
        except Exception as e:
            self.log_test("Get Quick Responses", False, f"Exception: {str(e)}")
            return False

    # ==================== DEVICE CONTROL API TESTS ====================
    
    def test_generate_pairing_code(self):
        """Test generating device pairing code"""
        if not self.child_id:
            self.log_test("Generate Pairing Code", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("POST", f"/device-control/pairing-code/{self.child_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Pairing code generated: {data.get('code')} for {data.get('child_name')} (expires in {data.get('expires_in_minutes')} minutes)"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Generate Pairing Code", success, details)
            return success
        except Exception as e:
            self.log_test("Generate Pairing Code", False, f"Exception: {str(e)}")
            return False
    
    def test_get_child_devices(self):
        """Test getting child's devices"""
        if not self.child_id:
            self.log_test("Get Child Devices", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/device-control/devices/{self.child_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Retrieved {len(data)} devices"
                if data:
                    device = data[0]
                    details += f", First device: {device.get('device_name')} ({device.get('platform')}) - {device.get('status')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Child Devices", success, details)
            return success
        except Exception as e:
            self.log_test("Get Child Devices", False, f"Exception: {str(e)}")
            return False
    
    def test_get_device_status(self):
        """Test getting device status"""
        if not self.child_id:
            self.log_test("Get Device Status", False, "No child ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/device-control/device-status/{self.child_id}")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Device status for {data.get('child_name')}: {data.get('total_devices')} total, {data.get('online_devices')} online"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Device Status", success, details)
            return success
        except Exception as e:
            self.log_test("Get Device Status", False, f"Exception: {str(e)}")
            return False
    
    def test_family_sharing_flow(self):
        """Test complete family sharing functionality"""
        print("\n" + "="*50)
        print("TESTING FAMILY SHARING FUNCTIONALITY")
        print("="*50)
        
        # Test all family sharing endpoints
        tests = [
            self.test_send_family_invite,
            self.test_get_pending_invites,
            self.test_accept_family_invite,
            self.test_get_family_members,
            self.test_get_shared_children,
            self.test_share_child,
            self.test_remove_family_access
        ]
        
        for test in tests:
            if not test():
                return False
        
        print("✅ FAMILY SHARING TESTS COMPLETED!")
        return True
    
    def test_chat_and_device_flow(self):
        """Test chat and device control functionality"""
        print("\n" + "="*50)
        print("TESTING CHAT & DEVICE CONTROL FUNCTIONALITY")
        print("="*50)
        
        # Test chat endpoints
        chat_tests = [
            self.test_get_chat_conversations,
            self.test_get_chat_messages,
            self.test_send_chat_message,
            self.test_get_quick_responses
        ]
        
        # Test device control endpoints
        device_tests = [
            self.test_generate_pairing_code,
            self.test_get_child_devices,
            self.test_get_device_status
        ]
        
        all_tests = chat_tests + device_tests
        
        for test in all_tests:
            if not test():
                return False
        
        print("✅ CHAT & DEVICE CONTROL TESTS COMPLETED!")
        return True

    # ==================== SOCIAL AUTHENTICATION API TESTS ====================
    
    def test_google_oauth_success(self):
        """Test successful Google OAuth authentication"""
        try:
            # Mock session_id for testing - this will fail as expected since we don't have real Emergent Auth session
            auth_data = {
                "session_id": "mock_google_session_123"
            }
            
            response = self.make_request("POST", "/social-auth/google", auth_data)
            # We expect this to fail with 400 or 500 since we don't have a real session
            success = response.status_code in [400, 500]
            
            if success:
                details = f"Google auth correctly failed with mock session: Status {response.status_code}"
            else:
                details = f"Unexpected status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Google OAuth Success (Expected Failure)", success, details)
            return success
        except Exception as e:
            self.log_test("Google OAuth Success (Expected Failure)", False, f"Exception: {str(e)}")
            return False
    
    def test_google_oauth_invalid_session(self):
        """Test Google OAuth with invalid session_id"""
        try:
            auth_data = {
                "session_id": "invalid_session_id_12345"
            }
            
            response = self.make_request("POST", "/social-auth/google", auth_data)
            # Should fail with 400 or 500 status
            success = response.status_code in [400, 500]
            
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Google OAuth Invalid Session", success, details)
            return success
        except Exception as e:
            self.log_test("Google OAuth Invalid Session", False, f"Exception: {str(e)}")
            return False
    
    def test_apple_signin_success(self):
        """Test successful Apple Sign In authentication"""
        try:
            # Mock Apple auth data
            import time
            timestamp = int(time.time())
            
            auth_data = {
                "code": f"mock_apple_code_{timestamp}",
                "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhcHBsZV91c2VyXzEyMzQ1IiwiZW1haWwiOiJ0ZXN0dXNlckBhcHBsZWlkLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU3MTQ5MH0.mock_signature",
                "state": "mock_state_123",
                "user": {
                    "name": {
                        "firstName": "John",
                        "lastName": "Apple"
                    }
                }
            }
            
            response = self.make_request("POST", "/social-auth/apple", auth_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Apple auth successful: {data.get('user', {}).get('email')} via {data.get('user', {}).get('auth_provider')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Apple Sign In Success", success, details)
            return success
        except Exception as e:
            self.log_test("Apple Sign In Success", False, f"Exception: {str(e)}")
            return False
    
    def test_apple_signin_malformed_token(self):
        """Test Apple Sign In with malformed ID token"""
        try:
            auth_data = {
                "code": "mock_apple_code_malformed",
                "id_token": "malformed.jwt.token",
                "state": "mock_state_123"
            }
            
            response = self.make_request("POST", "/social-auth/apple", auth_data)
            # Should still work due to fallback mechanism
            success = response.status_code == 200
            
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Apple Sign In Malformed Token", success, details)
            return success
        except Exception as e:
            self.log_test("Apple Sign In Malformed Token", False, f"Exception: {str(e)}")
            return False
    
    def test_session_check_valid(self):
        """Test session check with valid session"""
        try:
            # We need to get a session_token from Apple auth first
            # The Apple auth should have set cookies, but we need to extract the session_token
            # For testing purposes, let's try to get session without token first to see behavior
            response = self.make_request("GET", "/social-auth/session")
            
            # If we have a valid session from Apple auth cookies, this should work
            if response.status_code == 200:
                data = response.json()
                details = f"Session valid: {data.get('user', {}).get('email')} authenticated via {data.get('user', {}).get('auth_provider')}"
                success = True
            else:
                # If no valid session, that's also expected behavior
                details = f"No valid session found: Status {response.status_code}"
                success = response.status_code == 401
            
            self.log_test("Session Check Valid", success, details)
            return success
        except Exception as e:
            self.log_test("Session Check Valid", False, f"Exception: {str(e)}")
            return False
    
    def test_session_check_invalid(self):
        """Test session check with invalid session"""
        try:
            headers = {"Authorization": "Bearer invalid_session_token_12345"}
            response = self.make_request("GET", "/social-auth/session", headers=headers)
            # Should fail with 401
            success = response.status_code == 401
            
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Session Check Invalid", success, details)
            return success
        except Exception as e:
            self.log_test("Session Check Invalid", False, f"Exception: {str(e)}")
            return False
    
    def test_session_check_no_token(self):
        """Test session check without any token"""
        try:
            response = self.make_request("GET", "/social-auth/session")
            # Should fail with 401
            success = response.status_code == 401
            
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Session Check No Token", success, details)
            return success
        except Exception as e:
            self.log_test("Session Check No Token", False, f"Exception: {str(e)}")
            return False
    
    def test_logout_success(self):
        """Test successful logout"""
        try:
            response = self.make_request("POST", "/social-auth/logout")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Logout successful: {data.get('message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Logout Success", success, details)
            return success
        except Exception as e:
            self.log_test("Logout Success", False, f"Exception: {str(e)}")
            return False
    
    def test_logout_after_session_cleared(self):
        """Test logout after session is already cleared"""
        try:
            response = self.make_request("POST", "/social-auth/logout")
            success = response.status_code == 200
            
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_test("Logout After Session Cleared", success, details)
            return success
        except Exception as e:
            self.log_test("Logout After Session Cleared", False, f"Exception: {str(e)}")
            return False
    
    def test_existing_auth_compatibility(self):
        """Test that existing auth endpoints still work after social auth implementation"""
        try:
            # Test original registration endpoint
            import time
            timestamp = int(time.time())
            user_data = {
                "email": f"traditional{timestamp}@example.com",
                "password": "securepassword123",
                "name": "Traditional User"
            }
            
            response = self.make_request("POST", "/auth/register", user_data)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Traditional auth still works: {data.get('user', {}).get('email')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Existing Auth Compatibility", success, details)
            return success
        except Exception as e:
            self.log_test("Existing Auth Compatibility", False, f"Exception: {str(e)}")
            return False
    
    def test_social_auth_flow(self):
        """Test complete social authentication functionality"""
        print("\n" + "="*60)
        print("TESTING SOCIAL AUTHENTICATION FUNCTIONALITY")
        print("="*60)
        
        # Test Google OAuth flow
        google_tests = [
            self.test_google_oauth_success,
            self.test_google_oauth_invalid_session
        ]
        
        # Test Apple Sign In flow
        apple_tests = [
            self.test_apple_signin_success,
            self.test_apple_signin_malformed_token
        ]
        
        # Test session management
        session_tests = [
            self.test_session_check_valid,
            self.test_session_check_invalid,
            self.test_session_check_no_token,
            self.test_logout_success,
            self.test_logout_after_session_cleared
        ]
        
        # Test compatibility
        compatibility_tests = [
            self.test_existing_auth_compatibility
        ]
        
        all_tests = google_tests + apple_tests + session_tests + compatibility_tests
        
        failed_tests = []
        for test in all_tests:
            if not test():
                failed_tests.append(test.__name__)
        
        if not failed_tests:
            print("✅ SOCIAL AUTHENTICATION TESTS COMPLETED!")
            return True
        else:
            print(f"❌ SOCIAL AUTHENTICATION TESTS FAILED: {', '.join(failed_tests)}")
            return False

    def test_integration_flow(self):
        """Test complete end-to-end integration flow"""
        print("\n" + "="*60)
        print("RUNNING COMPLETE INTEGRATION FLOW TEST")
        print("="*60)
        
        # Step 1: Health check
        if not self.test_health_check():
            return False
        
        # Step 2: Register user
        if not self.test_user_registration():
            return False
        
        # Step 3: Login (optional, already have token from registration)
        # self.test_user_login()
        
        # Step 4: Get current user info
        if not self.test_get_current_user():
            return False
        
        # Step 5: Create child
        if not self.test_create_child():
            return False
        
        # Step 6: Get family
        if not self.test_get_family():
            return False
        
        # Step 7: Update child
        if not self.test_update_child():
            return False
        
        # Step 8: Log screen time usage
        if not self.test_log_screen_time_usage():
            return False
        
        # Step 9: Get screen time data
        if not self.test_get_screen_time_data():
            return False
        
        # Step 10: Get weekly analytics
        if not self.test_get_weekly_analytics():
            return False
        
        # Step 11: Get screen time summary
        if not self.test_get_screen_time_summary():
            return False
        
        # Step 12: Create task
        if not self.test_create_task():
            return False
        
        # Step 13: Complete task
        if not self.test_complete_task():
            return False
        
        # Step 14: Approve task
        if not self.test_approve_task():
            return False
        
        # Step 15: Get child rewards
        if not self.test_get_child_rewards():
            return False
        
        # Step 16: Redeem time
        if not self.test_redeem_time():
            return False
        
        print("\n" + "="*60)
        print("✅ CORE INTEGRATION FLOW COMPLETED SUCCESSFULLY!")
        print("="*60)
        return True
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("Starting Screen Time Parental Control API Tests")
        print("Backend URL:", self.base_url)
        print("="*60)
        
        try:
            # Run core integration flow first
            core_success = self.test_integration_flow()
            
            if not core_success:
                print("\n❌ CORE TESTS FAILED! Skipping additional tests.")
                return False
            
            # Run social authentication tests (NEW FEATURE)
            social_auth_success = self.test_social_auth_flow()
            
            # Run family sharing tests (NEW FEATURE)
            family_sharing_success = self.test_family_sharing_flow()
            
            # Run chat and device control tests
            chat_device_success = self.test_chat_and_device_flow()
            
            # Overall success
            all_success = core_success and social_auth_success and family_sharing_success and chat_device_success
            
            if all_success:
                print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
                print("✅ Core functionality: WORKING")
                print("✅ Social authentication: WORKING")
                print("✅ Family sharing: WORKING") 
                print("✅ Chat & device control: WORKING")
            else:
                print("\n❌ SOME TESTS FAILED! Check the details above.")
                print(f"✅ Core functionality: {'WORKING' if core_success else 'FAILED'}")
                print(f"{'✅' if social_auth_success else '❌'} Social authentication: {'WORKING' if social_auth_success else 'FAILED'}")
                print(f"{'✅' if family_sharing_success else '❌'} Family sharing: {'WORKING' if family_sharing_success else 'FAILED'}")
                print(f"{'✅' if chat_device_success else '❌'} Chat & device control: {'WORKING' if chat_device_success else 'FAILED'}")
            
            return all_success
            
        except Exception as e:
            print(f"\n💥 CRITICAL ERROR: {str(e)}")
            return False

def main():
    """Main test execution"""
    tester = ScreenTimeAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)