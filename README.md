# PlotCrunch
AI-powered tool that summarizes long videos into short, engaging recaps.

## Local ASR (whisper.cpp)

You can run transcription locally without external APIs using whisper.cpp.

Setup:
- Download whisper.cpp binary from `https://github.com/ggerganov/whisper.cpp/releases`.
- Place the binary in `./bin` (`whisper.exe` on Windows or `whisper` on macOS/Linux).
- Download a model file (e.g., `ggml-base.en.bin` for English, or `ggml-base.bin` for multilingual) and place it in `./models`.
- Create `.env.local` and optionally set defaults:
  - `ASR_PROVIDER=local` (default engine if not specified per job in UI)
  - `OPENAI_API_KEY` (for External mode / fallback)
  - `GROQ_API_KEY` (optional fallback when OpenAI fails)
- Run `npm run dev`.

Behavior:
- In the Options panel, choose Transcription Engine: Local (offline) or External API.
- Local uses whisper.cpp; External tries OpenAI then Groq (if key present), then falls back to Local if available.
- English summaries add `--translate` to whisper.cpp and `translate=true` to cloud ASR.

Notes:
- Large model files are ignored via `.gitignore` (`/bin`, `/models`).
- For cost control during testing, you can limit transcription duration via `MAX_TRANSCRIBE_SECONDS` (default 60 seconds).