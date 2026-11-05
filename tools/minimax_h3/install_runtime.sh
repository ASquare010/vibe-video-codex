#!/usr/bin/env bash
set -euo pipefail
ROOT=/opt/minimax-h3
if [ ! -d "$ROOT/ComfyUI/.git" ]; then
    git clone --depth 1 https://github.com/Comfy-Org/ComfyUI.git "$ROOT/comfy-source"
    mkdir -p "$ROOT/ComfyUI"
    cp -a "$ROOT/comfy-source/." "$ROOT/ComfyUI/"
fi
python3 -m venv "$ROOT/venv"
"$ROOT/venv/bin/pip" install --upgrade pip
"$ROOT/venv/bin/pip" install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu130
"$ROOT/venv/bin/pip" install -r "$ROOT/ComfyUI/requirements.txt"
"$ROOT/venv/bin/pip" install gradio fastapi uvicorn python-multipart huggingface-hub httpx
curl -fsSL https://raw.githubusercontent.com/Comfy-Org/workflow_templates/main/templates/video_minimax_h3_r2v.json -o "$ROOT/reference-workflow.json"
"$ROOT/venv/bin/pip" freeze > "$ROOT/installed-requirements.txt"
git -C "$ROOT/ComfyUI" rev-parse HEAD > "$ROOT/comfy-revision.txt"
date -Is > "$ROOT/runtime.done"
