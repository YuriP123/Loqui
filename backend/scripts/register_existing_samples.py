#!/usr/bin/env python3
"""
Register existing audio files in app/storage/samples/ into the database
"""

import os
import sys
import wave
import contextlib

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal, engine
from app.models.user import User
from app.models.audio_sample import AudioSample, UploadType
from sqlalchemy.orm import Session

def get_audio_duration(file_path: str):
    """Get audio duration in seconds (works for WAV files)"""
    try:
        with contextlib.closing(wave.open(file_path, 'r')) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            duration = frames / float(rate)
            return round(duration, 2)
    except Exception as e:
        print(f"   ⚠️  Could not determine duration: {e}")
        return None

def get_or_create_test_user(db: Session) -> User:
    """Get or create test user"""
    user = db.query(User).filter(User.username == "testuser").first()
    if not user:
        print("   Creating test user...")
        from app.utils.security import hash_password
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=hash_password("testpass123"),
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("   ✅ Test user created")
    return user

def register_samples():
    """Register all samples in storage/samples/ folder"""
    print("╔═══════════════════════════════════════════════════╗")
    print("║     📋 REGISTERING EXISTING SAMPLES IN DB         ║")
    print("╚═══════════════════════════════════════════════════╝")
    print()
    
    samples_dir = "./app/storage/samples"
    
    if not os.path.exists(samples_dir):
        print(f"❌ Samples directory not found: {samples_dir}")
        return
    
    # Get all WAV files
    wav_files = [f for f in os.listdir(samples_dir) if f.endswith('.wav')]
    
    if not wav_files:
        print(f"⚠️  No WAV files found in {samples_dir}")
        return
    
    print(f"Found {len(wav_files)} WAV files")
    print()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Get or create test user
        user = get_or_create_test_user(db)
        
        registered_count = 0
        skipped_count = 0
        
        for filename in wav_files:
            file_path = os.path.join(samples_dir, filename)
            
            # Check if already registered
            existing = db.query(AudioSample).filter(
                AudioSample.file_name == filename
            ).first()
            
            if existing:
                print(f"⏭️  Skipped (already registered): {filename}")
                skipped_count += 1
                continue
            
            # Get file info
            file_size = os.path.getsize(file_path)
            duration = get_audio_duration(file_path)
            
            # Create database entry
            sample = AudioSample(
                user_id=user.user_id,
                sample_name=f"Sample {filename[:8]}",
                file_name=filename,
                file_path=file_path,
                file_size=file_size,
                duration_seconds=duration,
                upload_type=UploadType.UPLOADED
            )
            
            db.add(sample)
            db.commit()
            db.refresh(sample)
            
            print(f"✅ Registered: {filename}")
            print(f"   Sample ID: {sample.sample_id}")
            print(f"   Duration: {duration}s")
            print(f"   Size: {file_size // 1024} KB")
            print()
            
            registered_count += 1
        
        print("═══════════════════════════════════════════════════")
        print()
        print(f"✅ Registration complete!")
        print(f"   Registered: {registered_count}")
        print(f"   Skipped: {skipped_count}")
        print(f"   Total: {registered_count + skipped_count}")
        print()
        print("💡 Now you can test with:")
        print("   ./scripts/list_samples.sh")
        print("   ./scripts/test_generation_only.sh <sample_id> \"Your text\"")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    register_samples()


