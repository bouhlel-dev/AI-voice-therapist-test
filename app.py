from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import whisper
from gtts import gTTS
from google.cloud import texttospeech
import requests
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import edge_tts
import uuid
from datetime import datetime


# Optional: Only import pydub if available
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except Exception:
    PYDUB_AVAILABLE = False
    print("⚠️ pydub not available, audio speedup disabled")

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Set Google Cloud credentials
GOOGLE_CREDS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if GOOGLE_CREDS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_CREDS

if not GEMINI_API_KEY or not SUPABASE_KEY or not SUPABASE_URL:
    raise ValueError("Missing API Keys. Check your .env file.")

# FastAPI App (removed Flask)
app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper Model
model = whisper.load_model("tiny")
print("✅ Whisper model loaded successfully!")

# Google Gemini API Config - Use v1 API with correct model name
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

# Supabase Setup
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
async def root():
    """Returns intro audio file"""
    if os.path.exists("intro.mp3"):
        return FileResponse("intro.mp3", media_type="audio/mpeg")
    return {"message": "AI Therapist API is running with Gemini AI!"}

@app.post("/chat/audio")
async def chat_audio(file: UploadFile = File(...)):
    """Handles audio input, transcribes it, gets AI response, and converts it back to speech."""
    try:
        audio_path = "input.wav"
        with open(audio_path, "wb") as f:
            f.write(await file.read())

        result = model.transcribe(audio_path)
        user_input = result["text"].strip()

        if not user_input:
            return JSONResponse(content={"error": "No speech detected"}, status_code=400)

        ai_response = get_gemini_response(user_input)

        if not ai_response:
            return JSONResponse(content={"error": "Failed to get AI response"}, status_code=500)

        audio_output_path = await generate_speech(ai_response)

        return {
            "message": user_input,
            "response": ai_response,
            "audio_url": f"http://127.0.0.1:8000/audio/{audio_output_path}"
        }
    except Exception as e:
        print(f"🔥 Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/chat/text")
async def chat_text(input_text: str = Form(...)):
    """Handles text input and gets AI response with an optional audio reply."""
    try:
        input_text = input_text.strip()
        if not input_text:
            return JSONResponse(content={"error": "Empty message"}, status_code=400)

        ai_response = get_gemini_response(input_text)

        if not ai_response:
            return JSONResponse(content={"error": "Failed to get AI response"}, status_code=500)

        audio_output_path = await generate_speech(ai_response)

        return {
            "message": input_text,
            "response": ai_response,
            "audio_url": f"http://127.0.0.1:8000/audio/{audio_output_path}"
        }
    except Exception as e:
        print(f"🔥 Error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serves the generated audio file with no-cache headers."""
    file_path = os.path.abspath(filename)
    if not os.path.exists(file_path):
        return JSONResponse(content={"error": "File not found"}, status_code=404)

    # Add cache-busting headers
    return FileResponse(
        file_path, 
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

def get_gemini_response(user_input: str) -> str:
    """Calls Gemini API and returns response text."""
    try:
        payload = {
            "contents": [{"parts": [{"text": f"Hey, be a chill therapist and keep it short and optimize the response for tts so it sound clear and natural and dont use emojis : {user_input}"}]}],
            "generationConfig": {"maxOutputTokens": 150}
        }
        headers = {"Content-Type": "application/json"}
        
        print(f"📤 Sending to Gemini: {user_input}")
        response = requests.post(GEMINI_API_URL, json=payload, headers=headers)
        
        print(f"📥 Gemini Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"🔥 Gemini Error Response: {response.text}")
            return "Sorry, I'm having trouble connecting right now. Can you try again?"

        response_data = response.json()
        print(f"📦 Full Gemini Response: {response_data}")
        
        # Extract text from response
        try:
            text = response_data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"✅ Gemini Response: {text}")
            return text
        except (KeyError, IndexError) as e:
            print(f"🔥 Error parsing response: {e}")
            print(f"Response structure: {response_data}")
            return "Hey! I'm here, but I'm having a moment. Try asking again?"
    
    except Exception as e:
        print(f"🔥 Gemini API Error: {e}")
        import traceback
        traceback.print_exc()
        return "Oops, something went wrong on my end."



async def generate_speech(text: str) -> str:
    """Converts text to speech using Edge TTS asynchronously."""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    output_audio = f"response_{timestamp}_{unique_id}.mp3"

    try:
        #options en-US-GuyNeural, en-US-JennyNeural, en-US-AriaNeural,
        #en-GB-RyanNeural, en-GB-SoniaNeural, en-AU-NatashaNeural, en-AU-WilliamNeural
        voice = "en-US-GuyNeural"

        communicate = edge_tts.Communicate(
            text, 
            voice,
            rate="+10%",
            pitch="+0Hz"
        )

        await communicate.save(output_audio)
        print(f"✅ Generated natural audio with Edge TTS: {output_audio}")

        return output_audio

    except Exception as e:
        print(f"🔥 Edge TTS failed, falling back to gTTS: {e}")
        # Fallback
        from gtts import gTTS
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(output_audio)
        return output_audio


def generate_speech_google(text: str) -> str:
    """Uses Google Cloud TTS to generate custom voice speech."""
    client = texttospeech.TextToSpeechClient()
    
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Wavenet-F",
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
    )
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    
    response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    output_audio = f"response_google_{timestamp}_{unique_id}.mp3"
    
    with open(output_audio, "wb") as out:
        out.write(response.audio_content)

    return output_audio

# Run with: uvicorn app:app --reload
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)