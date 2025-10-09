import os
import uuid
import time
import shutil
from typing import Tuple
from app.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

class AIVoiceService:
    """
    AI Voice Cloning Service
    
    Automatically uses Replicate if configured, otherwise falls back to mock
    """
    
    def __init__(self):
        self.output_dir = os.path.join(settings.UPLOAD_DIR, "generated")
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Determine which service to use
        self.use_real_ai = self._check_replicate_available()
        
        if self.use_real_ai:
            from app.services.replicate_integration import ReplicateVoiceService
            self.replicate_service = ReplicateVoiceService()
            logger.info("✅ Using Replicate + Chatterbox for AI generation")
        else:
            logger.info("⚠️  Using MOCK AI (set REPLICATE_API_TOKEN for real AI)")
            logger.info("   Get your token at: https://replicate.com/account/api-tokens")
    
    def _check_replicate_available(self) -> bool:
        """Check if Replicate is configured"""
        if not settings.REPLICATE_API_TOKEN:
            return False
        
        try:
            from app.services.replicate_integration import ReplicateVoiceService
            service = ReplicateVoiceService()
            return service.check_health()
        except Exception as e:
            logger.error(f"Replicate not available: {e}")
            return False
    
    def generate_speech(
        self,
        sample_path: str,
        text: str,
        model_name: str
    ) -> Tuple[str, float, int]:
        """
        Generate speech from text using voice sample
        
        Args:
            sample_path: Path to the audio sample file
            text: Text to synthesize
            model_name: Name for the model
            
        Returns:
            Tuple of (output_path, duration_seconds, file_size_bytes)
        """
        if self.use_real_ai:
            try:
                return self._generate_with_replicate(sample_path, text, model_name)
            except Exception as e:
                logger.error(f"Replicate failed, falling back to mock: {e}")
                return self._generate_mock_audio(sample_path, text, model_name)
        else:
            return self._generate_mock_audio(sample_path, text, model_name)
    
    def _generate_with_replicate(
        self,
        sample_path: str,
        text: str,
        model_name: str
    ) -> Tuple[str, float, int]:
        """Generate with Replicate"""
        logger.info(f"🤖 Generating REAL AI audio with Replicate")
        
        # Run async function in sync context (for Celery compatibility)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                self.replicate_service.generate_speech(sample_path, text, model_name)
            )
            return result
        finally:
            loop.close()
    
    def _generate_mock_audio(
        self,
        sample_path: str,
        text: str,
        model_name: str
    ) -> Tuple[str, float, int]:
        """
        Generate mock audio for testing
        """
        logger.info(f"🎭 Generating MOCK audio for: {model_name}")
        
        # Simulate processing time (2 seconds per 10 words)
        word_count = len(text.split())
        processing_time = (word_count / 10) * 2
        logger.info(f"⏱️  Simulating {processing_time:.1f}s processing for {word_count} words")
        time.sleep(min(processing_time, 10))  # Cap at 10 seconds
        
        # Generate output filename
        output_filename = f"{uuid.uuid4()}.wav"
        output_path = os.path.join(self.output_dir, output_filename)
        
        # Copy the sample file as output (mock)
        if os.path.exists(sample_path):
            shutil.copy2(sample_path, output_path)
            file_size = os.path.getsize(output_path)
        else:
            # Create a dummy file
            with open(output_path, 'wb') as f:
                f.write(b'RIFF' + b'\x00' * 1000)
            file_size = os.path.getsize(output_path)
        
        # Estimate duration
        duration = len(text.split()) * 0.1
        
        logger.info(f"✅ Mock audio generated: {output_path}")
        
        return output_path, duration, file_size
    
    def validate_sample(self, sample_path: str) -> bool:
        """Validate that audio sample is suitable for cloning"""
        if not os.path.exists(sample_path):
            logger.error(f"Sample file not found: {sample_path}")
            return False
        
        # Check file size (min 100KB, max 50MB)
        file_size = os.path.getsize(sample_path)
        if file_size < 100 * 1024:
            logger.warning(f"Sample too small: {file_size} bytes")
            return False
        
        if file_size > 50 * 1024 * 1024:
            logger.warning(f"Sample too large: {file_size} bytes")
            return False
        
        return True
    
    def estimate_processing_time(self, text: str) -> int:
        """Estimate processing time in seconds"""
        word_count = len(text.split())
        
        if self.use_real_ai:
            # Replicate: ~10-30 seconds depending on text length
            return max(15, int((word_count / 10) * 3))
        else:
            # Mock: ~2 seconds per 10 words
            return max(5, int((word_count / 10) * 2))
    
    def get_service_info(self) -> dict:
        """Get information about the AI service"""
        info = {
            "mode": "replicate" if self.use_real_ai else "mock",
            "provider": "Replicate.com" if self.use_real_ai else "Mock",
            "model": settings.REPLICATE_MODEL if self.use_real_ai else "N/A",
        }
        
        if self.use_real_ai:
            info["replicate_available"] = self.replicate_service.check_health()
        
        return info
    
    def estimate_cost(self, text: str) -> dict:
        """Estimate cost for generation"""
        if self.use_real_ai:
            return self.replicate_service.estimate_cost(text)
        else:
            return {
                "estimated_duration_seconds": len(text.split()) * 0.1,
                "estimated_cost_usd": 0.0,
                "word_count": len(text.split()),
                "note": "Mock mode - no cost"
            }
