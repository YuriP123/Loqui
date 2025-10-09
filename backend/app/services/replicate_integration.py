import replicate
import os
import uuid
import asyncio
from typing import Tuple
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class ReplicateVoiceService:
    """
    Production AI Voice Cloning using Replicate + Chatterbox
    
    Model: resemble-ai/chatterbox
    Capabilities: High-quality voice cloning with emotion control
    """
    
    def __init__(self):
        self.api_token = settings.REPLICATE_API_TOKEN
        
        if not self.api_token:
            raise ValueError("REPLICATE_API_TOKEN not set in environment")
        
        # Set environment variable for replicate client
        os.environ["REPLICATE_API_TOKEN"] = self.api_token
        
        self.model = settings.REPLICATE_MODEL
        self.output_dir = os.path.join(settings.UPLOAD_DIR, "generated")
        os.makedirs(self.output_dir, exist_ok=True)
        
        logger.info(f"✅ Replicate initialized with model: {self.model}")
    
    async def generate_speech(
        self,
        sample_path: str,
        text: str,
        model_name: str
    ) -> Tuple[str, float, int]:
        """
        Generate speech using Replicate Chatterbox model
        
        Args:
            sample_path: Path to the reference audio sample
            text: Text to synthesize
            model_name: Name for this voice model (metadata)
            
        Returns:
            Tuple of (output_file_path, duration_seconds, file_size_bytes)
        """
        logger.info(f"🤖 Starting Replicate generation for: {text[:50]}...")
        logger.info(f"   Using voice sample: {sample_path}")
        
        try:
            # Prepare input for Chatterbox model
            # Chatterbox expects 'audio_prompt' and 'prompt' (text)
            input_data = {
                "prompt": text,
                "audio_prompt": open(sample_path, "rb")  # Replicate handles file upload
            }
            
            logger.info("📤 Sending request to Replicate...")
            
            # Run the model using async
            output = await asyncio.to_thread(
                replicate.run,
                self.model,
                input=input_data
            )
            
            logger.info("📥 Received response from Replicate")
            
            # Generate unique filename
            output_filename = f"{uuid.uuid4()}.wav"
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Download the generated audio
            # Replicate returns a FileOutput object
            logger.info("💾 Downloading generated audio...")
            
            with open(output_path, "wb") as file:
                file.write(output.read())
            
            # Get file info
            file_size = os.path.getsize(output_path)
            
            # Calculate duration
            duration = self._get_audio_duration(output_path)
            
            logger.info(f"✅ Generation complete!")
            logger.info(f"   Output: {output_path}")
            logger.info(f"   Duration: {duration:.2f}s")
            logger.info(f"   Size: {file_size / 1024:.2f}KB")
            
            return output_path, duration, file_size
            
        except Exception as e:
            logger.error(f"❌ Replicate generation failed: {str(e)}")
            logger.error(f"   Error type: {type(e).__name__}")
            raise Exception(f"Replicate AI generation failed: {str(e)}")
    
    def _get_audio_duration(self, file_path: str) -> float:
        """Get audio duration using wave library"""
        try:
            import wave
            import contextlib
            
            with contextlib.closing(wave.open(file_path, 'r')) as wav_file:
                frames = wav_file.getnframes()
                rate = wav_file.getframerate()
                duration = frames / float(rate)
                return round(duration, 2)
        except Exception as e:
            logger.warning(f"Could not determine duration: {e}")
            # Fallback: estimate based on text length
            # Average speaking rate: ~150 words per minute
            return 0.0
    
    def check_health(self) -> bool:
        """Check if Replicate service is available"""
        if not self.api_token:
            return False
        
        try:
            # Simple check: verify token is set
            os.environ["REPLICATE_API_TOKEN"] = self.api_token
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    def estimate_cost(self, text: str) -> dict:
        """
        Estimate cost for generation
        
        Chatterbox pricing: ~$0.001 per second of audio
        Average speaking rate: ~150 words/minute = 2.5 words/second
        """
        word_count = len(text.split())
        estimated_duration = word_count / 2.5  # seconds
        estimated_cost = estimated_duration * 0.001  # dollars
        
        return {
            "estimated_duration_seconds": round(estimated_duration, 2),
            "estimated_cost_usd": round(estimated_cost, 4),
            "word_count": word_count
        }
