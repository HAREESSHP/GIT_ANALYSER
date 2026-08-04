# 🆓 RAG Setup Guide (No Downloads Required)

This guide explains how to set up the **free** RAG (Retrieval-Augmented Generation) feature for the GitHub Insight app.

## Two Modes

| Mode | Downloads | Cost | Privacy | Best For |
|------|-----------|------|---------|----------|
| **☁️ Cloud (default)** | None | Free tier | Data sent to Google | Quick setup, no installs |
| **💻 Local** | Ollama + ChromaDB | $0 | 100% offline | Privacy, no internet |

---

## ☁️ MODE 1: Cloud (Google Gemini) — No Downloads

This is the **default** mode. It uses Google's free Gemini API for both embeddings and text generation, and an in-memory vector store (no database needed).

### Setup (2 minutes)

1. **Get a free Gemini API key** (no credit card required):
   - Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - Sign in with your Google account
   - Click "Create API key"
   - Copy the key

2. **Add it to `backend/.env`:**
   ```env
   RAG_MODE=cloud
   GEMINI_API_KEY=your_free_gemini_api_key_here
   GEMINI_EMBED_MODEL=gemini-embedding-001
   GEMINI_LLM_MODEL=gemini-flash-latest
   ```

3. **Restart the backend** — that's it! No other installs needed.

### Free Tier Limits
- **gemini-flash-latest**: Free tier with generous daily limits (plenty for personal use)
- **gemini-embedding-001**: Free tier for embeddings
- No credit card required

---

## 💻 MODE 2: Local (Ollama + ChromaDB) — Fully Offline

Use this if you want everything to run locally with no internet dependency.

### 1. Install Ollama (free local LLM)

**Windows:**
1. Download from [ollama.com/download](https://ollama.com/download)
2. Install and run the installer

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull the required models

```bash
# Embedding model (for semantic search)
ollama pull nomic-embed-text

# LLM model (for generating answers) - choose one:
ollama pull llama3.2        # ~2GB, fast, good quality (recommended)
# or
ollama pull mistral         # ~4.1GB, better quality, slower
# or
ollama pull phi3            # ~2.2GB, lightweight
```

### 3. Install ChromaDB (free local vector database)

**Option A: Python (recommended)**
```bash
pip install chromadb
chroma run --path ./chroma-data --port 8000
```

**Option B: Docker**
```bash
docker run -p 8000:8000 chromadb/chroma
```

### 4. Configure `backend/.env`

```env
RAG_MODE=local
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=llama3.2
CHROMA_URL=http://localhost:8000
```

### 5. Start services

1. **Start ChromaDB**: `chroma run --path ./chroma-data --port 8000`
2. **Start Ollama**: `ollama serve` (usually already running as a service)
3. **Start backend**: `cd backend && npm run dev`
4. **Start frontend**: `cd frontend && npm run dev`

---

## How It Works

1. **Indexing**: When you analyze a profile, the backend automatically:
   - Chunks each repository into a text document (name, description, language, stars, forks, URL)
   - Generates embeddings (via Gemini API in cloud mode, or Ollama in local mode)
   - Stores them in the vector store (in-memory in cloud mode, or ChromaDB in local mode)

2. **Retrieval**: When you ask a question:
   - The question is embedded using the same model
   - Semantic (cosine) search finds the most relevant chunks
   - Only chunks for the current profile are retrieved

3. **Generation**: 
   - The retrieved chunks + your question are sent to the LLM (Gemini or Ollama)
   - The LLM generates a grounded answer with source citations
   - Sources are displayed in the UI and expandable

## Troubleshooting

### "RAG Offline" status in the UI
- **Cloud mode**: Make sure `GEMINI_API_KEY` is set in `backend/.env` and the backend is restarted
- **Local mode**: Make sure Ollama and ChromaDB are running

### "No indexed data found"
- The profile must be analyzed **after** RAG is configured
- Re-analyze the profile to index its repositories

### Gemini API errors
- Check your API key is correct
- Check free tier limits
- Try a different model: `GEMINI_LLM_MODEL=gemini-2.0-flash` or `gemini-flash-lite-latest`

### Slow first answer (local mode)
- The first request may be slow as the model loads into memory
- Subsequent requests will be faster

## Cost

**$0.00** in both modes:
- **Cloud**: Google Gemini free tier (no credit card)
- **Local**: Everything runs on your machine

## Customization

- **Cloud LLM**: Set `GEMINI_LLM_MODEL` (e.g. `gemini-flash-latest`, `gemini-flash-lite-latest`, `gemini-2.0-flash`)
- **Cloud embeddings**: Set `GEMINI_EMBED_MODEL` (e.g. `gemini-embedding-001`, `gemini-embedding-2`)
- **Local LLM**: Set `OLLAMA_LLM_MODEL` (e.g. `mistral`, `phi3`, `llama3.2`)
- **Adjust retrieval**: Change `topK` in `retrieveChunks()` in `backend/rag.js`
- **Adjust answer style**: Modify the `systemPrompt` in `generateAnswer()` in `backend/rag.js`