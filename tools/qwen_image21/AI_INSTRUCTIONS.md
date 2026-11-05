# Call the installed Qwen endpoint; do not reconstruct the pipeline

Use this when the creator explicitly requests **Qwen Image 2.1** image editing/generation from reference images. Adding this endpoint does not authorize new project images, restart a video batch, or accept prior output quality.

1. Read [README.md](README.md), `installation.json`, and `api-deployment.json`; check current user scope and any saved request receipt first.
2. Reuse the private IAP forward to `http://127.0.0.1:7861`. If absent, start `start_api_iap_forward.ps1` with `Start-Process -WindowStyle Hidden`, save the PID, then verify `client.py --health`. Never use public SSH or expose a new firewall port.
3. Call the existing standard-library helper directly through the terminal tool:

   `./.venv/Scripts/python.exe tools/qwen_image21/client.py --prompt 'ACTUAL EDIT INSTRUCTION' --image 'ABSOLUTE TARGET FILE' --image 'OPTIONAL REFERENCE' --output 'NEW ABSOLUTE OUTPUT.png'`

4. The first image is the target. Repeat `--image` in `<image1>` … `<image10>` order. The helper handles uploads, mandatory idempotency, saved job IDs, polling, checksum verification, download and metadata. Do not write ad hoc upload/poll/graph code.
5. Inspect a prepared request without inference with `--validate-only`. For interrupted work use `--status JOB_ID`, then `--resume JOB_ID --output FILE.png`. A lost submit response can be recovered by rerunning the exact same saved request/output path: its idempotency key returns the same job. Never invent a replacement key or output path merely to retry an uncertain/failed job.
6. Preserve all originals, receipts, request/seed/graph/history and actual cost uncertainty. Output files are unreviewed unless genuinely reviewed under the current user instruction. Any quality correction or extra take needs current authorization.
7. Defaults are INT8, input canvas,25steps/Euler/simple,CFG1, enhancement off. Add `--precision bf16`, custom dimensions/resolution or `--refine-prompt` only as the task warrants. The optional enhancer uses thinking and a bounded4096-token default.
8. The API uses the shared single-GPU ComfyUI queue and waits for video work to be idle; do not start an independent inference stack. **Both MiniMax and Qwen now unload automatically after every submitted job in both APIs and the backend queue has finished**, followed by five seconds idle. The shared coordinator lives in this persistent API service. There is no keep-loaded override; legacy `unload_after:false` does not disable it. Use `/v1/memory` to verify its live phase and last receipt. Keep the API service running; no manual unload is needed after ordinary batches.

The direct REST flow is available when already working with uploaded IDs: `POST /v1/files`, `POST /v1/jobs` with `Idempotency-Key`, `GET /v1/jobs/{id}`, `GET /v1/jobs/{id}/output`. Read `/v1/config` for the actual request schema. MiniMax video remains a separate API on7860.
