#!/usr/bin/env bash
set -euo pipefail
ROOT=/opt/minimax-h3
chown -R awais:awais "$ROOT"
cat > /etc/systemd/system/minimax-comfy.service <<'UNIT'
[Unit]
Description=MiniMax H3 ComfyUI inference backend
After=network-online.target
Wants=network-online.target

[Service]
User=awais
Group=awais
WorkingDirectory=/opt/minimax-h3/ComfyUI
Environment=PYTHONUNBUFFERED=1
Environment=HF_HOME=/opt/minimax-h3/hf-cache
ExecStart=/opt/minimax-h3/venv/bin/python main.py --listen 127.0.0.1 --port 8188 --reserve-vram 2 --preview-method none
Restart=on-failure
RestartSec=10
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/systemd/system/minimax-app.service <<'UNIT'
[Unit]
Description=MiniMax H3 Gradio and private API
After=network-online.target minimax-comfy.service
Wants=minimax-comfy.service

[Service]
User=awais
Group=awais
WorkingDirectory=/opt/minimax-h3
Environment=PYTHONUNBUFFERED=1
Environment=H3_ROOT=/opt/minimax-h3
Environment=GRADIO_ANALYTICS_ENABLED=False
Environment=GRADIO_TEMP_DIR=/opt/minimax-h3/state/gradio
ExecStart=/opt/minimax-h3/venv/bin/uvicorn app:app --host 127.0.0.1 --port 7860 --workers 1
Restart=on-failure
RestartSec=10
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now minimax-comfy minimax-app
