import os
import tempfile
import logging
from typing import Optional

# import speech_recognition as sr
import speech_recognition as sr

logger = logging.getLogger("cvp.video")

def get_transcript_from_video(video_path: str) -> Optional[str]:
    """
    Extracts audio from a video file (or uses the uploaded audio directly) 
    and returns its transcript using Google's free speech recognition API.
    """
    is_audio = video_path.lower().endswith(('.mp3', '.wav', '.m4a', '.ogg', '.flac'))
    
    try:
        from moviepy import VideoFileClip, AudioFileClip
        
        audio_path = video_path + ".wav"

        if is_audio:
            logger.info("Provided file is audio-only, using AudioFileClip...")
            try:
                with AudioFileClip(video_path) as audio:
                    audio.write_audiofile(audio_path, logger=None)
            except Exception as e:
                logger.error(f"Moviepy extracting audio (from audio file) error: {e}")
                audio_path = video_path # Fallback to original
        else:
            # 1. Extract audio from video
            logger.info(f"Extracting audio from {video_path}")
            
            try:
                with VideoFileClip(video_path) as video:
                    if video.audio is None:
                        return "No audio found in this video."
                    video.audio.write_audiofile(audio_path, logger=None)
            except Exception as e:
                logger.error(f"Moviepy extracting audio error: {e}")
                return None
            
        if not os.path.exists(audio_path):
            return None
            
        # 2. Transcribe audio
        logger.info("Transcribing audio...")
        recognizer = sr.Recognizer()
        
        # We might need to split audio if it's too long, but let's try reading all first.
        # Google generic API rate limits or limits clip length. Usually handles 1-3 mins easily.
        text = ""
        with sr.AudioFile(audio_path) as source:
            # We record in chunks of 60 seconds just in case
            duration = int(source.DURATION)
            chunk_length = 30
            for i in range(0, duration, chunk_length):
                audio_data = recognizer.record(source, duration=chunk_length)
                try:
                    chunk_text = recognizer.recognize_google(audio_data)
                    text += chunk_text + " "
                except sr.UnknownValueError:
                    # Could not understand audio
                    pass
                except sr.RequestError as e:
                    logger.error(f"Google API request failed: {e}")
                    pass
                    
        # Cleanup
        try:
            os.remove(audio_path)
        except:
            pass
            
        return text.strip() if text.strip() else "Could not clear recognize any speech in this video."
        
    except Exception as e:
        logger.exception(f"Error in video transcription: {e}")
        return None
