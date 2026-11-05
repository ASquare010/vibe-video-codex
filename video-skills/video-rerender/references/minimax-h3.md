# Installed MiniMax H3 adapter

Use only when selected by the current project/request. Read `tools/minimax_h3/AI_INSTRUCTIONS.md` before connecting or submitting; it is the authority for the installed client, private SSH tunnel, active schema and media-tag mapping. Reuse installed services and model weights. Do not mix in another provider when the creator requests H3 only.

Compile photographic performance prompts from [live-action-prompts.md](live-action-prompts.md). Preserve the world/cast while allowing actual body/camera travel; compare multi-image backgrounds before submission. Static reference count is not motion quality, and conflicting full-scene pictures should not become forced endpoints. Keep the current images/audio-only policy when selected. The installed image helper has its own tags and API; do not use MiniMax video tags inside a Qwen edit prompt.

## Connection and cloud access

Use the current VM and mandatory IAP route recorded in `tools/minimax_h3/AI_INSTRUCTIONS.md`. Direct public SSH and the old public-IP tunnel helper are not valid for the replacement VM. Read `tools/minimax_h3/GCP_ACCESS_REQUIREMENTS.md` for the application resource inventory and the distinction between the connecting user's permissions and the VM service account's permissions. Do not grant IAM roles, change networking, start a VM or alter services merely to update these instructions.

A new VM does not establish that old models, services or remote job records were migrated. Verify those read-only before inference and retain all local completed outputs and old IDs.

In creator-requested sequential mode, finish the current scene's image review, video, draft placement, video review and timeline update before generating the next scene. Reuse existing images and takes instead of restarting a batch.

## References and continuity

For photographic image construction, action-dependent multi-image coverage and reference review, follow [photographic-references.md](photographic-references.md). More complex motion needs enough distinct source-matched phases and actual source angles, rather than more near-duplicate identity pictures. Record the purpose of each supplied `<Picture N>`; reference count alone does not constrain the action. An images-only request never authorizes restarting this GPU server or rendering video.

Test the requested guidance modes in the requested order on a representative source-grounded sequence. A raw animation video can carry drawing style as well as motion; a photographic image can preserve appearance while losing movement. Judge the delivered result before choosing video-only, image-only or a combined input recipe. A successful API call is not a style or continuity pass.

For combined guidance, explicitly assign the source video to camera/actor placement/action/depth/cut timing, realistic images to identities/materials or compatible physical endpoints, and audio to speaker/impact timing. Images used only for identity do not override source camera geometry. A supposed starting-frame image must actually represent that source shot's incoming action phase. Across a camera cut, reconstruct the same world state from the new view instead of copying the old view.

A contiguous source sequence may contain multiple verified cuts. If using one H3 request for that sequence, retain those exact setups and connecting events and validate delivered cut timing before mapping results back to timeline rows. This is conditional on a successful sequence-guidance test; it is not permission to concatenate unrelated shots, delete cuts or accept a model-invented montage. If source-to-output timing cannot be mapped reliably, use individual verified takes or flag the sequence for repair.

## Exact media tags

Images are `<Picture 1>` onward in their own order. Videos are `<Video 1>` onward. Only videos with enabled, present soundtracks consume `<Audio N>` numbers, in video order, followed by standalone audio clips. A video with soundtrack plus a separate voice therefore uses `<Audio 1>` and `<Audio 2>`; a muted video plus standalone voice uses only `<Audio 1>`. Check the actual job's `reference_labels`; do not rely on a guessed index. Source audio is guidance, not a guarantee of exact speech or separation of music. Verify English words, lips, effects and music absence in the output.

## Local operation and resuming

Use `tools/minimax_h3/client.py` or the `Client` class rather than building another transport. `tools/minimax_h3/render_plan.py --spec FILE --submit-only` persists input hashes/uploads/request, recovers an exact matching existing request when possible, and saves the job ID before waiting. `--collect-only` and `--status` never submit a new job. Preserve request/spec/state, returned seed, reference mapping, untouched MP4 and `.job.json` in the take folder. If submission outcome is uncertain, inspect existing jobs before any retry. Do not restart services or change the GPU stack during ordinary inference.

The installed worker runs one GPU job at a time; a queue is not parallel inference. Prepare independent inputs while it works and serialize actual endpoint dependencies. Scope each comparison/retry explicitly and inspect failures before more submissions. Do not queue the full opening before the style/motion recipe has passed review.

If the tunnel fails, distinguish expired login from a stopped VM and from GPU-capacity failure. After login is refreshed, inspect the VM/start operation rather than repeatedly resubmitting jobs. On a zone stockout, preserve the installed VM/configuration, saved job IDs and downloaded results; continue independent local work and report the concrete block. Do not silently create another billable VM, change the GPU/driver stack or switch providers. Restore the tunnel and resume the same ID when access returns.

## Format and accounting

Read `/v1/config` for real bounds. Installed 480p defaults are 864×480 at24fps, with dimensions divisible by32. Keep source aspect/crop in references and document any final854×480 export rather than claiming it was the native size. Native frame count rounds onto `17k+5`; use the returned `frames`/`actual_duration` and select/retime complete action, not assumptions based on requested seconds. The training range is roughly5–15seconds even though the API schema permits shorter lengths; benchmark short-shot behavior rather than assuming the earlier provider's four-second minimum applies.

Turbo4steps is a speed preview. For stronger matching, the installed guidance suggests no-turbo20steps; quality, reference tokens, duration and GPU memory still require observation. Keep reference image size `match` for economical480p trials unless an actual fidelity issue justifies larger references. Avoid decorative embeddings, smooth motion/bullet-time presets or other changes not required by the source.

Local H3 requests do not consume Veo/Higgsfield credits. Record provider job IDs, native seconds, settings and observed wall time anyway. Do not assert infrastructure cost is zero: VM compute and disk/network billing are separate, and grant offsets require evidence. The app's dollar figure must not silently inherit unrelated projects' historical spending or fictional API charges. Preserve the previous project when creating a new H3 version.


## Source-conditioned photographic production

In local trials, a large raw animation video dominated photographic image references and reproduced the drawn style. A deliberately small224×128 motion video plus photographic references produced live-action appearance, but did not reliably preserve every view or contact. Treat this as an adapter-specific observation, not a universal optimal input size. Inspect the actual recipe on representative motion before batch use.

Reject a black fade, white flash, unreadable motion smear or transition blend as the sole reference pose. Select the earliest legible source phase, save its exact time, and retain the original video timing. An appearance image from a different camera does not establish correct geometry. When using H3 to construct photographic reference frames, explicitly assign the small source storyboard to framing, depth, actor positions and action phase; inspect the result before accepting it. Native video output can supply a reference photograph, but that is an additional generation and must retain its own job receipt.

`tools/minimax_h3/run_production.py --plan REVIEWED_PLAN` runs a saved per-scene plan with a process lock, durable request IDs, a stop sentinel, bounded recovery of the existing VM/tunnel, media checks and timeline placement. It generates one scene at a time on the single GPU. `--scenes NUMBER ...` and `--limit N` are bounded recipe checks. A completed local MP4 is a review draft, not an automatic quality acceptance. The plan supplies actual source intervals, action descriptions and appearance roles; do not reuse an episode-specific plan for unrelated footage.

The runner conserves the complete native action while adjusting the model frame-grid padding to the measured scene duration, without interpolated frames. Short shots below the model's trained range need explicit temporal review. Retain first/middle/last comparison boards plus original24fps outputs for inspection of fast movement, not just codec validation. Stop after repeated infrastructure failures rather than silently switching provider or repeatedly buying new takes.


In dense-frame review, photographic bookends did not prove photographic continuity: some raw animation-guided outputs reverted to drawn style during the middle of fast action, even with reduced video dimensions. Inspect the full clip before selecting that route. If video guidance fails this requirement and image guidance succeeds, use the creator-authorized image-guided fallback with source-grounded motion/camera descriptions and audio, and disclose the loss of direct motion conditioning. Keep all attempts and do not label the fallback an exact motion transfer.

The local turbo4 no-reference tests produced unusable overexposed drawings, whereas a base20 no-reference test produced a photographic new-character reference. Benchmark that case before creating a cast library; fast previews are not interchangeable with validated reference images. Do not assign an unrelated actor's whole action image as the identity reference for a new cast member. Reconstruct a suitable photographic anchor and inspect it against the source identity, costume and camera requirements.


## Selecting reference-video frames

Keep a snapshot caption separate from the whole sequence action. Inspect the source at the exact chosen time: name only the subjects actually visible, their scale, camera and current action phase. A later head close-up cannot be captioned as the earlier whole-body collision. Identity photographs supply identity/materials; a conflicting full action tableau can lock the wrong body pose or camera. Prefer an isolated identity crop when reconstructing a different close view, and avoid adding unrelated identity images to a target-only effect insert.

H3 returns a video even when used to construct a reference photograph. The first decoded frame may copy the old identity image before the requested pose or camera change occurs. For a reference-driven reconstruction, ask it to reach the target view, inspect candidates throughout the auxiliary video, and select the frame that actually matches. A later frame is only a candidate, not automatic approval. Preserve the auxiliary job receipt and record the selected time, source time and review decision. Reuse a suitable existing frame before submitting another reference take. Text-only reference construction can suit an effect/sky insert or new anonymous tableau when photographs conflict, but still requires source-layout review and must not invent established identities.

`run_production.py --prepare-only` prepares photographic candidates without final shot generation or export. Plans with explicit `poseViews` require reference selections marked `reviewed-accepted` after visual review before final submission. `review_references.py` compares selected photos with source snapshots; `review_pose_candidates.py` shows the source beside several phases of an auxiliary take. These boards do not judge motion automatically. Keep uncertain candidates unapproved and use bounded new take folders for concrete corrections; never alter a saved request under an existing job ID.


## Exact speech and relevant image checks

Follow the creator’s chosen modalities. For image-and-audio-only generation, keep the source video local for analysis; the final request must contain no video references. Use multiple actually relevant converted photographs when requested, assigning each its view/action phase or identity/material role. Do not fill a minimum image count with unrelated files or call an uninspected reference source-matched. Compare props (book/staff/shield/weapon), ownership, hand/grip, open/closed state, injuries, stance and causal contacts as well as camera/cast/style. Retain these states across connected cuts.

Audio conditioning is guidance, not verbatim copying. Verify the source language and actual words. Put the explicit quoted spoken script and speaker first, separate from silent visual instructions; state when a speaker stays off-screen or is thinking. If there are no words, specify no dialogue/narration rather than asking for generic voices. Permit appropriate nonverbal exertion separately. A model can otherwise speak or mangle visual instructions instead of the source dialogue. Do not confuse intelligible-sounding syllables with correct English or another requested language.

Audit the source, untouched native generation and final edit separately. A language classifier alone cannot prove meaningful speech: invented English-sounding words, wrong lines, grunts, music and ASR hallucinations need separate review. Save exact source/recognized words, uncertainty and timing; speech crossing a source cut may need one continuous voice take, not repeated fragment generation. Avoid wholesale combat speedups on dialogue. Trim only verified spare handles or select/extend a complete line before sound/picture placement. A corrected small test must demonstrate actual words before another bulk speech batch.
