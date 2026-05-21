# FuelDocs OCR Tool

An AI-powered OCR tool to extract data from fuel delivery tickets and Bills of Lading.

## Quick Start

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| macOS (Apple Silicon) | M1 / M2 / M3 / M4 |
| Python 3.11+ | `python3 --version` |
| Node.js 18+ | `node --version` |

### First-time setup

```bash
# 1. Start the app
chmod +x start.sh
./start.sh

# 2. Open http://localhost:5173
# 3. Go to Settings → select LLM provider → paste API key
```

### LLM Provider options

| Provider | Cost | Setup | Internet needed |
|----------|------|-------|-----------------|
| **Google Gemini** (recommended) | Free (~1,500 req/day) | Get key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Yes |
| **OpenRouter** | Free credits + pay-as-you-go | Get key at [openrouter.ai](https://openrouter.ai) | Yes |
| **Ollama** (offline) | Free | Install [ollama.com](https://ollama.com/download) + `ollama pull qwen2.5vl:7b` | No |

---

## What it does

- Scans delivery ticket and BoL images (JPG, PNG, TIFF, BMP)
- Extracts: **Date, Manifest No, BoL, Delivery Point, Regular, Super, Diesel**
- Shows a **confidence score** per field (0–100%)
- Any field below **80% confidence** → routed to **Human Review queue**
- No auto-corrections — all AI suggestions require human approval
- One-click **Excel export** (.xlsx)

## Using the app

| Page | Purpose |
|------|---------|
| **Upload** | Drag & drop or browse for document images |
| **Dashboard** | View all extracted data, filter by status, export to Excel |
| **Review** | Review and correct low-confidence extractions |
| **Settings** | Select LLM provider, manage API keys, add delivery sites |

## Adding delivery sites

1. Go to **Settings → Delivery Sites**
2. Paste your list of 200–300 site names (one per line)
3. Click **Save Sites**

The AI will suggest the closest matching site name during review — you still confirm or correct it manually.

## Scanning tips

- Use a **flatbed multi-document scanner** for best results
- Scan at **300 DPI** minimum
- Ensure documents lie flat — no shadows or folded corners
- Combined images (delivery ticket + BoL side by side) are supported

## Architecture

```
frontend (React + Vite + Tailwind)  →  backend (FastAPI + SQLite)  →  LLM (Gemini / OpenRouter / Ollama)
```

With Gemini or OpenRouter, images are sent to the cloud API for processing.  
With Ollama, all data stays on your local machine (no internet required).
# OCR-tool
