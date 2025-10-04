from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.models.generated_audio import GeneratedAudio, GenerationStatus
from app.models.generation_queue import GenerationQueue, QueueStatus
from app.models.audio_sample import AudioSample
from app.models.user import User
from app.schemas.generation import GenerationCreate
import asyncio

class GenerationService:
    @staticmethod
    def create_generation(
        db: Session,
        user: User,
        generation_data: GenerationCreate
    ) -> GeneratedAudio:
        """Create a new generation request"""
        # Verify sample exists and belongs to user
        sample = db.query(AudioSample).filter(
            AudioSample.sample_id == generation_data.sample_id,
            AudioSample.user_id == user.user_id
        ).first()
        
        if not sample:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audio sample not found"
            )
        
        # Create generation record
        new_generation = GeneratedAudio(
            user_id=user.user_id,
            sample_id=generation_data.sample_id,
            model_name=generation_data.model_name,
            script_text=generation_data.script_text,
            status=GenerationStatus.PENDING
        )
        
        db.add(new_generation)
        db.commit()
        db.refresh(new_generation)
        
        # Add to queue
        queue_item = GenerationQueue(
            audio_id=new_generation.audio_id,
            user_id=user.user_id,
            status=QueueStatus.QUEUED
        )
        
        db.add(queue_item)
        db.commit()
        
        # TODO: Trigger background processing
        # For now, we'll simulate it
        
        return new_generation
    
    @staticmethod
    def get_generation_by_id(
        db: Session,
        audio_id: int,
        user: User
    ) -> Optional[GeneratedAudio]:
        """Get a specific generated audio"""
        generation = db.query(GeneratedAudio).filter(
            GeneratedAudio.audio_id == audio_id,
            GeneratedAudio.user_id == user.user_id
        ).first()
        
        if not generation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Generated audio not found"
            )
        
        return generation
    
    @staticmethod
    def get_user_generations(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[GeneratedAudio]:
        """Get all generated audio for a user"""
        generations = db.query(GeneratedAudio)\
            .filter(GeneratedAudio.user_id == user.user_id)\
            .order_by(GeneratedAudio.generated_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        return generations
    
    @staticmethod
    def delete_generation(
        db: Session,
        audio_id: int,
        user: User
    ) -> bool:
        """Delete a generated audio"""
        generation = GenerationService.get_generation_by_id(db, audio_id, user)
        
        # Delete file if exists
        if generation.output_file_path:
            from app.utils.file_handler import delete_file
            delete_file(generation.output_file_path)
        
        # Delete from database (cascade will delete queue item)
        db.delete(generation)
        db.commit()
        
        return True
    
    @staticmethod
    def get_generation_status(
        db: Session,
        audio_id: int,
        user: User
    ) -> dict:
        """Get generation status"""
        generation = GenerationService.get_generation_by_id(db, audio_id, user)
        
        # Calculate progress based on status
        progress_map = {
            GenerationStatus.PENDING: 0,
            GenerationStatus.PROCESSING: 50,
            GenerationStatus.COMPLETED: 100,
            GenerationStatus.FAILED: 0
        }
        
        return {
            "audio_id": generation.audio_id,
            "status": generation.status,
            "progress": progress_map.get(generation.status, 0),
            "message": GenerationService._get_status_message(generation.status)
        }
    
    @staticmethod
    def _get_status_message(status: GenerationStatus) -> str:
        """Get human-readable status message"""
        messages = {
            GenerationStatus.PENDING: "Your request is in queue",
            GenerationStatus.PROCESSING: "Generating your audio...",
            GenerationStatus.COMPLETED: "Audio generation complete!",
            GenerationStatus.FAILED: "Generation failed. Please try again."
        }
        return messages.get(status, "Unknown status")
