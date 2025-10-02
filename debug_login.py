#!/usr/bin/env python3
"""
Debug script to test the specific 422 login error with demo credentials
"""

import requests
import json

# Backend URL
BACKEND_URL = "https://screentime-parent.preview.emergentagent.com/api"

def test_demo_login():
    """Test the specific demo login that's failing with 422"""
    print("Testing demo login credentials...")
    
    # Demo credentials from the review request
    demo_credentials = {
        "email": "demo@parent.com",
        "password": "demo123"
    }
    
    url = f"{BACKEND_URL}/auth/login"
    
    try:
        print(f"POST {url}")
        print(f"Request body: {json.dumps(demo_credentials, indent=2)}")
        
        response = requests.post(url, json=demo_credentials)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 422:
            print("\n❌ CONFIRMED: 422 Unprocessable Entity error")
            try:
                error_detail = response.json()
                print(f"Error details: {json.dumps(error_detail, indent=2)}")
            except:
                print("Could not parse error response as JSON")
        elif response.status_code == 401:
            print("\n❌ 401 Unauthorized - Demo account doesn't exist")
        elif response.status_code == 200:
            print("\n✅ Login successful")
        else:
            print(f"\n❓ Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

def test_demo_registration():
    """Test if we can register the demo account"""
    print("\n" + "="*50)
    print("Testing demo account registration...")
    
    demo_user_data = {
        "email": "demo@parent.com",
        "password": "demo123",
        "name": "Demo Parent"
    }
    
    url = f"{BACKEND_URL}/auth/register"
    
    try:
        print(f"POST {url}")
        print(f"Request body: {json.dumps(demo_user_data, indent=2)}")
        
        response = requests.post(url, json=demo_user_data)
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ Demo account registered successfully")
            return True
        elif response.status_code == 400:
            print("\n❓ Demo account already exists")
            return False
        else:
            print(f"\n❌ Registration failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Registration request failed: {e}")
        return False

def test_malformed_requests():
    """Test various malformed requests to see what causes 422"""
    print("\n" + "="*50)
    print("Testing malformed requests to identify 422 causes...")
    
    test_cases = [
        {
            "name": "Missing email field",
            "data": {"password": "demo123"}
        },
        {
            "name": "Missing password field", 
            "data": {"email": "demo@parent.com"}
        },
        {
            "name": "Invalid email format",
            "data": {"email": "invalid-email", "password": "demo123"}
        },
        {
            "name": "Empty email",
            "data": {"email": "", "password": "demo123"}
        },
        {
            "name": "Empty password",
            "data": {"email": "demo@parent.com", "password": ""}
        },
        {
            "name": "Extra fields",
            "data": {"email": "demo@parent.com", "password": "demo123", "extra_field": "value"}
        }
    ]
    
    url = f"{BACKEND_URL}/auth/login"
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['name']}")
        try:
            response = requests.post(url, json=test_case['data'])
            print(f"  Status: {response.status_code}")
            if response.status_code == 422:
                print(f"  ❌ 422 Error: {response.text}")
            elif response.status_code == 401:
                print(f"  ❓ 401 Unauthorized (expected for non-existent user)")
            else:
                print(f"  Response: {response.text}")
        except Exception as e:
            print(f"  ❌ Request failed: {e}")

def test_social_auth_endpoints():
    """Test social auth endpoints"""
    print("\n" + "="*50)
    print("Testing social auth endpoints...")
    
    # Test Google OAuth endpoint
    print("\nTesting Google OAuth endpoint...")
    google_url = f"{BACKEND_URL}/social-auth/google"
    google_data = {"session_id": "test_session_123"}
    
    try:
        response = requests.post(google_url, json=google_data)
        print(f"Google OAuth - Status: {response.status_code}, Response: {response.text[:200]}")
    except Exception as e:
        print(f"Google OAuth failed: {e}")
    
    # Test Apple Sign In endpoint
    print("\nTesting Apple Sign In endpoint...")
    apple_url = f"{BACKEND_URL}/social-auth/apple"
    apple_data = {
        "code": "test_code",
        "id_token": "test.jwt.token",
        "state": "test_state"
    }
    
    try:
        response = requests.post(apple_url, json=apple_data)
        print(f"Apple Sign In - Status: {response.status_code}, Response: {response.text[:200]}")
    except Exception as e:
        print(f"Apple Sign In failed: {e}")

def check_database_connectivity():
    """Check if database is accessible via health check"""
    print("\n" + "="*50)
    print("Checking database connectivity...")
    
    url = f"{BACKEND_URL}/"
    
    try:
        response = requests.get(url)
        print(f"Health check - Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Backend is accessible")
        else:
            print("❌ Backend health check failed")
            
    except Exception as e:
        print(f"❌ Health check failed: {e}")

if __name__ == "__main__":
    print("DEBUGGING 422 LOGIN ERROR FOR SCREEN TIME APP")
    print("=" * 60)
    
    # Step 1: Check backend connectivity
    check_database_connectivity()
    
    # Step 2: Test the specific demo login that's failing
    test_demo_login()
    
    # Step 3: Try to register demo account if it doesn't exist
    registered = test_demo_registration()
    
    # Step 4: If registration succeeded, try login again
    if registered:
        print("\n" + "="*50)
        print("Retrying demo login after registration...")
        test_demo_login()
    
    # Step 5: Test malformed requests to identify 422 causes
    test_malformed_requests()
    
    # Step 6: Test social auth endpoints
    test_social_auth_endpoints()
    
    print("\n" + "="*60)
    print("DEBUGGING COMPLETE")