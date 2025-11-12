import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from app.config import settings
from typing import Tuple

async def save_upload_file(file: UploadFile, folder: str) -> Tuple[str, str, int]:
    """
    Save uploaded file to storage
    Returns: (file_path, file_name, file_size)
    """
    # Validate file type (normalize MIME type for comparison)
    if file.content_type:
        normalized_type = file.content_type.split(';')[0].strip()
        allowed_types = [fmt.split(';')[0].strip() for fmt in settings.ALLOWED_AUDIO_FORMATS]
        
        if normalized_type not in allowed_types and file.content_type not in settings.ALLOWED_AUDIO_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format: {file.content_type}. Allowed formats: {', '.join(set(allowed_types))}"
            )
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create full path
    folder_path = os.path.join(settings.UPLOAD_DIR, folder)
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, unique_filename)
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Check file size
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE} bytes"
        )
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    return file_path, unique_filename, file_size

def delete_file(file_path: str) -> bool:
    """Delete a file from storage"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False

def get_file_info(file_path: str) -> dict:
    """Get file information"""
    if not os.path.exists(file_path):
        return None
    
    stat = os.stat(file_path)
    return {
        "path": file_path,
        "size": stat.st_size,
        "exists": True
    }
