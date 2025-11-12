from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from typing import List, Optional
from app.models.audio_sample import AudioSample, UploadType
from app.models.user import User
from app.schemas.audio import AudioSampleCreate
from app.utils.file_handler import save_upload_file, delete_file
import wave
import contextlib
import os

class AudioService:
    @staticmethod
    async def create_audio_sample(
        db: Session,
        user: User,
        sample_data: AudioSampleCreate,
        file: UploadFile
    ) -> AudioSample:
        """Create a new audio sample"""
        # Save file
        folder = "samples"
        file_path, file_name, file_size = await save_upload_file(file, folder)
        
        # Get audio duration (basic implementation for WAV files)
        duration = AudioService._get_audio_duration(file_path)
        
        # Create database entry
        new_sample = AudioSample(
            user_id=user.user_id,
            sample_name=sample_data.sample_name,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            duration_seconds=duration,
            upload_type=sample_data.upload_type
        )
        
        db.add(new_sample)
        db.commit()
        db.refresh(new_sample)
        
        return new_sample
    
    @staticmethod
    def get_user_samples(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[AudioSample]:
        """Get all audio samples for a user"""
        samples = db.query(AudioSample)\
            .filter(AudioSample.user_id == user.user_id)\
            .order_by(AudioSample.uploaded_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        return samples
    
    @staticmethod
    def get_sample_by_id(
        db: Session,
        sample_id: int,
        user: User
    ) -> Optional[AudioSample]:
        """Get a specific audio sample"""
        sample = db.query(AudioSample)\
            .filter(
                AudioSample.sample_id == sample_id,
                AudioSample.user_id == user.user_id
            )\
            .first()
        
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio sample not found"
            )
        
        return sample
    
    @staticmethod
    def delete_audio_sample(
        db: Session,
        sample_id: int,
        user: User
    ) -> bool:
        """Delete an audio sample"""
        sample = AudioService.get_sample_by_id(db, sample_id, user)
        
        # Delete file from storage
        delete_file(sample.file_path)
        
        # Delete from database
        db.delete(sample)
        db.commit()
        
        return True
    
    @staticmethod
    def _get_audio_duration(file_path: str) -> Optional[float]:
        """Get audio duration in seconds (supports WAV, WebM, OGG, MP3, etc.)"""
        try:
            # Try using pydub first (supports many formats)
            try:
                from pydub import AudioSegment
                audio = AudioSegment.from_file(file_path)
                duration = len(audio) / 1000.0  # pydub returns duration in milliseconds
                return round(duration, 2)
            except ImportError:
                # pydub not available, fall back to wave for WAV files
                pass
            except Exception as e:
                # pydub failed, try wave as fallback
                pass
            
            # Fallback to wave library for WAV files
            if file_path.lower().endswith('.wav'):
                with contextlib.closing(wave.open(file_path, 'r')) as f:
                    frames = f.getnframes()
                    rate = f.getframerate()
                    duration = frames / float(rate)
                    return round(duration, 2)
            
            # If we can't determine duration, return None (will be set to 0 or estimated)
            return None
        except Exception as e:
            print(f"Could not determine audio duration: {e}")
            return None
