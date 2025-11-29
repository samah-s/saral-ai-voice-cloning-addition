"""
Voice Cloning Service using Piper TTS
Piper is a fast, local neural text-to-speech system with voice cloning capabilities
"""
import os
from pathlib import Path
from typing import Dict, List
import re
import subprocess
import json
import torch
from TTS.api import TTS

def clean_script_for_tts(script_text):
    """Clean script text for TTS processing."""
    if not script_text or not script_text.strip():
        return ""

    script_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', script_text)
    script_text = re.sub(r'\*([^*]+)\*', r'\1', script_text)
    script_text = re.sub(r'#+\s*', '', script_text)
    script_text = re.sub(r'[^\w\s.,!?;:\-()"\']', ' ', script_text)
    script_text = re.sub(r'\s+', ' ', script_text)

    return script_text.strip()


def chunk_text(text: str, max_chunk_length: int = 250) -> List[str]:
    """Split text into chunks for TTS processing.
    Coqui XTTS works best with shorter chunks (200-300 characters).
    """
    if len(text) <= max_chunk_length:
        return [text]
    
    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 > max_chunk_length:
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            if len(sentence) > max_chunk_length:
                # Break long sentences at word boundaries
                words = sentence.split()
                temp_chunk = ""
                for word in words:
                    if len(temp_chunk) + len(word) + 1 > max_chunk_length:
                        chunks.append(temp_chunk.strip())
                        temp_chunk = word + " "
                    else:
                        temp_chunk += word + " "
                
                if temp_chunk:
                    current_chunk = temp_chunk
            else:
                current_chunk = sentence + " "
        else:
            current_chunk += sentence + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks


class CoquiVoiceCloner:
    """Coqui TTS XTTS client for voice cloning.
    
    Uses the XTTS-v2 model which supports multilingual voice cloning
    from a single audio sample.
    """
    
    def __init__(self, device: str = None):
        """Initialize Coqui TTS.
        
        Args:
            device: Device to use ('cuda', 'cpu', or None for auto-detect)
        """
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        
        self.device = device
        print(f"Initializing Coqui TTS on device: {device}")
        
        # Initialize XTTS model
        # This will download the model on first use (~2GB)
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        
    def test_connection(self) -> bool:
        """Test TTS initialization."""
        try:
            return self.tts is not None
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False
    
    def synthesize_text(
        self, 
        text: str, 
        output_path: str,
        speaker_wav: str,
        language: str = "en"
    ) -> bool:
        """
        Synthesize text to speech using voice cloning.
        
        Args:
            text: Text to synthesize
            output_path: Path to save the audio file
            speaker_wav: Path to the reference audio for voice cloning
            language: Language code (en, es, fr, de, it, pt, pl, tr, ru, nl, cs, ar, zh-cn, ja, hu, ko, hi)
        """
        try:
            # Generate speech with voice cloning
            self.tts.tts_to_file(
                text=text,
                speaker_wav=speaker_wav,
                language=language,
                file_path=output_path
            )
            
            print(f"✓ Audio generated: {output_path}")
            return True
                
        except Exception as e:
            print(f"TTS failed: {e}")
            return False
    
    def synthesize_long_text(
        self, 
        text: str, 
        output_path: str,
        speaker_wav: str,
        language: str = "en",
        max_chunk_length: int = 250
    ) -> bool:
        """
        Synthesize long text by chunking and concatenating.
        """
        try:
            chunks = chunk_text(text, max_chunk_length)
            print(f"Processing {len(chunks)} chunks...")
            
            if len(chunks) == 1:
                return self.synthesize_text(text, output_path, speaker_wav, language)
            
            # Generate chunks
            temp_dir = os.path.dirname(output_path)
            chunk_files = []
            
            for i, chunk in enumerate(chunks):
                chunk_path = os.path.join(temp_dir, f"temp_chunk_{i}.wav")
                if self.synthesize_text(chunk, chunk_path, speaker_wav, language):
                    chunk_files.append(chunk_path)
                else:
                    print(f"Failed to generate chunk {i}")
            
            if not chunk_files:
                return False
            
            # Concatenate chunks using ffmpeg
            if len(chunk_files) > 1:
                import subprocess
                list_file = os.path.join(temp_dir, "chunks_list.txt")
                with open(list_file, 'w') as f:
                    for chunk_file in chunk_files:
                        f.write(f"file '{os.path.abspath(chunk_file)}'\n")
                
                try:
                    subprocess.run([
                        'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
                        '-i', list_file, '-c', 'copy', output_path
                    ], check=True, capture_output=True)
                    
                    # Clean up temp files
                    for chunk_file in chunk_files:
                        os.remove(chunk_file)
                    os.remove(list_file)
                    
                except subprocess.CalledProcessError as e:
                    print(f"FFmpeg error: {e.stderr.decode() if e.stderr else e}")
                    # Fallback: use first chunk
                    import shutil
                    shutil.copy(chunk_files[0], output_path)
            else:
                import shutil
                shutil.copy(chunk_files[0], output_path)
            
            return True
            
        except Exception as e:
            print(f"Error in long text synthesis: {e}")
            return False


def ensure_voice_cloned_audio_is_generated(
    openai_api_key: str,
    paper_id: str,
    title_intro_script: str,
    sections_scripts: Dict[str, str],
    voice_sample_path: str,
    voice: str = "alloy"  # Kept for compatibility but not used
) -> Dict[str, List[str]]:
    """
    Generate audio files using Coqui TTS voice cloning.
    
    Args:
        openai_api_key: Not used (kept for compatibility)
        paper_id: Unique paper identifier
        title_intro_script: Title/introduction script text
        sections_scripts: Dictionary of section scripts
        voice_sample_path: Path to voice sample for cloning
        voice: Not used (kept for compatibility)
        
    Returns:
        Dict with audio_files list containing generated file names
    """
    
    audio_files = []
    output_dir = f"temp/audio/{paper_id}"
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    if not os.path.exists(voice_sample_path):
        raise ValueError(f"Voice sample not found at: {voice_sample_path}")

    # Initialize Coqui TTS
    try:
        client = CoquiVoiceCloner()
        
        if not client.test_connection():
            raise ValueError("Failed to initialize Coqui TTS")
        
        print("✓ Coqui TTS initialized successfully")
        print(f"✓ Using voice sample: {voice_sample_path}")
        
    except Exception as e:
        print(f"Coqui TTS initialization failed: {e}")
        raise ValueError(f"Failed to initialize Coqui TTS: {e}")

    successful_generations = 0

    try:
        # Generate title audio
        if title_intro_script and title_intro_script.strip():
            print("Generating title audio with Coqui TTS voice cloning...")
            title_audio_path = os.path.join(output_dir, "00_title_introduction.wav")
            
            cleaned_text = clean_script_for_tts(title_intro_script)
            if cleaned_text:
                success = client.synthesize_long_text(
                    text=cleaned_text,
                    output_path=title_audio_path,
                    speaker_wav=voice_sample_path,
                    language="en"
                )
                
                if success:
                    audio_files.append(title_audio_path)
                    successful_generations += 1
                    print(f"✓ Title audio: {title_audio_path}")

        # Generate section audios
        section_order = ["Introduction", "Methodology", "Results", "Discussion", "Conclusion"]
        
        for i, section_name in enumerate(section_order, start=1):
            if section_name in sections_scripts:
                script_text = sections_scripts[section_name]
                
                if not script_text or not script_text.strip():
                    continue

                print(f"Generating {section_name} audio with Coqui TTS...")
                audio_path = os.path.join(output_dir, f"{i:02d}_{section_name.lower()}.wav")
                
                cleaned_text = clean_script_for_tts(script_text)
                if cleaned_text:
                    success = client.synthesize_long_text(
                        text=cleaned_text,
                        output_path=audio_path,
                        speaker_wav=voice_sample_path,
                        language="en"
                    )
                    
                    if success:
                        audio_files.append(audio_path)
                        successful_generations += 1
                        print(f"✓ {section_name} audio: {audio_path}")

        if successful_generations == 0:
            raise ValueError("No audio files were generated successfully")

        print(f"✓ Generated {successful_generations} audio files with Coqui TTS")
        
        return {
            "audio_files": [Path(f).name for f in audio_files]
        }

    except Exception as e:
        print(f"Coqui TTS audio generation error: {e}")
        raise