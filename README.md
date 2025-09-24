# PlotCrunch
AI-powered tool that summarizes long videos into short, engaging recaps.

## Local ASR (Whisper.cpp Setup)

By default, PlotCrunch uses **Local ASR (whisper.cpp)** for transcription.  
If Local is not available, it can fall back to external APIs (OpenAI/Groq).

### Quick Setup (Windows)

Run the setup script:

```powershell
pwsh -File scripts/setup_local_asr.ps1
