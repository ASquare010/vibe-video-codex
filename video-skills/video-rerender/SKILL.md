---
name: video-rerender
metadata:
  display-name: Realistic video remake
description: Analyze and remake a supplied animation or video as photographic live action in VibeCut. Use for source-grounded shot planning, motion and continuity diagnosis, image/video generation, editing and production cost tracking. Preserve the source's causal action, camera geography and requested dialogue; this is not the narration-first workflow for original prompt films.
---

# Realistic video remake

The goal is a coherent film: the same events, spatial relationships, force and story, performed by believable people in photographed environments. A beautiful isolated clip is insufficient if the next shot contradicts it. VibeCut is the editor; the main chat analyzes evidence and uses available generation tools.

## Start from the requested mode and live project

Read the current request, canonical `project.json`, selected skill, relevant creator notes, character/location references, and receipts needed for the scope. Distinguish **diagnose**, **plan**, **generate**, **place existing media**, and **finish**. A diagnosis or timeline-organizing request does not launch paid jobs. Existing files and receipts are history, not instructions to regenerate. Honor stop requests; finish only already-authorized in-flight work when asked.

Use the project's actual language, format, model preferences, exclusions, scope, keepers and budget. Never infer scope from the largest scene number. Do not bake one video's characters, scene numbers, credit balance, provider prices or cut count into this reusable skill. Project-specific casting and aliases belong in that project's character reference; renaming alone is not rights clearance.

When the project selects the installed MiniMax H3 server, first read [references/minimax-h3.md](references/minimax-h3.md) and its linked local AI instructions; the explicit model choice takes precedence over the ordinary provider routes.

For production, use [references/production.md](references/production.md) for tools, provider routing, cost accounting, batching and safe timeline writes. For diagnosis or repair, also use [references/continuity-review.md](references/continuity-review.md). Instructions there are part of this workflow, not optional afterthoughts.

For photographic image/video prompts read [references/live-action-prompts.md](references/live-action-prompts.md): shared look, required scene contract, compatible-reference rules and model-specific templates. Keep identities and world geography stable while allowing the source's body/camera movement. Use the current action module; avoid generic combat or frozen-framing suffixes on every shot.

## Follow the creator's production order

When the creator requests sequential production, complete one scene before generating the next: create/reuse its images, immediately place the selected photographs as unapproved image previews on that scene's timeline, perform the authorized image review/corrections, generate video, replace the photographs with the completed unapproved video draft, then perform the authorized video/join review and update the timeline. Current instructions can omit reviews/retries; do not restore a superseded review loop. Use an explicitly linked group only for one continuous action or complete phrase; retain source scene IDs/cuts.

Do not keep generating later image batches or queue later videos in sequential mode. Previously prepared images, completed takes and alternatives remain reusable; a workflow change does not mean starting again. Images-only work stops before video submission.

After an interruption, read the live project, its saved `jobs/<run>/RESUME_HANDOFF.md` when present, and actual requests/IDs/receipts before continuing. Preserve completed work, the current review gate and unresolved submissions. Never replay a request solely because its worker was interrupted or its host changed.

## Establish what actually happens

Review the relevant sequence in motion, with enough lead-in and follow-through to understand its cause and destination. For an episode plan, survey the whole included story before planning individual takes. Inspect short native-rate intervals where contacts, cuts or effects are unclear. Use a bounded 640px proxy and modest contact sheets first; zoom or inspect dense frames only where needed. A first frame, sparse thumbnail grid or plot transcript cannot establish an action.

Use two classification passes before generation. **First pass:** propose camera-change candidates and record transient light/motion events without treating each score spike as a new production scene. Structural checks can reject some flash-induced boundaries; they do not understand plot or motion ownership. **Second pass:** compare the last native frames of the previous coverage, first/current movement and next coverage, including several neighbors when needed. Group one coherent gesture/impact/dialogue or camera move; split at a genuinely different setup or action beat. If only part belongs to a neighbor, split that part first and join it to the correct side. Repeat the adjacent-window review after edits.

A **production scene** is a coherent generation/edit unit, not automatically one detector interval or one camera angle. A release and its hit, a face-to-hand action, or a continuous book-to-healing camera move may belong in one production scene while retaining the actual source camera views as subshots. Conversely, an indexed scene can contain a missing target/reaction cut and need splitting. Keep stable aliases for absorbed scene numbers; never renumber the entire film or erase camera coverage merely to reduce the count.

Treat automatic cut detections as **unverified candidates**. Inspect each proposed generation interval throughout: a single indexed scene can still contain an internal camera cut, a projectile crossing to its target, or a reveal. Verify the actual camera coverage before labeling a take locked or continuous. Separate a camera cut from camera motion, a flash, occlusion or rapid subject movement.

Preserve meaningful approach, entrances, establishing geography, contact, reactions, eyelines, effects and recovery. Preserve complete relevant dialogue. Redundant holds may be shortened; false cuts may be coalesced after visual verification. Keep essential source camera setups as distinct coverage even if grouped into one production sequence. Do not remove causal coverage to fit a desired scene count or save minimum-duration charges. Sharing a paid take does not require deleting its source timeline cuts.

Skip verified non-story intro/theme, outro/credits and other creator-excluded intervals; record exact exclusions. Retain story-bearing prologues and transitions. Preserve stable scene IDs, numbers and source times for communication. New discoveries receive unused numbers, not a renumbering of existing references.

## Plan the sequence before independent prompts

Save a compact **action-state ledger** for each connected sequence. It may live in scene continuity/shot states or a scene-relative plan file; follow the app schema. Record only decisions needed to make and review the footage:

- Source interval and verified camera coverage; narrative purpose and any uncertainty.
- Camera height/angle, perspective, crop, movement and screen direction.
- Who is present, actor/creature scale, positions, facing, occlusion, prop identity and hand ownership.
- **Incoming action phase**, support/weight, velocity/direction and existing contact; the event, target, impact/outcome and outgoing state.
- The prior and next shot dependency, required visible connecting event, dialogue/sound/effect cue and target edit duration.

“Same characters in the forest” is not a continuity state. An already pinned character must not become an approaching defender; a hand cannot change owners; a wounded reaction cannot precede its cause. Verify allies and enemies from source evidence rather than inventing combat between nearby characters.

Describe motion in depth as well as screen direction: distinguish lateral travel, approach/retreat toward the lens, subject size change and camera movement. Ground that description in successive source frames; do not inherit it from an old generation prompt. A saved take with a similar left/right vector can still fail if its depth, scale progression or camera path differs. Mark uncertain geometry as unresolved before writing a replacement prompt or accepting reuse.

## First images represent the correct instant

For source-to-photograph generation and multi-image motion guidance, read [references/photographic-references.md](references/photographic-references.md). It defines source-camera authority, action-phase selection, adaptive reference coverage, photographic quality and the source-versus-output review. Use the creator's selected image tool and keep an images-only request separate from permission to render video or reload a paused server.

Match source camera geometry and actor placement. Use the source as layout/action-phase authority and approved realistic references for identity, wardrobe, props, creatures and terrain. Compare the proposed first image with the corresponding source **and the preceding rendered endpoint** before video submission.

Start in the phase the story requires: already swinging, braced under contact, mid-flight, retreating or recovering. Do not add an idle pose, new wind-up or preparation merely because a generation begins there. A photographed ready pose will tend to produce another start from rest, regardless of “fast action” text.

For a compatible continuous view, use an accepted preceding endpoint as image guidance where supported, retaining motion direction as well as pose. At a source camera cut, reconstruct that same physical instant from the required new view; blindly reusing the old image would erase the camera cut. A changed image alone cannot encode velocity: supply concise outgoing motion and the next immediate event. First/last-frame constraints and video references are conditional tools, not universal requirements; do not force incompatible endpoints or assume interpolation will recover missing mechanics.

Check photographs against each other before asking video to connect them. Derive same-view phases from one stable photographic set/cast base. Assign secondary images to actual pose/detail/view roles instead of treating every picture as an endpoint. Correct/omit conflicting reference geometry within authorization; wording cannot reliably prevent incompatible backgrounds from morphing. Preserve world landmarks through camera parallax rather than freezing every screen coordinate during tracking/running.

A relevant reference is more than a realistic-looking file. Compare each proposed image with its exact source moment: framing, person count/identity, gaze, loaded stance, injuries and foreground/background relationships. Record meaningful props and their owners, hand/grip, orientation, open/closed state and current contact. A book or staff must not disappear, a weapon must not change hands, and an enemy must not acquire the defender’s shield. Track visible changes and off-screen carryover across the next cut. Treat an image as unreviewed when these details are unknown, even if it is photographic. An identity/material crop is not proof of the scene’s composition.

Photographic realism includes ordinary facial proportions, practical materials, plausible exposure and human joint motion. Favor natural lighting appropriate to the source setting; avoid unrequested portrait crops, game gloss, extreme contrast and beautification. Inspect revealed faces, weapons and creature anatomy through the take, not just frame zero.

## Give the video model a small, complete job

Keep detailed analysis in the plan. Send a concise prompt for one coherent camera take: **current loaded state → immediate movement/target → visible contact or event → displacement/reaction → outgoing motion**. Mention only the continuity constraints and sound/dialogue needed for that shot. Do not prescribe a wind-up when it has already happened. Avoid long stacks of prohibitions, contradictory stages, or extra attacks. Model prompt length is not a substitute for source analysis.

Translate cartoon biomechanics into believable adult stunt articulation: support foot, center of mass, hips/torso drive, joints, weapon weight, contact, recovery. Preserve fantasy force through abrupt acceleration, strong displacement, debris and sound where appropriate; do not replace it with an ordinary gentle hit. Allow brief natural shutter blur and uneven acceleration, not floating poses, uniform easing or repeated resets. Blur and speed cannot repair wrong bodies, missed contact or warped space.

Ordinary coverage still needs a composition-checked realistic image, with appropriate breathing, balance and ambient motion. Use the requested dialogue language and verify exact wording/speaker from short aligned audio passes. Do not invent certainty from a long transcript or visual frames. Keep speech, sound effects and lip timing aligned; follow the creator's music preference.

Preserve an effect's **function**, shape/path, source, target, timing and consequence. A brief flash, branching electrical strike, projectile and sustained beam are different events. Match the source's readable attack without gratuitously extending it. A global exposure flicker is lighting, not a replacement for a visible strike or projectile. Post effects must attach to the actual action and impact; see the review reference for timing checks.

## Duration is an editing decision, not a model promise

Choose a currently supported native duration and quote its full cost. The native minimum does not determine the final shot length or require slow action. After generation, locate the **complete useful action phase** and its contact/recovery landmarks. Trim idle handles, then fit that phase to the source beat when needed:

`speed = useful_native_action_seconds / desired_edit_seconds`

For example, a complete 1.8-second movement fitted to 0.9 seconds requires 2x, not keeping only its first 0.9 seconds at 1x. This is an example, not a recommended universal multiplier. Review the result at real speed: if it becomes unreadable, exceeds tool limits, damages sound or cannot preserve the required action, choose a different saved phase or flag the take for repair. Do not conceal a missing action with a severe speedup.

Retime picture and synchronized sound together and preserve speech intelligibility/pitch. Avoid speeding dialogue by default. Check baked-in processing and existing clip speed before changing a reused take. Follow the project's frame rate; do not add optical-flow smoothing to fast combat without a specific reason. A modest fight speedup may suit some takes, but a fixed percentage is not a repair method.

## Review sequence quality before accepting it

After authorized video generation, inspect the untouched native take and the selected edit beside the actual source at normal playback speed, including the preceding and following shots. Correct wrong outputs within the authorized repair scope, then review the corrected sequence again. Reference-image approval is not video approval; do not defer all review until the full film is generated. An images-only task records this later review requirement without starting videos.

Compare source, untouched generation and selected edit; inspect both sides of every changed join in motion at normal playback speed. Test camera geography, identities/props, incoming/outgoing motion, visible cause/contact/consequence, effect timing, complete dialogue and sound continuity. Distinguish rendered defects from player buffering. Mechanical playback validation is not story or motion approval.

For a failed sequence, explain the **observed discrepancy, its evidence, likely cause, and smallest repair**. Separate prompt intent from delivered pixels and uncertainty from facts. Prefer correcting selection, timing, reusable media or post effects before a new paid request when those can actually solve the problem. A structurally valid scene list, successful API response or photoreal image does not establish a successful film.

Keep failed alternatives and raw media for comparison. Do not silently accept defective footage to fill a final slot. When the creator asks to preview it, place it as a clearly marked unapproved review draft with its defects retained. Stop at the requested review scope and report remaining failures and incurred costs honestly; never claim the skill guarantees flawless output.
