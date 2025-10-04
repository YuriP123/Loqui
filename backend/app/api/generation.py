from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.generation import (
    GenerationCreate,
    GenerationResponse,
    GenerationStatusResponse,
    GenerationList
)
from app.services.generation_service import GenerationService
from app.utils.dependencies import get_current_active_user

router = APIRouter()

@router.post("/create", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
def create_generation(
    generation_data: GenerationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new voice generation request"""
    generation = GenerationService.create_generation(db, current_user, generation_data)
    return generation

@router.get("/status/{audio_id}", response_model=GenerationStatusResponse)
def get_generation_status(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Check the status of a generation request"""
    status_info = GenerationService.get_generation_status(db, audio_id, current_user)
    return status_info

@router.get("/", response_model=GenerationList)
def get_all_generations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all generated audio for current user"""
    generations = GenerationService.get_user_generations(db, current_user, skip, limit)
    total = len(generations)
    
    return GenerationList(generations=generations, total=total)

@router.get("/{audio_id}", response_model=GenerationResponse)
def get_generation(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific generated audio"""
    generation = GenerationService.get_generation_by_id(db, audio_id, current_user)
    return generation

@router.delete("/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_generation(
    audio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a generated audio"""
    GenerationService.delete_generation(db, audio_id, current_user)
    return None
