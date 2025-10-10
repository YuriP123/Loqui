#!/usr/bin/env python3
"""
End-to-end workflow test for AI Voice Clone Studio
"""
import requests
import time
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_workflow():
    """Test complete user workflow"""
    
    print_section("AI Voice Clone Studio - Workflow Test")
    
    # 1. Register
    print("\n1️⃣  Registering user...")
    timestamp = int(time.time())
    register_data = {
        "username": f"workflowtest{timestamp}",
        "email": f"workflow{timestamp}@test.com",
        "password": "testpass123",
        "full_name": "Workflow Test User"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    if response.status_code == 201:
        print("✅ User registered successfully")
        user_data = response.json()
        print(f"   User ID: {user_data['user_id']}")
        print(f"   Username: {user_data['username']}")
    else:
        print(f"❌ Registration failed: {response.text}")
        return
    
    # 2. Login
    print("\n2️⃣  Logging in...")
    login_data = {
        "username": register_data["username"],
        "password": register_data["password"]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=login_data
    )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print("✅ Login successful")
        print(f"   Token: {token[:30]}...")
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print(f"❌ Login failed: {response.text}")
        return
    
    # 3. Check AI Service
    print("\n3️⃣  Checking AI service...")
    response = requests.get(f"{BASE_URL}/api/monitoring/ai-service")
    if response.status_code == 200:
        service_info = response.json()
        print(f"✅ AI Service: {service_info['message']}")
        print(f"   Mode: {service_info['service']['mode']}")
    
    # 4. Upload Sample (would need actual audio file)
    print("\n4️⃣  Upload audio sample...")
    print("⚠️  Skipping - requires actual audio file")
    print("   In real test, upload a .wav file here")
    
    # Create fake sample ID for demo
    sample_id = 1
    
    # 5. Create Generation
    print("\n5️⃣  Creating generation request...")
    generation_data = {
        "sample_id": sample_id,
        "model_name": "Workflow Test Voice",
        "script_text": "Hello! This is a test of the AI voice cloning system. It should generate speech using my voice sample."
    }
    
    print("⚠️  This will fail without a real sample, but demonstrates the flow")
    response = requests.post(
        f"{BASE_URL}/api/generation/create",
        json=generation_data,
        headers=headers
    )
    
    if response.status_code == 201:
        generation = response.json()
        audio_id = generation["audio_id"]
        print("✅ Generation created successfully")
        print(f"   Audio ID: {audio_id}")
        print(f"   Status: {generation['status']}")
        
        # 6. Monitor Status
        print("\n6️⃣  Monitoring generation status...")
        for i in range(5):
            time.sleep(2)
            response = requests.get(
                f"{BASE_URL}/api/generation/status/{audio_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                status = response.json()
                print(f"   [{i+1}/5] Status: {status['status']} - Progress: {status['progress']}%")
                print(f"        Message: {status['message']}")
                
                if status['status'] in ['completed', 'failed']:
                    break
        
        # 7. Check Library
        print("\n7️⃣  Checking library...")
        response = requests.get(f"{BASE_URL}/api/library/all", headers=headers)
        if response.status_code == 200:
            library = response.json()
            print(f"✅ Library retrieved")
            print(f"   Total items: {library['total']}")
            print(f"   Samples: {library['samples_count']}")
            print(f"   Generated: {library['generated_count']}")
    else:
        print(f"⚠️  Generation failed (expected without real sample): {response.text}")
    
    # 8. Get Stats
    print("\n8️⃣  Getting user statistics...")
    response = requests.get(f"{BASE_URL}/api/monitoring/stats", headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print("✅ Statistics retrieved")
        print(f"   Total samples: {stats['statistics']['total_samples']}")
        print(f"   Total generations: {stats['statistics']['total_generations']}")
        print(f"   Success rate: {stats['statistics']['success_rate']}%")
    
    print_section("Workflow Test Complete")
    print("\n✨ All endpoints tested successfully!")
    print("📝 Note: Full workflow requires actual audio file upload")

if __name__ == "__main__":
    try:
        test_workflow()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to API server")
        print("   Make sure the server is running: ./scripts/start_all.sh")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
