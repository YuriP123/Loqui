from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.audio_sample import AudioSample
from app.models.generated_audio import GeneratedAudio, GenerationStatus
from app.models.user import User
from app.schemas.library import LibraryItem
from fastapi import HTTPException, status
from app.utils.file_handler import delete_file

class LibraryService:
    @staticmethod
    def get_all_items(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> dict:
        """Get all library items (samples + generated)"""
        # Get samples
        samples = db.query(AudioSample)\
            .filter(AudioSample.user_id == user.user_id)\
            .order_by(AudioSample.uploaded_at.desc())\
            .all()
        
        # Get generated audio
        generated = db.query(GeneratedAudio)\
            .filter(GeneratedAudio.user_id == user.user_id)\
            .order_by(GeneratedAudio.generated_at.desc())\
            .all()
        
        # Convert to LibraryItem format
        items = []
        
        for sample in samples:
            items.append(LibraryItem(
                id=sample.sample_id,
                item_type="sample",
                name=sample.sample_name,
                file_path=sample.file_path,
                file_size=sample.file_size,
                duration_seconds=sample.duration_seconds,
                created_at=sample.uploaded_at
            ))
        
        for gen in generated:
            items.append(LibraryItem(
                id=gen.audio_id,
                item_type="generated",
                name=gen.model_name,
                file_path=gen.output_file_path or "",
                file_size=gen.file_size,
                duration_seconds=gen.duration_seconds,
                created_at=gen.generated_at,
                status=gen.status.value
            ))
        
        # Sort by created_at
        items.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        total = len(items)
        items = items[skip:skip + limit]
        
        return {
            "items": items,
            "total": total,
            "samples_count": len(samples),
            "generated_count": len(generated)
        }
    
    @staticmethod
    def get_samples_only(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> dict:
        """Get only audio samples"""
        samples = db.query(AudioSample)\
            .filter(AudioSample.user_id == user.user_id)\
            .order_by(AudioSample.uploaded_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        items = [
            LibraryItem(
                id=sample.sample_id,
                item_type="sample",
                name=sample.sample_name,
                file_path=sample.file_path,
                file_size=sample.file_size,
                duration_seconds=sample.duration_seconds,
                created_at=sample.uploaded_at
            )
            for sample in samples
        ]
        
        total_samples = db.query(AudioSample)\
            .filter(AudioSample.user_id == user.user_id)\
            .count()
        
        return {
            "items": items,
            "total": len(items),
            "samples_count": total_samples,
            "generated_count": 0
        }
    
    @staticmethod
    def get_generated_only(
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 100
    ) -> dict:
        """Get only generated audio"""
        generated = db.query(GeneratedAudio)\
            .filter(GeneratedAudio.user_id == user.user_id)\
            .order_by(GeneratedAudio.generated_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        items = [
            LibraryItem(
                id=gen.audio_id,
                item_type="generated",
                name=gen.model_name,
                file_path=gen.output_file_path or "",
                file_size=gen.file_size,
                duration_seconds=gen.duration_seconds,
                created_at=gen.generated_at,
                status=gen.status.value
            )
            for gen in generated
        ]
        
        total_generated = db.query(GeneratedAudio)\
            .filter(GeneratedAudio.user_id == user.user_id)\
            .count()
        
        return {
            "items": items,
            "total": len(items),
            "samples_count": 0,
            "generated_count": total_generated
        }
    
    @staticmethod
    def delete_item(
        db: Session,
        item_id: int,
        item_type: str,
        user: User
    ) -> bool:
        """Delete an item from library"""
        if item_type == "sample":
            # Delete sample
            sample = db.query(AudioSample).filter(
                AudioSample.sample_id == item_id,
                AudioSample.user_id == user.user_id
            ).first()
            
            if not sample:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Sample not found"
                )
            
            delete_file(sample.file_path)
            db.delete(sample)
            db.commit()
            
        elif item_type == "generated":
            # Delete generated audio
            generated = db.query(GeneratedAudio).filter(
                GeneratedAudio.audio_id == item_id,
                GeneratedAudio.user_id == user.user_id
            ).first()
            
            if not generated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Generated audio not found"
                )
            
            if generated.output_file_path:
                delete_file(generated.output_file_path)
            
            db.delete(generated)
            db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid item type"
            )
        
        return True
