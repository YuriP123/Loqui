from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.models.generated_audio import GeneratedAudio, GenerationStatus
from app.models.generation_queue import GenerationQueue, QueueStatus
from app.models.audio_sample import AudioSample
from app.models.user import User
from app.schemas.generation import GenerationCreate
from app.tasks.generation_tasks import process_voice_generation
import logging

logger = logging.getLogger(__name__)

class GenerationService:
    @staticmethod
    def create_generation(
        db: Session,
        user: User,
        generation_data: GenerationCreate
    ) -> GeneratedAudio:
        """Create a new generation request and queue it"""
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
        
        # Validate sample file exists
        import os
        if not os.path.exists(sample.file_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio sample file not found on server"
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
            status=QueueStatus.QUEUED,
            priority=0
        )
        
        db.add(queue_item)
        db.commit()
        
        # Trigger background task
        logger.info(f"Queuing generation task for audio_id: {new_generation.audio_id}")
        try:
            task = process_voice_generation.delay(new_generation.audio_id)
            logger.info(f"Task queued successfully: {task.id}")
        except Exception as e:
            logger.error(f"Failed to queue task: {str(e)}")
            # Update status to failed
            new_generation.status = GenerationStatus.FAILED
            queue_item.status = QueueStatus.FAILED
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to queue generation task: {str(e)}"
            )
        
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
        limit: int = 100,
        status_filter: Optional[GenerationStatus] = None
    ) -> List[GeneratedAudio]:
        """Get all generated audio for a user"""
        query = db.query(GeneratedAudio).filter(
            GeneratedAudio.user_id == user.user_id
        )
        
        if status_filter:
            query = query.filter(GeneratedAudio.status == status_filter)
        
        generations = query.order_by(
            GeneratedAudio.generated_at.desc()
        ).offset(skip).limit(limit).all()
        
        return generations
    
    @staticmethod
    def delete_generation(
        db: Session,
        audio_id: int,
        user: User
    ) -> bool:
        """Delete a generated audio"""
        generation = GenerationService.get_generation_by_id(db, audio_id, user)
        
        # Don't allow deletion of processing items
        if generation.status == GenerationStatus.PROCESSING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete audio that is currently processing"
            )
        
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
        """Get generation status with progress information"""
        generation = GenerationService.get_generation_by_id(db, audio_id, user)
        
        # Get queue info if available
        queue_item = db.query(GenerationQueue).filter(
            GenerationQueue.audio_id == audio_id
        ).first()
        
        # Calculate progress based on status
        progress_map = {
            GenerationStatus.PENDING: 10,
            GenerationStatus.PROCESSING: 50,
            GenerationStatus.COMPLETED: 100,
            GenerationStatus.FAILED: 0
        }
        
        # Estimate time remaining (very rough)
        estimated_time = None
        if generation.status == GenerationStatus.PROCESSING:
            from app.services.ai_service import AIVoiceService
            ai_service = AIVoiceService()
            estimated_time = ai_service.estimate_processing_time(generation.script_text)
        
        return {
            "audio_id": generation.audio_id,
            "status": generation.status,
            "progress": progress_map.get(generation.status, 0),
            "message": GenerationService._get_status_message(generation.status),
            "estimated_time_remaining": estimated_time,
            "retry_count": queue_item.retry_count if queue_item else 0,
            "created_at": generation.generated_at,
            "completed_at": generation.completed_at
        }
    
    @staticmethod
    def _get_status_message(status: GenerationStatus) -> str:
        """Get human-readable status message"""
        messages = {
            GenerationStatus.PENDING: "Your request is in the queue",
            GenerationStatus.PROCESSING: "Generating your audio with AI...",
            GenerationStatus.COMPLETED: "Audio generation complete! Ready to download.",
            GenerationStatus.FAILED: "Generation failed. Please try again or contact support."
        }
        return messages.get(status, "Unknown status")
    
    @staticmethod
    def retry_failed_generation(
        db: Session,
        audio_id: int,
        user: User
    ) -> GeneratedAudio:
        """Retry a failed generation"""
        generation = GenerationService.get_generation_by_id(db, audio_id, user)
        
        if generation.status != GenerationStatus.FAILED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only retry failed generations"
            )
        
        # Reset status
        generation.status = GenerationStatus.PENDING
        
        queue_item = db.query(GenerationQueue).filter(
            GenerationQueue.audio_id == audio_id
        ).first()
        
        if queue_item:
            queue_item.status = QueueStatus.QUEUED
            queue_item.retry_count += 1
        
        db.commit()
        
        # Re-queue the task
        logger.info(f"Retrying generation for audio_id: {audio_id}")
        generate_voice_audio_task.delay(audio_id)
        
        return generation
