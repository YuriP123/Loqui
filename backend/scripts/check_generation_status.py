#!/usr/bin/env python3
"""Check the status of a generation directly from the database"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.generated_audio import GeneratedAudio

db = SessionLocal()

try:
    # Get the most recent generation
    generation = db.query(GeneratedAudio).order_by(GeneratedAudio.generated_at.desc()).first()
    
    if not generation:
        print("No generations found")
    else:
        print(f"Audio ID: {generation.audio_id}")
        print(f"Status: {generation.status}")
        print(f"Progress: {generation.progress}%")
        print(f"Error Message: {generation.error_message}")
        print(f"File Path: {generation.file_path}")
        print(f"Generated At: {generation.generated_at}")
finally:
    db.close()

