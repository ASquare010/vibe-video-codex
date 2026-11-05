> Current connection: `evrn-dev-usc1-vm-rnd-gpu`, project `evrn-dev`, zone `us-central1-c`, **IAP required**. Read [AI_INSTRUCTIONS.md](AI_INSTRUCTIONS.md) and [GCP_ACCESS_REQUIREMENTS.md](GCP_ACCESS_REQUIREMENTS.md). The old public-IP launcher and automatic recovery still target the historical host; do not run them for the replacement VM. The installation/hardware descriptions below are historical until verified on the new VM.

# MiniMax H3 on evrn-rnd-server

For an AI agent operating this installation, use [AI_INSTRUCTIONS.md](AI_INSTRUCTIONS.md).

The VM runs the open weights through native ComfyUI nodes. Gradio and the JSON API share port 7860; the ComfyUI editor uses 8188. Both bind to `127.0.0.1` on the VM and are available through SSH forwarding. No public app port or Gradio share link is needed.

Server: `evrn-dev / us-central1-c / evrn-rnd-server` — NVIDIA A100 SXM4 40 GB, 83 GiB system RAM, 1 TB boot disk. Installation directory: `/opt/minimax-h3`.

Validated installation: NVIDIA proprietary driver 595.112.07 (595 branch pinned), PyTorch 2.14.1 + CUDA 13.0, ComfyUI 0.43.0 at commit `e1df394db644987bfbdd05c887a78b9115d49261`, Gradio 6.31.0. The initial 615 open driver stalled in CUDA initialization on this VM; the 595 driver passed real inference after a clean boot. `/etc/modprobe.d/minimax-uvm.conf` also disables HMM. The boot image contains that compatibility setting.

Two real multimodal tests passed using a synthetic image, a test-pattern video with a tone soundtrack, and a separate tone reference: 384 × 224 / 56 frames, then 864 × 480 / 124 frames. Both downloaded successfully and were probed for H.264 video, 24 fps, stereo audio, dimensions and duration. The warm 864 × 480 render took 26.53 seconds including preparation and result polling; the first cold run took 108.63 seconds. These timings are measurements of the test prompts, not guarantees for larger reference sets or settings.

## Open the app

From this repository in PowerShell:

```powershell
.\tools\minimax_h3\tunnel.ps1
```

Keep that terminal open, then visit:

- Studio: <http://127.0.0.1:7860/ui/>
- Interactive API documentation: <http://127.0.0.1:7860/docs>
- Health: <http://127.0.0.1:7860/v1/health>

Use `-ComfyUI` to also forward port 8188 and open the full node editor at <http://127.0.0.1:8188>. Import `/opt/minimax-h3/reference-workflow.json` there if you want the official editable workflow. `-Port 7861` changes the local Studio port if 7860 is occupied.

The tunnel uses the Google Cloud sign-in and SSH key already installed on this computer. Its `known_hosts` file pins the VM host key obtained through the authenticated VM connection. The script resolves the current external IP each time. After recreating the VM, verify and replace that host key rather than bypassing verification.

## Submit local references

The client needs only Python's standard library. Run in a second terminal while the tunnel is open:

```powershell
python .\tools\minimax_h3\client.py --health

python .\tools\minimax_h3\client.py `
  --prompt 'Use <Picture 1> for the character, <Video 1> for the motion, and <Audio 1> for the voice. A gentle camera push-in. Soft ambient room sound.' `
  --image 'C:\path\character.png' `
  --video 'C:\path\motion.mp4' --mute-video-audio `
  --audio 'C:\path\voice.wav' `
  --width 864 --height 480 --duration 5 --steps 4 `
  --output 'C:\path\result.mp4'
```

Repeat `--image`, `--video`, and `--audio` in the intended tag order. Maximums: 9 images, 3 videos, 3 standalone audio clips. Each video can use its original soundtrack or an optional replacement via `--video-audio`. Use `-` as a replacement placeholder when keeping an earlier video's original soundtrack.

**Audio tag ordering matters:** each enabled video soundtrack receives an `<Audio N>` tag first, in video order. Standalone audio gets subsequent Audio numbers. With one video soundtrack and one standalone voice, the soundtrack is `<Audio 1>` and the voice is `<Audio 2>`. Muting video soundtracks makes the first standalone clip `<Audio 1>`. Videos without audio streams receive no Audio tag. Jobs record the exact reference tags in `reference_labels`.

Images use `<Picture 1>`, `<Picture 2>`, etc.; videos use `<Video 1>`, `<Video 2>`, etc. Tag matching and explicit instructions about which reference controls identity, style, motion, camera, or voice improve results. Reference conditioning guides generation; it does not promise exact copying of an input soundtrack.

Gradio exposes the same inputs plus per-video start time, clip duration, soundtrack toggle and replacement. Uploaded video clips are resampled to 24 fps, trimmed to at most 15 seconds or the generation duration, and downscaled within the native video reference envelope while preserving aspect ratio. Standalone reference audio uses its first 15 seconds and is normalized to stereo 32 kHz. Use your chosen audio segment as the uploaded file.

## Quality and controls

- Draft: 864 × 480, 5 seconds, turbo on, 4 steps, `match` reference sizing.
- Stronger reference matching and better speech: turbo off, 20–25 steps.
- Native final dimensions: 1344 × 768 or 768 × 1344; start with a short clip and a small reference set on the A100 40 GB.
- `max` reference sizing preserves up to a 2048 px short edge and uses substantially more memory and time.
- Output is fixed at 24 fps, with native stereo audio. Frames round up to the `17k+5` grid; 5 seconds yields 124 frames, or 5.17 seconds. The trained duration range is about 5–15 seconds. Extended frame controls are exposed, but large workloads can exceed memory.
- Default sampler is `res_multistep`, scheduler `beta`, video sigma shift 12, audio shift 3. Advanced controls include seed, steps, scheduler, sampler, both shifts, turbo LoRA strength, frame count override, reference sizing and all ten style embeddings.
- For a style, select it in the UI or pass `--embedding minimaxh3_art_is_explosion`. You may also write `embedding:minimaxh3_art_is_explosion` directly in the prompt.

For base generation:

```powershell
python .\tools\minimax_h3\client.py --prompt 'Your prompt' --image 'C:\path\image.png' --no-turbo --steps 20 --width 1344 --height 768 --duration 5 --output 'C:\path\final.mp4'
```

Use `--settings settings.json` for API controls not listed as dedicated client flags. Example:

```json
{
  "scheduler": "normal",
  "sampler": "res_multistep",
  "shift_video": 12,
  "shift_audio": 3,
  "lora_strength": 0.8,
  "video_options": [{"start": 2, "duration": 5}]
}
```

`length` overrides seconds if supplied in settings. `--seed 12345` reproduces the saved random seed. The API schema at `/v1/config` lists every setting and its limits.

## API and jobs

1. `POST /v1/files` with multipart field `file` returns an upload ID. Limit: 2 GiB per file.
2. `POST /v1/jobs` with JSON returns HTTP 202 and a durable job ID.
3. `GET /v1/jobs/{id}` returns status, settings, effective frames and duration, reference tags, and any error.
4. `GET /v1/jobs/{id}/output` downloads the completed MP4.
5. `POST /v1/jobs/{id}/cancel` cancels that job. Queued jobs are skipped; active work is interrupted.

Example JSON after uploading your files:

```json
{
  "prompt": "Use <Picture 1> for identity and <Video 1> for motion. Match the voice in <Audio 1>.",
  "images": ["IMAGE_UPLOAD_ID"],
  "videos": [{"file_id": "VIDEO_UPLOAD_ID", "use_audio": false, "start": 0, "duration": 5}],
  "audios": ["AUDIO_UPLOAD_ID"],
  "width": 864,
  "height": 480,
  "duration": 5,
  "seed": 12345,
  "turbo": true,
  "steps": 4
}
```

The client prints the job ID before waiting. `--no-wait` submits and exits; `--resume JOB_ID --output result.mp4` waits for an existing job without submitting again. `--cancel JOB_ID` cancels it. Downloaded results include a `.job.json` record with the full request.

One worker serializes inference on the GPU. Polling or downloading does not generate again. Jobs and outputs persist on disk. On an app restart, unfinished jobs are marked failed rather than automatically replayed; inspect them and explicitly resubmit if needed. Completed files remain available.

## Operations

The services start automatically when the VM boots. Logs and restart commands over Google Cloud SSH:

```powershell
gcloud compute ssh evrn-rnd-server --project=evrn-dev --zone=us-central1-c --command='sudo systemctl status minimax-comfy minimax-app --no-pager'
gcloud compute ssh evrn-rnd-server --project=evrn-dev --zone=us-central1-c --command='sudo journalctl -u minimax-comfy -u minimax-app -n 100 --no-pager'
gcloud compute ssh evrn-rnd-server --project=evrn-dev --zone=us-central1-c --command='sudo systemctl restart minimax-comfy minimax-app'
```

Files on the VM:

- `/opt/minimax-h3/ComfyUI/models/`: requested weights and embeddings.
- `/opt/minimax-h3/models-manifest.json`: pinned Hugging Face revision, file sizes, verified SHA-256 checksums.
- `/opt/minimax-h3/comfy-revision.txt`: installed ComfyUI commit.
- `/opt/minimax-h3/installed-requirements.txt`: installed Python versions.
- `/opt/minimax-h3/state/uploads/`: uploaded reference media.
- `/opt/minimax-h3/state/jobs/`: job records and executable ComfyUI graphs.
- `/opt/minimax-h3/ComfyUI/input/`: prepared job reference media.
- `/opt/minimax-h3/ComfyUI/output/h3/`: generated videos.

The service does not automatically remove uploads, prepared media or outputs. Monitor storage and remove old media deliberately. Google Cloud continues billing for a running VM; stopping the VM also stops inference and the tunnel, while its persistent disk retains the installation.

Deployment sources are in this folder: `bootstrap.sh`, `install_runtime.sh`, `download_models.py`, `install_services.sh`, `app.py`, and `client.py`. The smoke test creates clearly synthetic image, video, and tone references to verify multimodal inference and checks the actual saved video's dimensions, duration, frame rate, and stereo audio.

Sources: [official model files](https://huggingface.co/Comfy-Org/MiniMax-H3), [native reference workflow](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_r2v.json), [ComfyUI H3 guide](https://docs.comfy.org/tutorials/video/minimax/minimax-h3), [model license](https://huggingface.co/MiniMaxAI/MiniMax-H3).
