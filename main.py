from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import google.generativeai as genai

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost",
    "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = "AIzaSyCliZoTatOYM6Y0DnzCjG_lJ50x57qyDYU"
genai.configure(api_key=GEMINI_API_KEY)

try:
    gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
    print("✅ Gemini AI connected successfully!")
except Exception as e:
    print(f"❌ Gemini AI connection failed: {e}")
    gemini_model = None

def generate_with_gemini(prompt: str) -> str:
    if gemini_model is None:
        raise RuntimeError("Gemini model not initialized")
    response = gemini_model.generate_content(prompt)
    return response.text

def create_gemini_prompt(genre: str, theme: str, character: str) -> str:
    return f"""
Generate a compelling, concise story idea suitable for a professional writer.
Focus on these core elements:

Genre: {genre}
Theme: {theme}
Main Character: {character}

The idea should be a single, inspiring paragraph (50-80 words) that includes:
- A clear, intriguing premise for the character.
- The central conflict or unique challenge they face.
- A strong emotional hook.
"""

@app.post("/api/generate-ai-story")
async def generate_ai_story(request: Request):
    """Generates an AI-enhanced story idea based on user selections."""
    try:
        data = await request.json()

        genre_selection = data.get('genres', [])
        theme_selection = data.get('themes', [])
        character_selection = data.get('character_types', [])

        if not all([genre_selection, theme_selection, character_selection]):
            raise HTTPException(
                status_code=400,
                detail="Please select a Genre, Theme, and Character to generate a story."
            )

        selected_genre = genre_selection[0]
        selected_theme = theme_selection[0]
        selected_character = character_selection[0]

        gemini_prompt = create_gemini_prompt(selected_genre, selected_theme, selected_character)
        ai_story = generate_with_gemini(gemini_prompt)

        if not ai_story:
            raise HTTPException(status_code=503, detail="The AI service is currently unavailable. Please try again later.")

        response = {
            'story_prompt': ai_story,
            'components': { 'genre': selected_genre, 'theme': selected_theme, 'character': selected_character },
            'timestamp': datetime.now().isoformat(),
            'ai_generated': True
        }
        return JSONResponse(content=response)
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")
