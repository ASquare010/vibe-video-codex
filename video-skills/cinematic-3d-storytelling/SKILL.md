---
name: cinematic-3d-storytelling
description: Develop compelling spoken stories for YouTube across subjects, genres and lengths, then build audio-led cinematic 3D films. Use for Shorts and long-form fiction, explainers, investigations, history, comedy and what-if videos.
metadata:
  display-name: Cinematic 3D storytelling
  workflow: audio-led-cuts-v2
---

# Purpose
Coordinate research and spoken writing, narration, direction, still images, animation and final verification. Each role reads its own stage resources. Preserve the creator's scope, accepted media, saved work and existing production limits.

# Minimal brief and completion scope
The creator only needs to invoke this skill, request a complete video with a duration/format, and supply a short idea. Treat 'create a complete video' as authorization to produce the finished local film: develop the story/script, generate and prepare narration, direct the sequence, generate the necessary cut images and videos, assemble sound and picture, check the result and export. Use the saved theme, narrator, providers and production rules below without requiring the creator to repeat them. Infer routine creative choices and cut count from the idea and measured audio. Create a new VibeCut project for a new film, register/place its assets and deliver the actual final export with any remaining limitations. On continuation recover the existing project rather than creating another.

For this complete-video scope, stage acceptance means performing the relevant available checks and selecting assets internally so production can continue; it does not require a new human approval between script, audio, images and video. Do not ask again whether to generate the videos or stop at a script, board or production plan. This authorizes necessary generation and bounded repairs of demonstrated failures within the requested film, not unlimited creative retries. Preserve originals, receipts and actual review status; internal selection is not human approval. A creator's explicit 'script only', 'images first', review gate, budget or stop instruction narrows this scope and takes precedence. Publishing/uploading to a channel is a separate action and is not implied by local film completion. If an actual prerequisite blocks production, report the concrete blocker and preserve resumable state.

# Workflow and ownership
1. **Research and story writer:** read only [the script template](templates/script.md) for research, a compelling telling angle, clear explanation, exact spoken text and continuous audio-scene text. Camera angles, visual design, cuts and motion are downstream responsibilities. No media is authorized by a writing task.
2. **Narration:** read [audio direction](references/audio-direction.md) and [narrator settings](config/narrator-default.json). Establish the voice/delivery with a short measured pilot before a batch, respecting existing full-production authorization. Generate one continuous narration file per scene, measure it and inspect excess pauses before locking visual timing. Keep speech and performance direction separate.
3. **Director:** read [direction](references/director.md) and [the production contract](contracts/production.md). Use the full researched story, ending, exact speech, measured files/alignment and constraints to establish the persistent world, physical events, state/dependency sequence and cuts. Distinguish narration from actual recorded effects. Save a timed coverage/animatic pass and the previous/current/next-cut packet before scaling video. Hand that record to the image role; camera angles and appearance are resolved there.
4. **Still-image role:** give the LLM [the complete image prompt-writer template](templates/image.md), the directed cut, narration context and references. It writes one resolved imagePrompt per cut, including camera angle, perspective, expression, appearance, framing, light and a useful single action phase. Execute that prompt with the creator's GPT image route; requested label is GPT 2.5, but record the actual callable tool/model. For demanding geometry prepare/check a cheap blockout and keep storyboard targets distinct from model controls. Register/place selected images as unapproved previews covering continuous scene audio. Pass actual selected frames and camera details forward.
5. **Shot-animation role:** give the LLM [the complete animation prompt-writer template](templates/animation.md), the directed cut, narration window and actual selected image. It writes one resolved videoPrompt per cut, including subject action, force/contact, camera movement and outgoing state. Execute that prompt with the installed MiniMax. Preserve scene audio, action order and outgoing state; align authorized effects to observed contact and place completed video.
6. **Director returns for verification and assembly:** the same director checks story, audio, images, selected videos and adjacent cuts together, assembles the film and performs the checks below. This is a workflow responsibility, not another agent or a request appended to generation prompts. Keep unavailable playback/listening judgments pending.


# Units and continuation

These resources live under `video-skills/cinematic-3d-storytelling/` in this workspace. Read only the current role's linked resources. Each audio scene has at least three meaningful cuts, with count and uneven durations governed by the event and measured audio. Preserve essential short inserts. Do not impose equal cut quotas or durations, or copy the previous film's shot count.

A **scene** is one continuous audio unit and can contain multiple **shots/cuts**. A **shot** is one continuous camera/subject event and normally one generated video. A reverse angle or insert needs a new shot record, not a restarted sentence or a new scene audio file. Plan by meaningful spoken movements and visual information, not equal-duration blocks.

A dramatic **sequence** can span several audio scenes. An **action beat** is a causal change within or across cuts; a **keyframe** is a visual state, not automatically another cut or a timed model input. Separate these units so changing the camera does not restart speech and a long spoken passage does not force one prolonged action.

Use the creator's format and stage. Shorts may suit portrait; longer work may suit landscape. Do not turn a preference into a universal format rule. Full-production authorization can cover the workflow, while explicit review gates and stop instructions still apply. Preserve originals, creator edits, alternatives, requests, IDs and costs.

On a continuation such as 'generate videos', recover the task's current project, accepted inputs, intended cuts, existing authorization and saved job/export state before asking anything. Do not ask for subject, style or video count already established in this task. If videos already exist, identify the actual export and address the creator's requested review/correction; do not duplicate completed jobs. A stage handoff should carry the target project, ordered pending cuts and accepted inputs explicitly, rather than leaving the next agent to infer scope from a short follow-up message.

# Image-stage execution

The LLM templates produce prompts. The authorized image-generation stage performs these existing execution steps:

Use the actual available GPT image tool with authorized local references. Do not silently replace it with Qwen, Higgsfield images or another billed API route. Review the output against the requested camera and state; changing the camera notes to describe a failed image is not a correction.

For geometry-sensitive action prepare a simple blockout and check its projected relations before paid images. Build each image from its directed cut and opening state, with scoped layout/cast references; inspect the actual result against the guide. Prepare useful critical/outgoing key states as needed, keeping storyboard guides distinct from model controls. Use the creator's GPT image route; requested label is GPT 2.5, but record the actual tool/model rather than guessing an alias. Register and place selected images as unapproved previews covering the continuous scene audio.

Feed the approved blockout through the image tool's actual reference mechanism, alongside scoped identity/style references where supported. Ask the image model to preserve projected layout, view and direction while developing the approved look. Inspect the resulting still against the guide: geometry can drift during stylization. Fix the selected opening image before animating it when its critical relation is wrong. Do not relabel a failed camera as the intended shot or rely on a video prompt to repair it.

# Director verification

The same director verifies the work at its owning stage and returns after assembly. No separate automatic reviewer is required, and final verification instructions are not appended to provider prompts.

- Before speech: read the uninterrupted script as a first-time listener. Repair a missing actor, mechanism, transition or payoff in the actual spoken text, not coverage notes. Preserve necessary factual uncertainty and distinguish it from production commentary.
- Before visual timing: check exact words and pronunciation, measured articulation/overall pace, isolated-voice gaps and performance findings. Treat silence detection and ASR as evidence aids, not listening approval. Preserve intentional breaths and beats.
- Before scaling: test the hardest useful cause/action/consequence sequence against its visible evidence target from the director record. Compare the actual selected-image board for distinct information, readable event phase and useful coverage; repair redundant or wrong-view selections before animation. Verify essential inserts, anticipation, legible contact/result and adjacent state. A successful plan, upload or job receipt is not output acceptance.
- For selected images/video: compare the actual retained interval and its narration. Check identity/count, geography, ownership, event phase, action direction/count, contact/support, persistent damage, mechanism completion and result. For load-bearing changes, compare actual before/result cues at delivery viewing size; a descriptive caption alone does not establish the promised operation. Context, a lead-in or an explicit ellipsis can accompany speech; a contradictory event needs correction at the owning stage. Record observed, partial, unclear or unreviewed findings rather than inheriting a planned pass. Keep actual findings and narrower frame-only evidence distinct.
- At the final edit speed: check natural or deliberately stylized cadence, readable brief inserts at their selected durations, cut-on-action joins, effects against observed contact, and whether the ending fulfils the spoken promise. Camera shake, an orbit or a bright flash cannot certify physical completion. Keep listening/native-playback judgments pending when unavailable; never bypass a blocked playback route.
- For delivery: verify selected cut coverage without gaps/accidental overlaps, exact unchanged accepted narration, media lineage, expected dimensions/fps/frame count and complete export decode. Inspect the delivered export at cut boundaries for unintended black flashes or missing picture; decode success and manifest coverage do not prove that every covered frame contains its source. Interpret intentional fades/black intervals against the edit. Preserve originals, versions, IDs, requests and rejected takes; count actual paid attempts once and leave unpriced infrastructure costs unknown. Keep internal selection distinct from creator approval. Place completed assets promptly as unapproved previews while production continues.

Repair demonstrated failures with the smallest useful edit or bounded take; do not multiply blind retries. Save incomplete/partial mechanics honestly and do not let a later cut silently assume unachieved completion. Respect new creator stops and preserve resumable IDs on failures.

# Requested template review

For creator-requested script review, comparisons or template refinement, read [template refinement](references/template-refinement.md). Keep reference examples out of fresh writer contexts and preserve failed tests. This is separate from the director's normal verification responsibility.

# Production boundaries
Higgsfield handles audio, GPT handles still images, and the creator's installed MiniMax handles video. Do not substitute Higgsfield video or Qwen images. Use [the creator's saved Holden/Seed Audio default](config/narrator-default.json) unless overridden, retaining the exact voice pair and nonzero pace settings across scenes and projects. Discover actual model controls and do not invent emotion fields. Audio direction must request expressive communication and scene-specific changes using the actual model's documented prompting mode. The audio reference includes faster-speech and conservative dead-air editing guidance; a speed edit cannot create acting.

For MiniMax read `tools/minimax_h3/AI_INSTRUCTIONS.md`, use the existing client/live configuration and documented private IAP route, and reconcile saved jobs before submission. The shared GPU is sequential and automatically unloads weights after all submitted work is finished. Do not alter services, GPU stack, IAM or networking as routine production.

Report what the evidence establishes. Text reviews are not listening tests or audience metrics. Frames and probes do not establish native-rate motion. Preserve pending playback checks and unpriced infrastructure costs honestly. No media retry batch follows a writing comparison automatically.
