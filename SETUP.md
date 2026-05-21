# 🚀 FuelDocs OCR Tool - Setup Guide

## System Requirements

- **macOS 10.14+**, **Windows 10+**, or **Linux**
- **Python 3.10 or newer** (installer will check this)
- **4GB RAM minimum** (8GB recommended)
- **Internet connection** (for LLM provider)

---

## Installation (One-Click Setup)

### Step 1: Extract the Package
Download and extract the OCR tool folder to your desired location.

### Step 2: Run the Startup Script
Open Terminal/Command Prompt in the OCR tool folder and run:

```bash
./start.sh
```

**On Windows**, double-click `start.bat` instead.

The script will automatically:
- ✓ Check for Python 3
- ✓ Create a virtual environment
- ✓ Install all dependencies
- ✓ Set up the database
- ✓ Start both services

### Step 3: Open the App
Once you see this message:
```
Frontend: http://localhost:5173
```

Open your browser and go to: **http://localhost:5173**

---

## First-Time Configuration

### 1. Get an LLM API Key

We support three LLM providers (free or low-cost):

#### **Google Gemini (RECOMMENDED - Free)**
- Go to: https://aistudio.google.com/apikey
- Click "Create API Key"
- Copy the key (looks like: `AIzaSy...`)
- **Free quota:** ~1,500 requests/day

#### OpenRouter (Paid - $5-25/month)
- Go to: https://openrouter.ai/keys
- Create an account
- Generate API key
- Add credits ($5 minimum)

#### Ollama (Free - Runs Locally, Offline)
- Download: https://ollama.ai
- Install and run
- Models download automatically (requires 4-8GB disk space)

### 2. Configure in the App

1. Click **Settings** (gear icon) in the app
2. Select your LLM Provider
3. Paste your API key
4. Click **Save**
5. You'll see a green **✓ ok** when configured correctly

---

## Usage

### Upload Documents
1. Click **Upload** page
2. Drag & drop delivery tickets or Bills of Lading (BoL)
3. Supported formats: PNG, JPG, PDF, TIFF

### Review Extractions
1. Go to **Dashboard** to see all documents
2. Extracted documents show with confidence score
3. Low-confidence extractions go to **Review Queue**
4. Click to correct any fields

### Export Data
1. Go to **Dashboard**
2. Click **Export to Excel** to download all extracted data

### Manage Delivery Sites (Optional)
1. Click **Settings** → **Delivery Sites**
2. Upload a CSV file with columns: `site_name`, `address`, `phone`
3. Used for fuzzy-matching suggestions during review

---

## Troubleshooting

### "Python not found"
**Fix:** Install Python 3.10+ from https://www.python.org/downloads

### "Port 8000 already in use"
**Fix:** Change the port in `backend/.env`:
```
API_PORT=8001
```

### "API key not working"
**Check:**
- Copy the exact API key (no spaces before/after)
- Verify key is active in provider dashboard
- Try a test extraction to see the error message

### Extraction quality is low
**Improve by:**
- Scanning documents at 300+ DPI
- Ensuring text is clear and legible
- Checking document formatting is standard

### App won't start
**Try:**
1. Kill existing Python processes: `pkill -f uvicorn`
2. Delete `backend/app.db` to reset database
3. Run `./start.sh` again

---

## Support

For issues or feature requests:
1. Check logs in the terminal running the app
2. Screenshot any error messages
3. Contact: [support email or link]

---

## Data Privacy

- ✓ Database stored locally on your machine
- ✓ Documents saved in `backend/uploads/`
- ✓ No data sent to us (only to chosen LLM provider)
- ✓ Your API key stored in `.env` file (keep private)

---

## Next Steps

After setup:
1. Upload sample delivery documents
2. Verify extraction accuracy
3. Add your delivery sites list (optional)
4. Configure review workflow for your team

Enjoy! 🎉
