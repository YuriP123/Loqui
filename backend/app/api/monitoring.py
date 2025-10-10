from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.generated_audio import GeneratedAudio, GenerationStatus
from app.models.audio_sample import AudioSample
from app.models.user import User
from app.utils.dependencies import get_current_active_user
from datetime import datetime, timedelta
import os

router = APIRouter()

@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get system statistics for current user"""
    
    # User stats
    total_samples = db.query(AudioSample).filter(
        AudioSample.user_id == current_user.user_id
    ).count()
    
    total_generations = db.query(GeneratedAudio).filter(
        GeneratedAudio.user_id == current_user.user_id
    ).count()
    
    completed_generations = db.query(GeneratedAudio).filter(
        GeneratedAudio.user_id == current_user.user_id,
        GeneratedAudio.status == GenerationStatus.COMPLETED
    ).count()
    
    failed_generations = db.query(GeneratedAudio).filter(
        GeneratedAudio.user_id == current_user.user_id,
        GeneratedAudio.status == GenerationStatus.FAILED
    ).count()
    
    processing_generations = db.query(GeneratedAudio).filter(
        GeneratedAudio.user_id == current_user.user_id,
        GeneratedAudio.status == GenerationStatus.PROCESSING
    ).count()
    
    # Recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_samples = db.query(AudioSample).filter(
        AudioSample.user_id == current_user.user_id,
        AudioSample.uploaded_at >= week_ago
    ).count()
    
    recent_generations = db.query(GeneratedAudio).filter(
        GeneratedAudio.user_id == current_user.user_id,
        GeneratedAudio.generated_at >= week_ago
    ).count()
    
    # Storage usage
    from app.config import settings
    storage_path = settings.UPLOAD_DIR
    
    total_storage = 0
    if os.path.exists(storage_path):
        for root, dirs, files in os.walk(storage_path):
            for file in files:
                file_path = os.path.join(root, file)
                if os.path.exists(file_path):
                    total_storage += os.path.getsize(file_path)
    
    # Convert to MB
    storage_mb = round(total_storage / (1024 * 1024), 2)
    
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "statistics": {
            "total_samples": total_samples,
            "total_generations": total_generations,
            "completed_generations": completed_generations,
            "failed_generations": failed_generations,
            "processing_generations": processing_generations,
            "success_rate": round(
                (completed_generations / total_generations * 100) if total_generations > 0 else 0,
                2
            )
        },
        "recent_activity": {
            "samples_last_7_days": recent_samples,
            "generations_last_7_days": recent_generations
        },
        "storage": {
            "used_mb": storage_mb,
            "limit_mb": 1000  # Example limit
        }
    }

@router.get("/queue")
def get_queue_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current generation queue status"""
    from app.models.generation_queue import GenerationQueue, QueueStatus
    
    # Get user's items in queue
    queue_items = db.query(GenerationQueue).join(GeneratedAudio).filter(
        GeneratedAudio.user_id == current_user.user_id
    ).order_by(GenerationQueue.queued_at).all()
    
    result = []
    for item in queue_items:
        result.append({
            "queue_id": item.queue_id,
            "audio_id": item.audio_id,
            "status": item.status.value,
            "priority": item.priority,
            "queued_at": item.queued_at,
            "processed_at": item.processed_at,
            "retry_count": item.retry_count
        })
    
    return {
        "total_in_queue": len(result),
        "queue_items": result
    }

@router.get("/ai-service")
def get_ai_service_info():
    """Get AI service information"""
    from app.services.ai_service import AIVoiceService
    
    ai_service = AIVoiceService()
    service_info = ai_service.get_service_info()
    
    return {
        "service": service_info,
        "message": "Using real AI" if service_info['mode'] == 'replicate' else "Using mock AI for testing"
    }
