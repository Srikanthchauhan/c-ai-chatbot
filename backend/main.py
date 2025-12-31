"""
Ai Chatbot - Advanced Answer Engine Backend
FastAPI server with Groq (FREE) for intelligent Q&A
"""

import os
import json
import asyncio
import base64
import io
import traceback
from typing import AsyncGenerator, Optional, List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path
from PIL import Image

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from groq import Groq
from tavily import TavilyClient
from pypdf import PdfReader

# Load environment variables from .env file in backend folder
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Initialize Groq client (FREE API)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Available Models as of December 2025
TEXT_MODEL = "llama-3.3-70b-versatile"
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

# Initialize FastAPI app
app = FastAPI(
    title="Ai Chatbot - Answer Engine",
    description="An advanced AI-powered answer engine with real-time web search",
    version="1.2.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# System prompt defining Ai Chatbot's personality
SYSTEM_PROMPT = """You are Ai Chatbot, an advanced knowledge engine.

Your core principles:
1. **Accuracy First**: Always prioritize factual correctness.
2. **Citations**: When search results are provided, ALWAYS cite sources.
3. **Extraction**: If an image is provided, your job is to extract and transcribe all text perfectly.
4. **Context**: Use provided PDF/Image extraction to answer the user's question accurately."""

class ChatMessage(BaseModel):
    role: str
    content: str
    class Config:
        extra = "ignore" 

class Source(BaseModel):
    title: str
    url: str
    snippet: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[Source] = []
    used_search: bool = False

def get_tavily_client():
    api_key = os.getenv("TAVILY_API_KEY")
    if api_key and api_key != "your_tavily_api_key_here" and len(api_key) > 10:
        try:
            return TavilyClient(api_key=api_key)
        except:
            return None
    return None

def determine_search_needed(message: str, history: List[ChatMessage]) -> bool:
    search_indicators = ["what is", "who is", "when did", "latest", "news", "price", "stock", "update"]
    message_lower = message.lower()
    for indicator in search_indicators:
        if indicator in message_lower:
            return True
    return False

def search_web(query: str) -> tuple[str, List[Source]]:
    tavily = get_tavily_client()
    sources = []
    context = ""
    if tavily:
        try:
            response = tavily.search(query=query, search_depth="basic", max_results=3)
            for result in response.get("results", []):
                sources.append(Source(
                    title=result.get("title", "Unknown"),
                    url=result.get("url", "#"),
                    snippet=result.get("content", "")[:300]
                ))
            context = "Search Results:\n"
            for i, result in enumerate(response.get("results", []), 1):
                context += f"\n{i}. **{result.get('title', 'Unknown')}**\n"
                context += f"   URL: {result.get('url', '')}\n"
                context += f"   {result.get('content', '')[:500]}\n"
        except Exception as e:
            print(f"Search error: {e}")
    return context, sources

async def process_file_content(file: UploadFile) -> tuple[Optional[str], Optional[str], Optional[str]]:
    if not file: return None, None, None
    try:
        content = await file.read()
        filename = file.filename.lower()
        if filename.endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
            image = Image.open(io.BytesIO(content))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Groq Llama 4 requirement: min 16px in each dimension
            width, height = image.size
            if width < 32 or height < 32:
                new_width = max(width, 64)
                new_height = max(height, 64)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                
            # Max dimension check
            max_dim = 1200
            if max(image.size) > max_dim:
                image.thumbnail((max_dim, max_dim))
                
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=85) 
            buffer.seek(0)
            encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return None, f"data:image/jpeg;base64,{encoded}", "image/jpeg"
        elif filename.endswith('.pdf'):
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)
            text = f"--- Content from PDF ({file.filename}) ---\n"
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted: text += extracted + "\n"
            return text, None, "application/pdf"
    except Exception as e:
        print(f"Process error: {e}")
    return None, None, None

@app.get("/")
async def root():
    return {"status": "online", "message": "Ai Chatbot is ready to extract content using Llama 4 Scout Vision."}

@app.post("/chat/stream")
async def chat_stream(
    message: str = Form(...),
    conversation_history: str = Form("[]"),
    file: Optional[UploadFile] = File(None)
):
    print(f"DEBUG RECV: {message[:50]}... File: {file.filename if file else 'NONE'}")
    
    file_text, file_image_url, _ = await process_file_content(file)
    try:
        history_data = json.loads(conversation_history)
        history = [ChatMessage(**msg) for msg in history_data]
    except:
        history = []

    async def generate() -> AsyncGenerator[str, None]:
        try:
            # Short system prompt
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            
            # Trim history
            history_to_use = history[-5:] if file_image_url else history[-10:]
            for msg in history_to_use:
                role = "user" if msg.role == "user" else "assistant"
                messages.append({"role": role, "content": str(msg.content)})
            
            needs_search = determine_search_needed(message, history)
            search_context = ""
            if needs_search and not file_image_url:
                search_context, sources = search_web(message)
                if sources:
                    yield f"data: {json.dumps({'type': 'sources', 'content': [s.model_dump() for s in sources]})}\n\n"
            
            yield f"data: {json.dumps({'type': 'status', 'content': 'thinking'})}\n\n"
            
            prompt_text = message
            if file_text:
                prompt_text = f"{message}\n\n[DOCUMENT TEXT]:\n{file_text[:30000]}"
            
            if search_context:
                prompt_text = f"Search Context:\n{search_context}\n\nUser Question: {prompt_text}"

            if file_image_url:
                # Llama 4 Scout Vision
                model = VISION_MODEL
                vision_msg = {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"User Request: {message}\n\nIMPORTANT: Take an extremely close look at this image. Extract every piece of text exactly as it appears. Provide a highly detailed analysis of the visual contents and answer the user request."},
                        {"type": "image_url", "image_url": {"url": file_image_url}}
                    ]
                }
                messages.append(vision_msg)
            else:
                model = TEXT_MODEL
                messages.append({"role": "user", "content": prompt_text})
            
            print(f"DEBUG CALL: Model {model}")
            
            try:
                stream = groq_client.chat.completions.create(
                    model=model, # type: ignore
                    messages=messages,
                    temperature=0.35, 
                    max_tokens=2048,
                    stream=True,
                )
                
                found_content = False
                for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        found_content = True
                        yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                
                if not found_content:
                    yield f"data: {json.dumps({'type': 'error', 'content': 'Model returned no content. Please ensure the image is clear and contains no restricted information.'})}\n\n"
                else:
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as api_err:
                print(f"GROQ API ERROR: {api_err}")
                yield f"data: {json.dumps({'type': 'error', 'content': f'API Error: {str(api_err)}'})}\n\n"
                
        except Exception as e:
            print(f"Stream error: {e}")
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
