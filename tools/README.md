# Source-video tools

Run commands from the repository root. These tools do not start paid generation unless you explicitly invoke `cloud_media.py analyze` or `veo submit`. Node media processing uses the installed FFmpeg/FFprobe. Python tools honor `FFMPEG_PATH`, then the repository's `ffmpeg-static`, then PATH. `--ffmpeg` overrides that. `--encoder` defaults to `libx264`; `h264_mf` is available for older Windows builds. The original source and native takes remain unchanged; choose separate output paths.

Create an isolated Python environment once:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r tools/requirements.txt
```

On Windows, use `.venv/Scripts/python.exe` in place of `python` in the examples below, or activate `.venv/Scripts/Activate.ps1`. On macOS/Linux use `.venv/bin/python`. The local setup includes this environment with Pillow and NumPy installed. It stays outside Git.

## Inspect motion locally

```powershell
python tools/media_preview.py --source source.mp4 --out data/review/scene-7 --start 100.96 --duration 7.44 --width 640 --fps 12 --audio
python tools/motion_flipbook.py --video source.mp4 --out data/review/scene-7/flipbook --start 100.96 --duration 7.44 --source-start 100.96 --fps 25 --width 640 --title "Scene 7 source motion"
```

Open `motion_flipbook.html`. Arrow keys step native frames; red/blue onion skins expose motion. `--fps` must match the input's native frame rate. `--source-start` labels the original episode offset; it does not seek. `--start` seeks the input. Review playback speed does not retime the file. Use dense frames to verify cuts and contact; low-rate proxies are for orientation.

## Import an existing source breakdown

In a new project, **Source → Import source video** detects candidate camera cuts locally, creates a 640px proxy, and sets 720p/24fps. Import takes time but spends no provider credits. It requires an empty project. Detection does not identify characters, transcribe dialogue, or certify camera boundaries; Codex does that from inspected evidence.

For already analyzed sources, write a local import manifest and run:

```powershell
npx tsx tools/import_source.ts --manifest data/import.json
```

Minimal manifest (absolute input paths or paths relative to the command's working directory):

```json
{
  "name": "Realistic remake",
  "source": "D:/media/source.mp4",
  "proxy": "D:/media/source-640.mp4",
  "fps": 25, "durationSeconds": 1420.12, "width": 1920, "height": 1080,
  "analysis": "Candidate cuts; agent must inspect camera changes and motion.",
  "costs": [],
  "scenes": [{
    "number": 7, "title": "Fighter counterattack",
    "direction": "Keep the same fighter, opponent scale and tracking camera.",
    "source": {
      "referenceId": "SH0007", "startSeconds": 100.96, "endSeconds": 108.4,
      "verified": true, "motion": "high", "route": "seedance", "status": "review",
      "notes": "Contact, explosive displacement, quick recovery; no slow motion."
    },
    "postSpeed": 1.15,
    "media": [{
      "path": "D:/media/native-take.mp4", "provider": "Higgsfield",
      "model": "Seedance 2.0 Fast", "prompt": "The actual submitted prompt.",
      "sourceIn": 0, "durationFrames": 178, "embeddedAudio": true
    }]
  }]
}
```

Media is copied under the new project, with unique asset/version IDs and provenance. Original inputs are retained. `sourceIn` and `durationFrames` are **24fps project frames**, even if the source is 25fps. Omitting `media` imports a planning scene only. Use `place: false` to retain a native take or first frame without placing it. Video sound is extracted and placed separately, synchronized with the picture, because embedded video sound is muted by the editor. Optional `postSpeed` retimes the entire scene after import. The importer creates no Codex chat and makes no inference calls. Its output is a project ID and editor URL. Source manifests and cost evidence are saved in project history. A failure leaves that import's unpublished folder for recovery; it does not alter another project.

## Finish existing motion

```powershell
python tools/impact_finish.py --video native.mp4 --events impacts.json --out finished.mp4 --fps 24
```

`impacts.json`: `[{"time": 1.25, "x": 0.6, "y": 0.5, "angle": -15, "length": 10, "amount": 0.35, "shake": 2, "dust": true}]`.

Contact time is in the input take, coordinates are normalized. Use only verified contacts. This adds selected directional blur, tiny whole-frame impact accents and dust, with native audio bass/limiting. It does not interpolate or repair anatomy, scale, contact or spatial warps. Keep the effects-off take. Apply deliberate mild speedups with the editor's scene control, which retimes picture and audio together and shortens scene duration.

## Google Cloud helper

`cloud_media.py` uses an existing local `gcloud` login. Set `GOOGLE_CLOUD_PROJECT` or supply `--project`. Optionally set `GCLOUD_BIN`. No credentials are written to this repository. Region is currently `us-central1` for Veo and `global` for analysis; use only models available to that project. Read the provider catalog and current price before a paid call.

```powershell
python tools/cloud_media.py --project YOUR_PROJECT veo submit --image first_frame.jpg --prompt video_prompt.txt --duration 8 --model veo-3.1-fast-generate-001 --out data/jobs/scene-7
python tools/cloud_media.py --project YOUR_PROJECT veo poll --out data/jobs/scene-7
```

Persisted request/receipt files prevent blind repeats. Poll after uncertain results. The historical helper exposes optional end/reference-image arguments for compatibility; the Veo route uses **only the first frame**. Higgsfield input choice follows the selected remake skill. After the hybrid-style failure, test a single photographic `start_image` and concise human stunt direction; keep anime clips in analysis. Raw anime video can transfer drawing style, frozen poses and camera cuts despite realistic image references. Use additional motion media only after one reviewed take stays photographic and moves like a human performance. Prepare the video at a small resolution while preserving source timing and frame rate (`media_preview.py --fps SOURCE_FPS`); keep onion overlays out of the reference clip. Check the live model’s media limits before submitting a complete camera take. A whole episode must be analyzed and indexed first, then handled shot by shot. Record costs in `project.costs` by actual job/operation ID. Bill all generated seconds, including discarded takes, rather than selected runtime. A Cloud grant's eligibility and actual application need billing verification. Higgsfield uses the connected plugin's current model catalog and credit quote; there is no second credential mechanism in this repository.


## Direct scene controls

`npx tsx tools/edit_scene.ts --project UUID --scene 7` prints that saved scene and its placements. Add `--speed 1.15` to shorten the take with aligned native sound; add `--fade-in 3 --fade-out 3` for visual fades in project frames, `--contrast 0.95` for a mild grade, or `--note "Review contact"` for source notes. These edits save a new revision, refresh the control panel and never request generation. Preserve scene numbers when editing the manifest directly. Native media is untouched.


## Fill the timeline and reuse existing renders

Source import populates each included scene with its actual source video and sound. References use the shared small proxy at the original source offset and are labeled on the timeline. A ready video imported into a source scene, or applied through the result path, replaces its reference picture and sound while preserving source evidence. Original references remain accessible through the Source tab. Generation failures leave references intact.

`npx tsx tools/sync_source_timeline.ts --project UUID` fills missing reference scenes in an existing project. Add `--renders data/existing-renders.json` to map selected existing files by original source times. Example:

```json
{"exclusions":[{"startSeconds":1325.12,"endSeconds":1420.12,"reason":"Ending credits"}],"cameraCuts":[100.28],"renders":[{"id":"existing-grip","title":"Grip impact","path":"D:/media/grip.mp4","startSeconds":100.28,"endSeconds":100.96,"sourceIn":34,"durationFrames":18,"speed":1.15,"provider":"Higgsfield","model":"Seedance 2.0 Fast"}]}
```

Only list visually verified camera cuts. Existing scene numbers survive; additional verified cuts get new unused numbers. Excluded intros/outros/credits are recorded in sourceVideo.exclusions and removed from production scenes. Source time cards and story prologues are retained. When importing a reviewed source manifest, the same exclusions array is supported. The upload API also accepts a JSON exclusions field for known verified ranges; unreviewed cut candidates need semantic inspection before generation.

The range mapper shares each copied render file across its matching scene placements, keeps the original camera index, and plays separate native sound at matching offsets. Legacy dialogue samples are marked for review; mapped native timing may make the edit longer or shorter than the source. It refuses to overwrite unrelated manual edits. No generation or external inference is performed.


## Export an existing timeline

`npx tsx tools/render_timeline.ts --project UUID --scene 44` exports a single saved scene. Omit `--scene` for the full current draft, including any source-reference placeholders still on its timeline. This is local export, not new provider generation. Exports retain a snapshot and write `scene-44-latest-export.json` or `latest-export.json` in the project folder.

The renderer runs up to three local scene jobs concurrently (`VIBECUT_RENDER_CONCURRENCY=1` to serialize). PCM intermediates and one final AAC encode prevent padding gaps at camera cuts; output video packet timestamps are normalized to the project FPS. No intros or outros are added by the renderer.


## Compact a reviewed edit without generating new footage

`npx tsx tools/condense_scenes.ts --plan data/reviewed-compact-plan.json` validates and summarizes a reviewed plan without saving. Add `--apply` to apply it atomically with a revision check, a full before-edit backup, a per-cut scene map and a budget report. It reuses existing media, trims or consolidates retained source segments, and performs no generation or inference calls. Do not apply the episode-specific plan to a different video.

Each group contains a stable anchor number, title, selected source segments, provider, rationale, prospective native job lengths and estimated credits, or a reuseJobId for an existing selected render. Retained ranges must be chronological and disjoint. A long editor scene can require several model requests: the report counts actual planned native lengths rather than pretending one row is one request.

`npx tsx tools/check_generation_budget.ts --project UUID` reports the total cap, recorded/reserved charges, prospective Higgsfield credits, retry reserve and unallocated headroom, rejecting an over-budget plan. Live quotes and ledger updates are still required before actual provider submission. The current episode cap is 500 total credits including past tests. No new cost panel is added to the editor.


## Assemble completed takes for a review timeline

`python tools/assemble_remake_batch.py --plan batch-plan.json --override-plan revised-scene-plan.json --out timeline-plan.json` combines only completed saved takes. Override plans select the latest scene take while retaining previous attempts as history. It writes content-addressed H.264720p/24fps assemblies with aligned native sound, without inference calls, optical-flow smoothing, added intros or paid retries.

After the creator requests review placement, run `npx tsx tools/apply_remake_batch.ts --plan timeline-plan.json --import 1,3,10`. It replaces the matching source picture and sound, retains stable scene numbers and previous files, and keeps approved=false and any defect report. Re-running the same placement is idempotent. `--finish` ends local production status at awaiting-review; it does not create or launch another batch. Reviewed preview placement is distinct from quality acceptance.


## Restore original camera coverage

`npx tsx tools/restore_source_structure.ts --plan restore-plan.json [--apply]` restores source camera rows from a saved snapshot, preserves specified exact keepers or selected native slices, archives rejected renders without deleting media, and inserts verified internal camera cuts using unused scene numbers. It saves a full pre-edit backup and rejects a stale project revision. Costs remain intact. Use this after a condensed edit has lost causal context; do not restore title cards or credits.

`python tools/assemble_selected_takes.py --plan batch-plan.json --out timeline-plan.json` selects explicit phases from completed saved native requests via scene.takeSelections (jobKey, inSeconds, durationSeconds, optional speed). Multiple source rows can share one paid take without erasing their timeline cuts. Optional audioOverlay carries accepted offscreen speech across an insert; optional flash is capped at four frames. Writes content-addressed720p24fps H.264 plus aligned native audio, no inference, optical flow or automatic retry. Import only reviewed completed rows with apply_remake_batch.ts; model-specific pricing is read from each request.

### Show generated scene images before video

`npx tsx tools/place_scene_images.ts --plan PLAN.json` checks a placement plan; add `--apply` to update through ProjectStore. The JSON contains `projectId`, `expectedRevision`, optional `refreshSkill`, and `scenes:[{sceneId,number,spans:[{assetId,versionId,sha256,startFrame,durationFrames}]}]`. Each scene's chronological spans must exactly cover its current length. Inputs must be registered, active, current scene photographs. The helper checks file hashes, preserves source sound/timing and original assets, refuses selected videos/custom edits, and places unapproved still-image previews without camera animation or dissolves. It makes no generation request. Repeating the same plan is idempotent. A receipt retains replaced visual clips/transitions; subsequent source-aware video placement removes previews while keeping their photographs in the library. Complete a scene's selected image set first; held, support-only or missing phases are not story coverage.


## Read-only source and selected-edit review

`python tools/review_sequence.py --project PATH_TO_PROJECT_JSON --scenes 7 8 --out REVIEW_FOLDER` writes source-versus-current-selected-media boards and a `sequence-review.json` with all three clocks: original source, selected media offset and current global edit. A project UUID is also accepted from the repository root. It uses stable scene numbers, current asset/version selections, scene lengths, source offsets and clip speeds. No inference calls or project writes occur.

Use a dedicated output folder. Each sampled frame is 320px wide by default (maximum 640); `--samples` selects 3–12 frames per stream. These boards omit editor grade, transforms, transitions and overlays. Multiple visual placements or disjoint source segments are reported rather than silently simplified; use a scoped timeline export for those cases. Sparse frames do not establish motion quality: inspect real-time previews and dense native frames around events and joins.


## Repair scene boundaries and run the installed H3 adapter

`python tools/review_boundaries.py --project UUID --out REVIEW_FOLDER --scenes 17 18 --internal` compares native outgoing/incoming source frames, including retained parts of joined scenes. `--survey` creates inexpensive first/middle/last proxy pages. Both are read-only. Decide whether the boundary is a camera cut, flash, occlusion or continuous action, then record a semantic second pass; numeric cut scores do not decide production jobs.

`npx tsx tools/edit_scenes.ts --project UUID --join 12,13` or `--split-scene 17 --at-seconds LOCAL_SECONDS --source-seconds VERIFIED_SOURCE_TIME` previews an edit. Add `--apply` to save with revision checking and a full backup. Joins require adjacent scenes, keep all tracks, timing, absorbed scene handles and source segments; splits preserve media offsets and logical ownership. The editor also exposes Join scenes in its toolbar and measured seconds in Properties.

For installed H3, read `tools/minimax_h3/AI_INSTRUCTIONS.md`. `render_plan.py --spec FILE --submit-only` persists the request and ID; `--collect-only` resumes only that ID. `run_production.py --plan REVIEWED_PLAN` owns a single local worker lock, prepares source-matched photographic references, uses low-resolution motion guidance, collects outputs, aligns full native motion/audio to the edit, and registers completed draft clips. It uses only the existing H3 VM, never other providers. Save logs and `overnight-state.json`; a STOP file beside the plan stops after the current scene. Remove it only after the creator resumes. No automatic creative retries occur after a failed provider job. A zero API receipt excludes separately metered VM infrastructure, which remains unpriced until reconciled.
