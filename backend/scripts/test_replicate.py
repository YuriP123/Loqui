#!/usr/bin/env python3
"""Test Replicate integration"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_service import AIVoiceService
from app.config import settings

def test_replicate():
    print("🧪 Testing Replicate Integration")
    print("=" * 60)
    
    # Check token
    if not settings.REPLICATE_API_TOKEN:
        print("❌ REPLICATE_API_TOKEN not set!")
        print("   Set it in .env or export REPLICATE_API_TOKEN=your_token")
        return
    
    print(f"✅ API Token configured: {settings.REPLICATE_API_TOKEN[:10]}...")
    print(f"✅ Model: {settings.REPLICATE_MODEL}")
    print()
    
    # Initialize service
    print("Initializing AI Service...")
    ai_service = AIVoiceService()
    
    # Get service info
    info = ai_service.get_service_info()
    print(f"Mode: {info['mode']}")
    print(f"Provider: {info['provider']}")
    print(f"Model: {info.get('model', 'N/A')}")
    print()
    
    if info['mode'] == 'mock':
        print("⚠️  Running in MOCK mode")
        print("   Replicate is not configured correctly")
        return
    
    print("✅ Replicate is configured and ready!")
    print()
    
    # Test cost estimation
    test_text = "Hello! This is a test of the AI voice cloning system."
    cost_info = ai_service.estimate_cost(test_text)
    
    print("💰 Cost Estimation:")
    print(f"   Text: '{test_text}'")
    print(f"   Words: {cost_info['word_count']}")
    print(f"   Estimated duration: {cost_info['estimated_duration_seconds']}s")
    print(f"   Estimated cost: ${cost_info['estimated_cost_usd']:.4f}")
    print()
    
    print("✨ Ready to generate voice!")
    print()
    print("To test with actual generation:")
    print("1. Start the server: ./scripts/start_all.sh")
    print("2. Upload an audio sample via API")
    print("3. Create a generation request")
    print("4. Wait for Replicate to process (15-30 seconds)")

if __name__ == "__main__":
    test_replicate()
