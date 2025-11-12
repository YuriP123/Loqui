import replicate
import os
import uuid
import asyncio
from typing import Tuple
from app.config import settings
import logging
import tempfile
import requests

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
    
    def _convert_to_wav(self, audio_path: str) -> str:
        """
        Convert audio file to WAV format if needed.
        Replicate Chatterbox requires WAV format.
        """
        # Check if already WAV
        if audio_path.lower().endswith('.wav'):
            return audio_path
        
        logger.info(f"🔄 Converting {audio_path} to WAV format...")
        
        try:
            import subprocess
            import tempfile
            
            # Create temporary WAV file
            temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_wav.close()
            
            # Use ffmpeg to convert (if available) or pydub
            try:
                # Try using ffmpeg first (more reliable)
                subprocess.run(
                    ['ffmpeg', '-i', audio_path, '-y', '-ar', '22050', '-ac', '1', temp_wav.name],
                    check=True,
                    capture_output=True,
                    timeout=30
                )
                logger.info(f"✅ Converted to WAV: {temp_wav.name}")
                return temp_wav.name
            except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
                # Fallback to pydub if ffmpeg not available
                try:
                    from pydub import AudioSegment
                    audio = AudioSegment.from_file(audio_path)
                    audio = audio.set_frame_rate(22050).set_channels(1)
                    audio.export(temp_wav.name, format="wav")
                    logger.info(f"✅ Converted to WAV using pydub: {temp_wav.name}")
                    return temp_wav.name
                except ImportError:
                    logger.error("❌ Neither ffmpeg nor pydub available. Cannot convert audio.")
                    raise Exception("Audio conversion requires ffmpeg or pydub. Please install: pip install pydub")
        except Exception as e:
            logger.error(f"❌ Failed to convert audio: {e}")
            raise Exception(f"Failed to convert audio to WAV: {str(e)}")
    
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
        
        # Convert to WAV if needed
        converted_path = None
        try:
            converted_path = self._convert_to_wav(sample_path)
            audio_file_to_use = converted_path
        except Exception as e:
            logger.warning(f"⚠️ Could not convert audio, trying original: {e}")
            audio_file_to_use = sample_path
        
        audio_file_handle = None
        try:
            # Prepare input for Chatterbox model
            # Chatterbox expects 'audio_prompt' and 'prompt' (text)
            audio_file_handle = open(audio_file_to_use, "rb")
            input_data = {
                "prompt": text,
                "audio_prompt": audio_file_handle  # Replicate handles file upload
            }
            
            logger.info("📤 Sending request to Replicate...")
            
            # Run the model using async
            output = await asyncio.to_thread(
                replicate.run,
                self.model,
                input=input_data
            )
            
            # Close file handle after request
            if audio_file_handle:
                audio_file_handle.close()
                audio_file_handle = None
            
            logger.info("📥 Received response from Replicate")
            
            # Generate unique filename
            output_filename = f"{uuid.uuid4()}.wav"
            output_path = os.path.join(self.output_dir, output_filename)
            
            # Download the generated audio
            # Replicate can return either a URL string or a FileOutput object
            logger.info("💾 Downloading generated audio...")
            
            # Check if output is a string (URL) or a file-like object
            if isinstance(output, str):
                # It's a URL, download it
                logger.info(f"   Downloading from URL: {output}")
                response = requests.get(output, timeout=60)
                response.raise_for_status()
                with open(output_path, "wb") as file:
                    file.write(response.content)
            elif hasattr(output, 'read'):
                # It's a file-like object
                with open(output_path, "wb") as file:
                    file.write(output.read())
            else:
                # Try to convert to string and download
                output_url = str(output)
                logger.info(f"   Downloading from URL: {output_url}")
                response = requests.get(output_url, timeout=60)
                response.raise_for_status()
                with open(output_path, "wb") as file:
                    file.write(response.content)
            
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
        finally:
            # Close file handle if still open
            if audio_file_handle:
                try:
                    audio_file_handle.close()
                except:
                    pass
            
            # Clean up converted file if it was created
            if converted_path and converted_path != sample_path and os.path.exists(converted_path):
                try:
                    os.unlink(converted_path)
                    logger.debug(f"🧹 Cleaned up temporary file: {converted_path}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not delete temp file {converted_path}: {e}")
    
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
