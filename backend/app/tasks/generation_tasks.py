"""
Celery tasks for voice generation
"""

import logging
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.generated_audio import GeneratedAudio, GenerationStatus
from app.models.generation_queue import GenerationQueue, QueueStatus
from app.models.audio_sample import AudioSample
from app.services.ai_service import AIVoiceService

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name='app.tasks.generation_tasks.process_voice_generation')
def process_voice_generation(self, audio_id: int):
    """
    Process voice generation task
    
    Args:
        audio_id: ID of the GeneratedAudio record to process
    """
    db = SessionLocal()
    
    try:
        logger.info(f"🎬 Starting voice generation task for audio_id={audio_id}")
        
        # Get generation record
        generation = db.query(GeneratedAudio).filter(GeneratedAudio.audio_id == audio_id).first()
        if not generation:
            logger.error(f"❌ Generation not found: audio_id={audio_id}")
            return
        
        # Update status to PROCESSING
        generation.status = GenerationStatus.PROCESSING
        
        # Update queue status
        queue_item = db.query(GenerationQueue).filter(GenerationQueue.audio_id == audio_id).first()
        if queue_item:
            queue_item.status = QueueStatus.PROCESSING
        
        db.commit()
        logger.info(f"✅ Status updated to PROCESSING")
        
        # Get sample
        sample = db.query(AudioSample).filter(AudioSample.sample_id == generation.sample_id).first()
        if not sample:
            raise Exception(f"Sample not found: sample_id={generation.sample_id}")
        
        logger.info(f"📂 Using sample: {sample.file_path}")
        logger.info(f"📝 Generating text: {generation.script_text[:100]}...")
        
        # Generate audio using AI service
        ai_service = AIVoiceService()
        output_path, duration, file_size = ai_service.generate_speech(
            sample_path=sample.file_path,
            text=generation.script_text,
            model_name=generation.model_name
        )
        
        logger.info(f"✅ Generation successful!")
        logger.info(f"   Output: {output_path}")
        logger.info(f"   Duration: {duration}s")
        logger.info(f"   Size: {file_size} bytes")
        
        # Update generation record
        generation.output_file_path = output_path
        generation.duration_seconds = duration
        generation.file_size = file_size
        generation.status = GenerationStatus.COMPLETED
        
        # Update queue
        if queue_item:
            queue_item.status = QueueStatus.COMPLETED
            from sqlalchemy.sql import func
            queue_item.processed_at = func.now()
        
        db.commit()
        
        logger.info(f"🎉 Voice generation completed for audio_id={audio_id}")
        return {
            'audio_id': audio_id,
            'status': 'completed',
            'output_path': output_path,
            'duration': duration,
            'file_size': file_size
        }
        
    except Exception as e:
        logger.error(f"❌ Voice generation failed for audio_id={audio_id}: {str(e)}")
        logger.exception(e)
        
        try:
            # Update to FAILED status
            generation = db.query(GeneratedAudio).filter(GeneratedAudio.audio_id == audio_id).first()
            if generation:
                generation.status = GenerationStatus.FAILED
            
            queue_item = db.query(GenerationQueue).filter(GenerationQueue.audio_id == audio_id).first()
            if queue_item:
                queue_item.status = QueueStatus.FAILED
                queue_item.retry_count += 1
            
            db.commit()
        except Exception as update_error:
            logger.error(f"Failed to update error status: {update_error}")
        
        raise
        
    finally:
        db.close()
