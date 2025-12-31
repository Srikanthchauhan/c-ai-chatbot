# Ai Chatbot - Advanced Answer Engine

A sophisticated, production-ready AI Answer Engine with a beautiful animated UI.

![Ai Chatbot](https://img.shields.io/badge/Ai%20Chatbot-Answer%20Engine-6366f1?style=for-the-badge)

## Features

- 🤖 **Smart AI Agent** - Uses LangChain with GPT-4o-mini for intelligent responses
- 🔍 **Real-time Web Search** - Powered by Tavily API for current information
- ✨ **Beautiful UI** - Dark mode with glassmorphism effects and smooth animations
- 📝 **Markdown Support** - Rich text formatting with syntax-highlighted code blocks
- 🔗 **Citations** - Sources displayed as clickable cards when web search is used
- ⚡ **Streaming Responses** - Real-time typewriter effect for answers
- 📱 **Responsive Design** - Mobile-first, works on all devices

## Tech Stack

### Frontend
- React 18 (Vite)
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)
- React Markdown

### Backend
- Python FastAPI
- LangChain (AI Agent)
- Tavily API (Web Search)
- OpenAI GPT-4o-mini

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- OpenAI API Key
- Tavily API Key (free at https://tavily.com)

### 1. Clone and Setup

```bash
cd chatbot
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env and add your API keys
```

### 3. Configure API Keys

Edit `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### 4. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Open the App

Navigate to `http://localhost:3000` in your browser.

## Project Structure

```
chatbot/
├── backend/
│   ├── main.py              # FastAPI server with Ai Chatbot personality
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── .env                 # Your API keys (create this)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main chat interface
│   │   ├── components/
│   │   │   ├── MessageBubble.jsx      # Message rendering
│   │   │   ├── ThinkingIndicator.jsx  # Loading animation
│   │   │   └── SourceCard.jsx         # Citation cards
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/chat` | POST | Non-streaming chat |
| `/chat/stream` | POST | Streaming chat (SSE) |
| `/memory` | DELETE | Clear conversation memory |

## How It Works

1. **User asks a question** → Frontend sends to `/chat/stream`
2. **Agent analyzes** → Determines if web search is needed
3. **Search (if needed)** → Tavily API fetches relevant results
4. **Generate answer** → GPT-4o-mini creates response with citations
5. **Stream response** → Answer streams back with typewriter effect
6. **Display sources** → Citation cards shown if search was used

## Customization

### Change AI Personality

Edit the `SYSTEM_PROMPT` in `backend/main.py`:

```python
SYSTEM_PROMPT = """You are Ai Chatbot, an advanced knowledge engine..."""
```

### Modify Colors

Edit `frontend/tailwind.config.js`:

```javascript
colors: {
  'c-primary': '#6366f1',    // Main purple
  'c-secondary': '#8b5cf6',  // Light purple
  'c-accent': '#06b6d4',     // Cyan accent
}
```

## Troubleshooting

### "Connection refused" error
- Make sure the backend is running on port 8000
- Check that CORS is properly configured

### "API key invalid" error
- Verify your OpenAI and Tavily API keys in `.env`
- Ensure no extra spaces or quotes around keys

### Slow responses
- First request may be slow due to model loading
- Subsequent requests will be faster

## License

MIT License - feel free to use for any purpose.

---

Built with ❤️ using React, FastAPI, and LangChain
