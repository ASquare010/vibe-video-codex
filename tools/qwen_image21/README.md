# Qwen Image 2.1 beside MiniMax H3

The creator requested the official local Qwen Image 2.1 image-edit model in addition to the existing MiniMax video model. This is a separate ComfyUI image workflow on the same GPU, not a MiniMax video API mode. Installation does not authorize generating project images or resuming video production.

## Direct job API and one-command helper

Use the installed reusable API and [client.py](client.py) for automation. Do not rebuild Python scripts or ComfyUI graphs for each edit.

| Service | Private/local base |
| --- | --- |
| MiniMax video API | `http://127.0.0.1:7860` |
| Qwen image-edit API | `http://127.0.0.1:7861` |
| ComfyUI editor/backend | `http://127.0.0.1:8188` |

Both job APIs use the familiar flow: `POST /v1/files` → `POST /v1/jobs` → `GET /v1/jobs/{id}` → `GET /v1/jobs/{id}/output`. Upload references to the API that will generate the result; each API retains its own upload/job records. Qwen returns PNG images. Its schema and interactive API docs are available at `/v1/config` and `/docs`. `POST /v1/validate` checks references/model/node availability without creating a job or running inference. `GET /v1/jobs` lists saved jobs; `POST /v1/jobs/{id}/cancel` cancels only the selected job.

One command uploads, submits, waits, and downloads:

```powershell
./.venv/Scripts/python.exe tools/qwen_image21/client.py --prompt 'In <image1>, replace the shirt with the garment from <image2>. Preserve the person and composition.' --image 'D:/path/portrait.png' --image 'D:/path/shirt.png' --output 'D:/path/edited.png'
```

Use `--health`, `--config`, `--status JOB_ID`, or `--cancel JOB_ID` for read-only checks/cancellation. `--resume JOB_ID --output FILE.png` only collects the same job. `--validate-only` uploads/validates the prepared request without generation; `--no-wait` saves the new job ID and exits. Optional controls include `--precision bf16`, `--steps 40`, `--resolution 1024`, `--width 1280 --height 736`, and `--refine-prompt` (thinking is enabled automatically). The default follows image1, uses INT8/25steps/Euler/CFG1 and skips enhancement. Cached models unload automatically after all submitted image/video/backend jobs finish; no per-request flag is needed.

## Automatic unloading for both models

The creator requires automatic VRAM cleanup for **MiniMax H3 and Qwen Image 2.1**. The persistent Qwen API runs one shared coordinator (`idle_unload.py`) that checks local image jobs, MiniMax's active/queued jobs, and ComfyUI's running/pending queue every two seconds. After all three remain idle for five seconds, it rechecks them and requests ComfyUI `/free` with `unload_models:true, free_memory:true`. This releases the shared model cache for both models, without interrupting jobs, deleting weights or stopping the GPU/video services. A small driver/context allocation can remain.

Cleanup also follows failed/cancelled jobs once their actual backend work is gone. It does not unload between queued jobs. The coordinator defers cleanup if services cannot be checked; it never uses a global interrupt. It records the accepted unload and subsequent low ComfyUI model-memory reading, then stays quiet until another batch or newly cached model memory appears. Startup also checks idle memory. Both APIs remain callable and ComfyUI loads the requested weights again for the next authorized job.

There is **no per-job keep-loaded override**. The old CLI switch was removed; legacy `unload_after` JSON values are accepted for compatibility but do not disable this shared policy. Inspect `GET http://127.0.0.1:7861/v1/memory`, Qwen `/v1/health`, or `/opt/minimax-h3/qwen-image-api/state/auto-unload.json` for its live phase and last receipt. `auto-unload-verification.json` records deployment and actual idle cleanup. Eight simulated queue/memory tests plus the ten existing API tests passed. The coordinator runs in the existing restart-managed Qwen API container; keep that service running for automatic cleanup of both APIs.

The helper saves `FILE.png.request.json` **before** submission and `FILE.png.job.json` while polling. Reusing an output filename with different settings/inputs is rejected. The API requires an `Idempotency-Key` header for direct submissions: replay the same key/body to recover the same job; a changed body returns409. Requests, hashes, seeds, Comfy prompt IDs, graphs, histories and original outputs are retained in `/opt/minimax-h3/qwen-image-api/state`. Uncertain submissions are preserved as `submission_unknown` or `needs_attention`, never automatically resubmitted. Restarted running jobs resume their saved Comfy prompt IDs. Infrastructure charges remain unpriced.

Remote helper: `/opt/minimax-h3/qwen-image-api/client.py`. API source: `app.py` in that directory. The private CPU-only `qwen-image-api` container reuses the already-installed image and shared ComfyUI queue; it does not start a second inference engine. It waits for MiniMax and ComfyUI to be idle before submitting. The MiniMax containers, drivers and GPU stack remain unchanged. `api-deployment.json` records deployment and native validation; ten mocked-backend API tests exercise upload, idempotency, cancellation, restart recovery and download. Native ComfyUI validation passes INT8, BF16/ten-image/custom-size, and prompt-enhancer graphs. These checks do not certify a generated image or run GPU inference.

For the image API's IAP forward, run `start_api_iap_forward.ps1` in a hidden background PowerShell process and retain its PID, or run it interactively in a terminal if desired. Reuse a live verified forward instead of opening another one.

## Deployment

- VM: `evrn-dev-usc1-vm-rnd-gpu`, project `evrn-dev`, zone `us-central1-c`; **IAP only**.
- Existing ComfyUI: `/opt/minimax-h3/ComfyUI`, private port `8188`.
- Existing MiniMax API: private port `7860`.
- Installation state and checksums: `/opt/minimax-h3/qwen-image-2.1-install/state.json`.
- Installer PID/log: `install.pid` / `install.log` in the same directory. Inspect the lock and state before restarting any interrupted download; retain partial downloads.
- Local verification receipt: `installation.json` when installation completes.

Connect with the existing Windows Cloud SDK. Its default SSH client is PuTTY/plink; keep `-L` and its value as separate `--ssh-flag` arguments. The OpenSSH `-- -N ...` example does not work through the installed PowerShell wrapper.

```powershell
gcloud compute ssh evrn-dev-usc1-vm-rnd-gpu --zone us-central1-c --project evrn-dev --tunnel-through-iap --quiet --command=true --ssh-flag=-N --ssh-flag=-L --ssh-flag=127.0.0.1:8188:127.0.0.1:8188
```

Reuse an existing verified forward. A background helper must use `Start-Process -WindowStyle Hidden`. Do not expose ComfyUI publicly. Once forwarded, the editor is at `http://127.0.0.1:8188/`.

## Files and workflows

The requested six checkpoints are installed in their standard `ComfyUI/models/` folders:

| Folder | Checkpoint |
| --- | --- |
| diffusion_models | `qwen_image_2.1_bf16.safetensors` |
| diffusion_models | `qwen_image_2.1_int8_convrot.safetensors` |
| text_encoders | `qwen3vl_8b_bf16.safetensors` |
| text_encoders | `qwen3vl_8b_int8_convrot.safetensors` |
| text_encoders | `qwen3.5_9b_qwen_image_2.1_pe_i2i.int8_convrot.safetensors` |
| vae | `qwen_image_2.1_vae_bf16.safetensors` |

The official [image-edit template](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/image_qwen_image_2_1_image_edit.json) is saved in `ComfyUI/user/default/workflows/` as:

- `Qwen Image 2.1 - Image Edit (INT8).json`: official smaller-model defaults.
- `Qwen Image 2.1 - Image Edit (BF16).json`: the same graph with only the image model and image text encoder switched to BF16.

The original pinned workflow is retained separately as `/opt/minimax-h3/qwen-image-2.1-install/official-image-edit.json`. The two official denim example images are in `ComfyUI/input/`. Never replace user input files with a different downloaded asset.

Verified installed defaults: CFG1,25steps, Euler/simple, resolution0 (input size rounded to a multiple of32), custom size off, prompt enhancement off, thinking off, enhancer token limit4096. Turn thinking on together with the enhancer when choosing to enable it. Local copies of both installed graphs are saved under `workflows/` beside this file. ComfyUI's workspace API lists both graphs; all six model files are discovered by their native loaders. The completed receipt records584MiB GPU use and39858MiB free, with no inference submitted.

## Use when the creator requests Qwen image generation/editing

1. Verify the saved installation receipt, live queues, and requested scope. Never restart a completed/stopped video batch just to use this image model.
2. Open the INT8 workflow first on the shared A100 40 GB. Use BF16 when desired and suitable for the workload. Run image and video inference sequentially on this one GPU.
3. `image_1` is the edit target; later images are references. Write tags as `<image1>`, `<image2>`, …, up to ten references. These differ from MiniMax's `<Picture N>` video tags.
4. Preserve the target's composition and choose the appropriate image resolution. A resolution value is a pixel-area budget; respect aspect ratio and multiples of32. Native up-to-2K capability is not a guarantee that every reference combination fits in VRAM.
5. Keep the official graph's CFG1. A negative prompt is inactive at CFG1. Inspect the actual template's sampler and step values instead of assuming a setting from older notes.
6. The optional prompt enhancer uses the separate Qwen3.5 checkpoint and `TextGenerate` node. Follow the saved graph's exposed controls; when enabled, preserve its thinking setting and bounded token budget. Leave it off when exact prompt pass-through is desired.
7. Save the exact graph/prompt/input hashes, returned Comfy prompt ID, seed, output, and cost uncertainty before collection or any authorized correction. Do not duplicate an uncertain request.
8. Shared automatic cleanup unloads cached models after all image/video/backend jobs finish. Verify its `/v1/memory` status when needed; keep model files, runtime, drivers, services, and historical outputs intact.

Sources: [official model files](https://huggingface.co/Comfy-Org/Qwen-Image-2.1), [subgraph guide](https://docs.comfy.org/interface/features/subgraph). The installation is checksum/node/discovery verified; image inference is a separate action and must not be claimed tested without an actual recorded run.
