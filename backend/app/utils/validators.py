from fastapi import HTTPException, UploadFile
from app.config import settings

def validate_audio_file(file: UploadFile) -> bool:
    """Validate audio file format"""
    # Check file extension as fallback (useful when MIME type is not detected)
    if file.filename:
        ext = file.filename.lower().split('.')[-1]
        valid_extensions = ['wav', 'mp3', 'mpeg', 'webm', 'ogg', 'm4a', 'mp4']
        if ext in valid_extensions:
            return True
    
    # Check MIME type
    if not file.content_type:
        raise HTTPException(
            status_code=400, 
            detail="Could not determine file type. Please ensure file has a valid audio extension (.wav, .mp3, .webm, .ogg, etc.)"
        )
    
    # Normalize MIME type (remove codecs parameter for comparison)
    normalized_type = file.content_type.split(';')[0].strip()
    allowed_types = [fmt.split(';')[0].strip() for fmt in settings.ALLOWED_AUDIO_FORMATS]
    
    if normalized_type not in allowed_types and file.content_type not in settings.ALLOWED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format: {file.content_type}. Allowed formats: {', '.join(set(allowed_types))}"
        )
    
    return True

def validate_audio_duration(duration: float) -> bool:
    """Validate audio duration (e.g., min 1 second, max 5 minutes)"""
    if duration < 1.0:
        raise HTTPException(status_code=400, detail="Audio too short (min 1 second)")
    
    if duration > 300.0:  # 5 minutes
        raise HTTPException(status_code=400, detail="Audio too long (max 5 minutes)")
    
    return True
