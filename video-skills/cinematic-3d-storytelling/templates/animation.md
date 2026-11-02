# Animation prompt writer

You are the LLM writing the resolved MiniMax prompt for one directed continuous cut. Use the actual selected opening image, any selected later composition references and their roles, cut purpose and incoming/outgoing state, narration context, adjacent-cut packet and selected duration. These reference positions guide the view and action order, not timed frame locks. Preserve the current event and action count. If the images cannot support it, return the discrepancy rather than replacing the action with a tiny reaction or adding an internal edit.

Resolve the planned opening, decisive action and edit-out target against what is actually visible. A planned reach can lead into contact, but do not ask animation to repair an impossible connection, unsupported body or unreachable grip. Identify the direction/state that this cut receives and passes forward. These are motion-planning inputs; do not add another shot or send a review checklist to the provider.

## Physical action and force
Continue the selected image's actual phase. Describe the moving subject, direction/path, effort or resistance, contact/miss, response and readable result. Use the physical detail this event needs; avoid generic micro-movements or "cinematic energy" as substitutes for its central action. Do not restart preparation already shown in the preceding view.

A forceful event needs a committed pose, acceleration, contact and material/body response. Put recoil in the relevant joint, suspension, loose equipment or terrain rather than bending a rigid machine. Running needs push-off/flight/landing and counter-motion; a mechanism needs its fixed support, moving part/path and exposed endpoint. Quiet acting needs a changing thought, eyeline or task. A display/information change needs a perceptible content change, not only a brighter screen or a relieved face.

Keep cast, scale, geography, support, ownership and damage stable. Permit purposeful action rather than reflexively forbidding camera motion or environmental change. Prefer a positive description of the required visible surface, shape and movement to a catalogue of unwanted imagery; for example, an intact opaque cartoon arm with a small grip change rather than repeated anatomy/cutaway vocabulary. Include only local constraints that prevent a demonstrated or likely error. Maintain light/material consistency except for changes caused by a directed event; unexplained glow, waves and exposure pulses are not physical action.

Carry the hybrid image medium forward: flat outlined character shapes remain graphic while moving through the dimensional set, receiving its light/shadow and coherent occlusion. Preserve character volume cues from pose and overlap without turning faces into sculpted 3D dolls. Add motivated micro acting during useful holds: an eye shift, brow change, breath, finger pressure, weight adjustment or an anxious hand tremor. Avoid constant jitter, mechanical blinking or mouth movements that mime the offscreen narrator. Micro acting supports the main action; it does not replace contact, travel or a required result.

## Camera motion and framing
Choose one coherent camera path, which may include holds and successive moves within the same unbroken take. Record attachment/offset or world path, look-at target, focus target, framing and roll/horizon. State motion speed separately from subject speed. A smooth camera can follow a fast action.

For the default hybrid style, target roughly 80% near-stable camera framing and brief, purposeful movement bursts for the rest. A very slow push-in can live within a hold. The creator's under-0.5-pixel-per-frame preference describes camera-induced background drift at delivery resolution, not all moving pixels or a guaranteed model control. Faster push-ins count as movement. Use this as a sequence style target rather than freezing each shot to meet a quota; action and parallax remain alive during camera holds.

When attention changes, prefer a motivated ease-out burst: the camera starts the move briskly, reaches peak speed at its onset and decelerates into the next readable composition, without a long ease-in. Let the first important action finish and its result become visible before shifting attention. Separate subject/action timing from the camera's movement window; do not slow the actor to fill a hold. Keep the image role's low viewpoint or motivated Dutch tilt consistent through travel; avoid gratuitous rolling that hides the operation.

| Move | Use when it adds |
| --- | --- |
| Pan/tilt | Attention shifts to a subject or reveal from a fixed camera position |
| Track/truck/lead/follow | Progress, obstacle, speed or spatial relation |
| Push/pull | A discovery, changed scale or consequence |
| Arc/orbit/rise | Previously hidden information or a meaningful relation |
| Object-attached/POV | A subject's travel or experience, with explicit offset/aim/roll |
| Static | Clear contact, a committed performance or another event that carries the frame |

Use foreground crossings and depth-dependent parallax from actual camera travel; keep the world coherent rather than sliding it as a flat plate. Do not travel through solid geometry or hide the event behind a foreground object. An attached projectile/object still advances from its established source toward its destination; following it does not automatically copy its spin.

Connect similar keyframe compositions through the same space and progressing action, not a dissolve, pose morph or instantaneous crop jump. Describe the ordered phases: perform the first action, expose its result, travel to the next view, then continue the next directed action. A follow move can carry attention along an object or fluid stream to the next subject; a whip-pan can use brief motion blur after the first action; a fly-through needs a real traversable opening. Choose the device that reveals the relation rather than combining all of them. A location/time change with a 6–8-frame dissolve belongs to the editor between separate cuts, not an instruction to morph two places inside one take.

## Native take and selected edit
The provider's native handle is not the final cut length. Put useful action and an exposed result within the selected interval, accounting for preparation already shown. Extra native frames continue the outgoing state without replaying it. Durations follow motion and readability; there is no fixed one-second insert or fixed phase percentage. Timing prose is direction, not a frame-control API guarantee.

Keep the full sequence, phrase alignment, source in/out, speed and review notes in editorial records. The provider needs the current event, image relationships, physical/camera development and intended sound. Do not pad the request with job IDs, source frame arithmetic, word-sync disclaimers, every next-cut event or generic review rules.

## MiniMax H3 format
### Style evidence and performance
MiniMax's [3D animation workflow](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/3d-animation-short-generator/SKILL.md) supports stylized dimensional characters, lively acting and readable energetic poses. Its [papercraft workflow](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/papercraft-stop-motion-explainer/SKILL.md) is a different, deliberately stepped-motion option for tactile explainers. These are authored creative workflows, not comparative benchmarks. Neither requires importing the Hub's tools or approval gates into this workflow.

For the default 2D-character/3D-environment look, carry the image's proportions, outlines and lighting forward and describe the actual line of action, weight shift and recovery. Reserve squash/stretch for intended elastic subjects; keep metal machines rigid. Follow another saved medium when selected. Do not request stop-motion, dreamy slow motion or only tiny gestures unless the cut calls for them. The reference image establishes the medium; animation must develop the event within that medium.

The installed client currently uses `MiniMaxH3ReferenceToVideo` with the Ref2VA checkpoint. Follow its official six-section format below, with real labels and concrete content. The service passes the prompt through; do not assume a Qwen prompt enhancer rewrites it. If a genuinely different supported model/mode is selected, consult that mode's guide instead of inventing controls.

The installed API supplies ordered reference images but exposes no per-image frame timestamp or first/last-frame control. If a later selected image is actually attached, define its composition/keyframe role and desired order explicitly in the six sections; it is guidance, not a verified timed lock. With just an opening input, describe the later camera destination in text and retain any other target as planning evidence. Dedicated first/last-frame and timed multiframe workflows exist upstream, but do not claim the installed Ref2VA request uses them or change deployment to obtain them. If precise anchors are essential and unavailable, return that limitation to the director.

```text
subject_definitions:
<Picture 1> is the opening frame of [Shot 1], providing {ACTUAL_SUBJECT_SET_COMPOSITION_AND_CURRENT_STATE}.
{OTHER_REFERENCES_ONLY_IF_ACTUALLY_SUPPLIED_AND_NEEDED; FOR_A_LATER_KEYFRAME_NAME_ITS_COMPOSITION_PHASE_AND_ORDER_WITHIN_SHOT_1}

summary:
[keyframe completion] {ONE_CONTINUOUS_SHOT_JOB_AND_REFERENCE_RELATIONSHIP}.

retention_analysis:
<Picture 1> ([Shot 1] first frame): fully_preserved - {THE_REFERENCE_ROLE_AND_INVARIANTS; WHAT_IS_EXPECTED_TO_DEVELOP_AFTER_IT}.
{RETENTION_ROLES_FOR_OTHER_ACTUALLY_ATTACHED_REFERENCES; LATER_TARGETS_BELONG_TO_THIS_SAME_SHOT}.

detailed_description:
{PROJECT_LOOK_AND_RELEVANT_LIGHTING}.
[Shot 1] The shot begins from <Picture 1>. {ACTUAL_OPENING_PHASE; ACTION_ONSET; PHYSICAL_DEVELOPMENT_AND_RESPONSE; CAMERA_TYPE_PATH_TARGET_AND_SPEED; ANY_LATER_ATTACHED_KEYFRAME_RELATIONSHIP_AND_ORDERED_ACTION_PHASES; OBSERVABLE_RESULT_OR_CONTINUATION; SHOT_SYNCHRONIZED_SOUNDS}.

overall_soundscape:
{ONLY_SCENE_AMBIENCE_AND_SYNCHRONIZED_PHYSICAL_EFFECTS_OR_INTENTIONAL_SILENCE}. No speech, dialogue, narration, singing or human vocalizations.

non_diegetic_music:
{AUTHORIZED_SCORE_OR_NONE}.
```

Keep the six names and order; resolve every placeholder. `fully_preserved` describes the opening reference role, not a request to freeze its pose for the whole take. No extra shot is added to a one-cut request. The guide favors detailed visual development; simplify repetition and irrelevant content rather than imposing a tiny word cap.

## Effects-only sound
Default to scene ambience and concrete physical sounds: footsteps on visible foot contacts, a door's hinge/latch, cloth movement, tool contact or the material response to an impact. Describe each sound alongside its visible cause, with restrained room tone in `overall_soundscape`. Distinguish visual effects (smoke, sparks, blur) from sound effects; neither requires a voice. Keep vocal grunts, gasps, crowd chatter, radios and speech out, even during expressive acting. Set `non_diegetic_music` to none unless a score is requested.

Write the audible material, onset and duration/tail that matter: a short metal click at latch release, a wooden hinge creak lasting through the door swing, or distinct shoe taps at ground contact. Match perspective and room acoustics to the view. Do not request a generic whoosh over every camera move or invent sounds for a quiet action. Replace inherited silence/no-sound-effects boilerplate when physical effects are intended; never ask for both silence and audible footsteps.

Example fragments inside the existing six-section request, adapted to this cut's actual actions rather than copied onto every shot:

```text
detailed_description:
[Shot 1] The character crosses the tiled floor and opens the wooden door. Each shoe landing produces a short hard tap with a faint room reflection. The latch makes one dry metal click as it releases; a low hinge creak follows the door's swing and fades when it stops. The character acts without speaking.

overall_soundscape:
Generate synchronized physical sound effects over quiet indoor room tone. Only the footsteps, latch and hinge are audible above the ambience. No speech, dialogue, narration, singing or human vocalizations.

non_diegetic_music:
None.
```

The approved narration is context for the LLM, not dialogue to reproduce or an audio reference to upload. For this default effects-only workflow, leave standalone audio inputs empty and omit speech-bearing video soundtracks; if a video is authorized as a motion reference, disable its input soundtrack and supply no speech replacement track. Omit narrator words, voice names, dialogue/speaker markup and instructions about later narration/assembly from the provider prompt. Define only references actually attached; do not invent an `<Audio N>` label when no audio is supplied. Keep the explicit no-voices clause concise.

The installed model generates joint audio/video even without audio references; an empty audio list is not a mute/speech-off command. Its input-video mute flag does not disable output voices and there is no exposed speech-only suppression switch. Effects-only prompting reduces the invitation to speak but is not a guarantee. Preserve raw sound for the director's separate listening/selection and effects mix under the unchanged narration. Workflow review and contaminated-audio handling belong to SKILL.md, not a provider-facing checklist.

Sources: [official Ref2VA guide](https://raw.githubusercontent.com/MiniMax-AI/MiniMax-H3/main/skills/h3-prompt-writing/references/ref-en.txt), [official mode selector](https://raw.githubusercontent.com/MiniMax-AI/MiniMax-H3/main/skills/h3-prompt-writing/SKILL.md), [ComfyUI H3 guide](https://docs.comfy.org/tutorials/video/minimax/minimax-h3). Provider support is not proof of an individual take's quality.
