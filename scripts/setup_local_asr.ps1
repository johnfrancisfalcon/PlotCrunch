# scripts/setup_local_asr.ps1
# PowerShell script to install whisper.cpp and a base model for Local ASR

param(
    [string]$Cuda = "auto",    # auto | 12.4 | 11.8 | cpu
    [string]$Model = "base.en" # base.en | base
)

$ErrorActionPreference = "Stop"

Write-Host "=== PlotCrunch Local ASR Setup ==="

# Create folders
New-Item -ItemType Directory -Path "bin" -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Path "models" -ErrorAction SilentlyContinue | Out-Null

# Define URLs
$WHISPER_CUDA_124 = "https://sourceforge.net/projects/whisper-cpp.mirror/files/v1.7.6/whisper-cublas-12.4.0-bin-x64.zip/download"
$WHISPER_CUDA_118 = "https://sourceforge.net/projects/whisper-cpp.mirror/files/v1.7.6/whisper-cublas-11.8.0-bin-x64.zip/download"
$WHISPER_CPU_X64  = "https://sourceforge.net/projects/whisper-cpp.mirror/files/v1.7.6/whisper-bin-x64.zip/download"

$MODEL_BASE_EN    = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
$MODEL_BASE_MULTI = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"

# Detect CUDA if auto
if ($Cuda -eq "auto") {
    try {
        $nvidia = & nvidia-smi | Out-String
        if ($nvidia -match "CUDA Version: 12") {
            $Cuda = "12.4"
        } elseif ($nvidia -match "CUDA Version: 11") {
            $Cuda = "11.8"
        } else {
            $Cuda = "cpu"
        }
    } catch {
        Write-Host "No NVIDIA GPU detected. Falling back to CPU build."
        $Cuda = "cpu"
    }
}

# Pick binary URL
switch ($Cuda) {
    "12.4" { $url = $WHISPER_CUDA_124; $desc = "CUDA 12.4 build" }
    "11.8" { $url = $WHISPER_CUDA_118; $desc = "CUDA 11.8 build" }
    "cpu"  { $url = $WHISPER_CPU_X64;  $desc = "CPU x64 build" }
    default { throw "Invalid Cuda value: $Cuda" }
}

Write-Host "Downloading whisper.cpp ($desc)..."
Invoke-WebRequest -Uri $url -OutFile "bin\whisper.zip"

Write-Host "Extracting..."
Expand-Archive "bin\whisper.zip" -DestinationPath "bin" -Force
Remove-Item "bin\whisper.zip"

# If nested Release folder, move files up
$releaseDir = Get-ChildItem -Path "bin" -Recurse -Directory | Where-Object { $_.Name -eq "Release" }
if ($releaseDir) {
    Get-ChildItem "$($releaseDir.FullName)\*" | Move-Item -Destination "bin" -Force
}

# If nested whisper-bin-x64 folder, move up
$nested = Get-ChildItem -Path "bin" -Directory | Where-Object { $_.Name -like "whisper*" }
foreach ($d in $nested) {
    Get-ChildItem "$($d.FullName)\*" | Move-Item -Destination "bin" -Force
}

# Pick model URL
switch ($Model) {
    "base.en" { $modelUrl = $MODEL_BASE_EN; $modelName = "ggml-base.en.bin" }
    "base"    { $modelUrl = $MODEL_BASE_MULTI; $modelName = "ggml-base.bin" }
    default { throw "Invalid Model value: $Model" }
}

Write-Host "Downloading model ($Model)..."
Invoke-WebRequest -Uri $modelUrl -OutFile "models\$modelName"

# Verification
if (-not (Test-Path "bin\whisper.exe")) {
    throw "Setup failed: whisper.exe not found in ./bin"
}
if (-not (Test-Path "models\$modelName")) {
    throw "Setup failed: model file not found in ./models"
}

Write-Host "✅ Local ASR setup complete!"
Write-Host "Binary: bin\whisper.exe"
Write-Host "Model: models\$modelName"

Write-Host "`nTo test, run:"
Write-Host ".\bin\whisper.exe -m .\models\$modelName -f uploads\<job-id>\audio.mp3 --translate --output-txt --gpu"
