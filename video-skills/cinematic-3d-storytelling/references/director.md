# Audio-to-visual direction

Read after the story and narration are accepted, before writing image prompts. The visual director owns dramatic staging, physical choreography, the persistent world and editing intent. It expands what the accepted story implies without silently changing its events or outcome. These are separate responsibilities and saved artifacts; the skill routes execution without requiring a new service or model switch.

## Handoff and audio evidence

Take the full idea and ending, exact scene speech, accepted audio files/durations, available phrase alignment, fictional/factual boundaries and existing design assets. Use the writer's researched story and exact words as the narrative basis. For an existing draft, any writer-proposed shots are provisional coverage suggestions, not a locked production shot list. Preserve accepted words and voice files while directing the coverage.

Determine the audio mode before deriving events:

| Mode | Reliable timing input | Visual design decision |
| --- | --- | --- |
| Narration only | Measured speech, phrase windows and intentional pauses | Design the visible action; narration does not contain recorded gunshots, crashes or footsteps just because it mentions them. |
| Supplied action soundtrack | Actual dialogue, observed sound events and their measured times | Infer possible causes, preserving uncertainty and any deliberate sound/image offset. |
| Hybrid | Separate speech, supplied effects/music and planned effects | Label each anchor's origin and decide which timings are fixed. |

Keep observation, inference and invention separate. Store an event's source file, local interval, event type, timing status and evidence basis. Use confidence only when supported by an actual method; do not invent numerical certainty. An onset or loud peak alone does not identify a weapon, actor or successful hit. A soundtrack can leave the source offscreen or be ambiguous. If only text is available, return provisional timing and an unmeasured audio status.

Use existing audio/word alignment tools when needed and available. Waveform/onset/beat analysis and sound-event classifiers are optional evidence tools for an actual effects/music track, not mandatory dependencies for narration. Do not install a stack, alter the GPU services or claim analysis was performed because a research document recommends it.

## Direct the sequence before selecting shots

Identify the audience's immediate concern, the participant's objective, the obstacle or opposing action and how the situation changes. Group linked action into a sequence; it may span several continuous audio scenes. For an explainer, use a test, mechanism or discovery that changes understanding instead of inventing an adversary. For quiet material, behavior, concealment, observation and shifting knowledge can carry tension.

Choose the sequence's essential visible developments: the meaningful setup, attempt, contact or discovery, response, reversal and consequence where applicable. The sequence needs a progression that can be understood from its pictures, not a catalogue of mentioned nouns. Give its strongest development clear, legible coverage. Do not let greetings, boarding, walking, loading, gathering or medical logistics occupy most of an action sequence merely because those are easier to generate. Retain them when they create a dilemma, expose vulnerability, pay off a choice or resolve the actual story. Do not replace a rescue with invented destruction to satisfy an action quota.

Make the opposing force, obstacle or time pressure act on the protagonist. Show attempts meeting resistance and changing what can happen next. Plan physical causality: action source, target, path, support, contact/miss, reaction and persistent result. A miss changes danger or opportunity; a damaged object stays damaged; a retreat is caused by something. Establish dependencies so a reaction cannot precede its cause or a second attack start from an impossible position. Compress irrelevant travel, not the decisive operation.

Give the sequence a felt point of view. Decide what the audience knows before a participant, what is concealed, when the threat becomes visible and what small behavior makes a decision or cost tangible. Alternate scale, proximity, visibility and tempo as the situation changes. Preparation creates expectation, decisive action changes the situation, and a readable aftermath lets it register. Continuous maximum intensity, repeated explosions and a new angle every few seconds do not create this progression by themselves.

## Build one world that can be filmed from several places

Establish a practical set layout: routes, exits, elevations, distances or relative scale, cover, obstacles, light/weather, contact surfaces and landmarks. Record the important sightlines and what blocks them. Track actor/vehicle/prop IDs, body scale, clothing or markings, ownership, movement direction, damage and capabilities. Screen coordinates belong to each camera; persistent world positions do not become left/right labels.

## Choreography and cut states

First produce a beat/dependency plan without camera jargon. Then choose where the audience must look to understand and feel each change. Several beats can fit one take; one decisive event can be covered across several cuts. A new angle, sound onset, sentence or key pose does not automatically require a new cut.

Design the payoff as a visible causal beat, not an isolated symbolic insert. Identify the established object or relationship that carries the ending and the minimum observable evidence needed to understand its changed state. If an internal mechanism is unfamiliar or cannot be verified, prefer an established external behavior/reaction with coherent sound over inventing an interface. Record what remains inferred: an audible click and lack of output can communicate a failed attempt without proving the precise internal cause. Give the audience enough context to recognize the object and enough result time to register the payoff.

Plan the minimum meaningful key states for a difficult event: opening, decisive contact/change and outgoing state as needed. Each is a physical state, with the same persistent world and explicit action phase. They may be written pose specifications without commissioned images. Generate additional keyframe images only when authorized and when they resolve a real ambiguity. Distinguish:

- **Opening input:** selected still that MiniMax must start from.
- **Design reference:** identity/material/layout evidence with a scoped role.
- **Storyboard target:** a desired middle/end state used for direction or review.
- **Timed control:** use this label only for a control actually exposed and verified on the chosen endpoint.

Multiple uploaded pictures are not automatically start/contact/end constraints. In this installed MiniMax workflow, prefer the selected opening still plus a concrete motion prompt when sufficient. Do not invent `start_frame`, `end_frame`, depth or pose-control API fields, or force incompatible stills into interpolation. Split a real editorial cut into another take; carry its resulting state in the plan. A storyboard target is not proof that generated motion passed through it.

## Synchronization and production records

The accepted narration remains the master continuous speech track, one file per audio scene. Record frame intervals and phrase anchors against that file. Keep action phase times separate from cut boundaries and separate scene-local, cut-local and source-file time bases. A spoken mention is usually a semantic window, not an exact impact timestamp. Preserve chronological cause and effect while allowing explanatory or retrospective narration when that relationship is explicit.

For existing supplied effects, align the intended visible contact/result with the measured sound anchor, allowing deliberate distance or stylization offsets. Preparation and acceleration begin before the contact anchor. For narration-only work, plan effects as `planned`, then place them against observed video contact after generation; do not pretend a recorded impact already exists. Do not accelerate the accepted voice or stretch whole clips merely to hide a bad contact. Local selection, effects placement or a bounded repair can address an observed mismatch; retain originals and record edits.

Save a versioned direction artifact containing:

| Record | Required meaning |
| --- | --- |
| `source` | Script/audio paths and hashes, measured duration, audio mode, timing evidence and accepted constraints. |
| `sequence` | Objective, audience concern, progression, essential visible developments and payoff; linked scene IDs. |
| `world` | Stable actor/prop IDs, dimensions, positions/orientations, set geography, sightlines, capabilities, source-to-target paths, layout references and initial state. |
| `audioEvents` | Observed/provisional/planned events, intervals, time base, evidence and interpretation kept distinct. |
| `beats` | Stable ID, source/target, cause/dependencies, action phases, before/after state, story basis and timing anchors. |
| `cuts` | Beat IDs, audio scene/phrase, interval/status, dramatic job, action geometry, incoming/outgoing state, keyframe roles and image/video lineage. |
| `review` | Actual findings on dramatic coverage, mechanics, continuity and sync; unmeasured or unavailable checks remain pending. |

This artifact complements the app manifest; do not overwrite `project.json` with it. Preserve submitted prompts and source hashes. Template revisions apply to future authorized planning, not retroactive edits to job receipts or an active run.

## Story-to-direction handoff

The director expands physical actions into separate cuts without adding narration, repeating sentences or forcing every detail to be spoken. Phrase anchors must occur in narration order and clearly identify their intended moment. A strong listening script can still have weak proposed coverage. A successful voice performance does not validate a proposed shot plan.

Derive the direction handoff from the accepted story: the experience promised, participant objectives or line of inquiry, obstacles/opposing responses, essential visible developments, required before/after states, accepted outcome and factual/fictional limits. These classification/constraint fields are private production context, never extra spoken lines or disclaimers for the audio or visual agents to append. Mark which events are explicit, reasonably implied or unknown. State any dramatic sequence that crosses audio-scene boundaries. Keep these as story intentions, not a locked camera list. Give the director room to choose choreography and images after listening to the accepted audio. If the promise is an action encounter, ensure the story actually develops attempts, opposition, reversals and consequences rather than spending its substance on routine logistics around an encounter that never develops. Quiet genres can build change through observation, knowledge and behavior instead.

Each shot has a stable ID such as S01-A, phraseAnchor quoted exactly from its scene, newInformation, event, incomingState, outgoingState and timingStatus set to provisional. Each shot is one continuous camera/subject event. An edit, inserted view, reverse angle or return requires another shot record under the same audio scene. Make elapsed time explicit between shots when needed. Keep location, held objects, supports and handoffs physically legible. Give decisive visible actions room; do not fix a missing spoken development only in coverage notes. Proposed coverage is not an image or video prompt.

Resolve enough coverage before paid generation to avoid discovering a missing operation during video production. Often 2–5 seconds carries one focused beat; longer shots need developing action and new information. This is a pacing guide, not an equal-block timing rule. Several phases can share a narrated clause, and narration may continue across a silent visual reaction. Protect measured audio, not the original proposed image count. If coverage needs more images, prepare those images at the authorized stage rather than asking a video model to invent several cuts inside one take.

If phrase timing is unavailable, mark timings provisional and align them before placement. Do not change accepted narration to fit a convenient number of pictures. Save the plan and reference roles so the video stage can use the same motion intention and actual selected starting state.

For this creator's energetic film style, divide continuous scene audio into visual beats that show a developing event: an entrance, preparation, contact, an object changing hands or place, a reaction, or a result. Change the view when the viewer needs new information. A long scene is not one long shot by default. Several narrated events need coverage; a 14-second drift past one held pose is not that coverage. Short foreground beats often need about 2–5 seconds, while a longer shot must contain enough purposeful visual development to earn its duration. Do not impose equal lengths or a fixed montage formula on every subject.

Continuity is necessary but does not establish compelling direction. Make the audience experience an objective meeting resistance, a discovery or a change in risk, knowledge or options. Give the story's decisive physical developments visible coverage; assess whether routine logistics are displacing the promised experience. More images, more camera moves and more explosions are not substitutes for that progression. Preserve the story's factual/fictional boundaries and accepted outcome when elaborating its visuals.

The image role owns camera angle, viewer perspective, expression and composition. The animation role owns camera movement. Carry their returned details in the shared record without replacing their guides with another camera planner.

## Reusable director planning instructions

```text
Act as the visual action director for the supplied story and accepted audio. Return a direction plan, not image prompts or generated media yet.
FULL STORY AND ENDING: {ACCEPTED_IDEA_AND_EXACT_SCRIPT}
AUDIO HANDOFF: {SCENE_IDS; EXACT_SPEECH; FILES; MEASURED_DURATIONS; AVAILABLE_ALIGNMENT_OR_UNMEASURED_STATUS; NARRATION_ONLY_ACTION_SOUNDTRACK_OR_HYBRID}
CONSTRAINTS: {FACTUAL_OR_FICTIONAL_BOUNDARIES; FORMAT; EXISTING_DESIGNS; ACCEPTED_OUTCOME; AUTHORIZED_STAGE}

1. Identify the audience concern, participant objective and changing situation. Separate story requirements from optional visual elaboration. Treat any existing shot suggestions as provisional.
2. Build the persistent world, relevant sightlines, identities, capabilities and initial state. Reuse supplied designs; label missing evidence.
3. Extract actual audio timing evidence separately from interpretations and planned effects. Do not infer recorded action sounds from narration or fabricate timestamps/confidence.
4. Design a connected physical sequence with setup, attempts, opposition, decisive changes and consequences where appropriate. Track causes, source/target/path, support, contact or miss, response, persistent damage and resulting options. For critical mechanisms specify component-relative start, traversal, endpoint and visible completion evidence, separately from camera/body motion. Make the essential story developments visible. If the accepted story lacks the promised experience, flag that limitation instead of inventing new events behind the narration.
5. Choose changes in audience knowledge, rhythm and attention. Explain how the strongest visual developments create anticipation, impact, discovery or relief. Cut or compress routine logistics that add no necessary state, tension or meaning.
6. Map beats to proposed cuts and audio phrase windows. Specify which beat is shown directly, shared across cuts, offscreen or deliberately elided. Every cut has a dramatic job and a continuous camera/subject event. Preserve geography and state at the joins. Reserve readable coverage for the decisive change and consequence; close views must continue the same event rather than repeat it. Make the ending's meaning recognizable through established objects and observable behavior, with any internal diagnosis kept distinct from visible evidence.
7. Specify opening, critical and outgoing key states where needed, with reference roles. Keep storyboard targets distinct from verified model controls. Do not require multiple timed-image inputs from a model merely because the board has several poses.
8. Return the versioned source/sequence/world/audioEvents/beats/cuts/review artifact, with existing evidence or pending status. Label timings and subjective judgments honestly. No paid generation or project mutation follows from this planning prompt.
```
