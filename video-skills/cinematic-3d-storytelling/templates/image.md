# GPT still-image template

Read the accepted story/audio and director's cut states as inputs. Use [image composition](../references/image-composition.md) for angles, audience perspective, character expression, appearance, framing and light; use [image layout](../references/image-layout.md) for geometry and blockout. The writer and director do not need to load those camera guides. The image role enriches the existing cuts rather than changing their events.

Read after the story and scene audio are accepted and [the director](../references/director.md) has produced the sequence/world/beat plan. Image prompts are compiled from directed cuts and their physical states, using the whole story and exact audio as context. Do not skip choreography by translating each spoken noun or writer-proposed shot directly into an image. Resolve templates into concise standalone instructions; omit irrelevant clauses rather than stacking every module onto every shot.

Read [image layout](../references/image-layout.md) before resolving the board. For demanding geometry include a checked composition/blocking guide; preserve its projected relationships through image development. A good style match is insufficient when the selected still has a wrong viewpoint, unconvincing scale or a source aimed away from its intended target.

## Image-stage input and output

```text
Realize the directed cuts for the authorized image stage. Do not generate media from this planning request alone.
FULL IDEA AND ENDING: {COMPLETE_ACCEPTED_STORY}
SCENE AUDIO: {EXACT_SCENE_WORDS; MEASURED_DURATION; ORDERED_PHRASE_TIMES}
DIRECTOR PLAN: {SEQUENCE_OBJECTIVE_AND_AUDIENCE_CONCERN; ESSENTIAL_DEVELOPMENTS; BEAT_IDS_DEPENDENCIES_AND_BEFORE_AFTER_STATES; AUDIO_MODE_AND_EVIDENCE; REVIEWED_WORLD}
LAYOUT AND CAMERA BASIS: {SUBJECT_DIMENSIONS_POSITIONS_ORIENTATIONS; SOURCE_PATH_TARGET; CHECKED_GUIDE_OR_UNVERIFIED_STATUS; VIEWPOINT_INTENT; ATTACHMENT_LOOK_AT_FOCUS_AND_FRAMING}
ESTABLISHED WORLD: {ACCEPTED_CAST_PROP_AND_SET_REFERENCES_WITH_SCOPED_ROLES; CURRENT_STATE}
FORMAT: {ASPECT_RATIO; FPS; TARGET_IMAGE_SIZE}
LOOK: Detailed low-poly Blender-style cinematic 3D; simplified modeled forms, faceted readable silhouettes, consistent stylized cast, tangible restrained materials, contact shadows, atmospheric depth and motivated cinematic lighting. {PROJECT_SPECIFIC_PALETTE_AND_DESIGN_LOCKS_OR_EXPLICIT_CREATOR_OVERRIDE}.

If the director plan is missing, return that dependency to the director before compiling prompts. Realize its cuts in views that make the developing action or explanation understandable and felt. Choose camera positions around the same set, carrying state forward. Develop a progression of scale, angle, visibility, attention and rhythm; do not make each narrated sentence one held illustration. Give decisive changes and their effects readable coverage instead of filling the sequence with support logistics. Choose the useful opening phase for every still so the subsequent video can perform its beat immediately. Normally one selected opening still and one continuous video per cut; additional cuts need additional records. Plan further contact/end key states only where useful, with explicit roles and generation status; do not assume that uploading them gives MiniMax timed keyframe control.

Return:
1. Shared cast/prop/set design locks and simple geography, including routes, supports, landmarks and light direction.
2. The director's ordered phase/coverage map, carrying forward essential actions, causal connections, deliberate ellipses and what each view newly reveals.
3. Cut records: stable scene/shot IDs and beat/dependency IDs; exact phrase anchor and measured interval; dramatic job and audience attention; visible cast/count and offscreen participants; incoming action/ownership/state; chosen opening instant; camera start position, height, framing and attention target; one continuous path and end view; subject source/target/path/contact-or-miss/consequence and outgoing state; critical mechanism's moving part, fixed reference, traversal, endpoint and visible completion test when applicable; adjacent continuity and whether a join continues action or elides time; actual ordered reference/keyframe roles; likely shot-specific risks.
4. A resolved GPT still prompt per cut using the image template below. Keep editorial plans and movement instructions from becoming multiple times/views inside the still.

If phrase timing is unavailable, mark timings provisional and align them before placement. Do not change accepted narration to fit a convenient number of pictures. Save the plan and reference roles so the video stage can use the same motion intention and actual selected starting state.
```

## Standalone GPT prompt

```text
OUTPUT: One edge-to-edge {ASPECT_RATIO_AND_SIZE} detailed low-poly Blender-style cinematic 3D movie frame, not a collage or storyboard sheet: simplified modeled forms, faceted readable silhouettes, consistent stylized anatomy and props, tangible restrained materials, contact shadows, atmospheric depth and motivated light. {SPECIFIC_PALETTE_MATERIAL_AND_LIGHTING_LOCKS_OR_EXPLICIT_CREATOR_STYLE_OVERRIDE}.
STORY JOB: At the spoken phrase {EXACT_AUDIO_ANCHOR}, the viewer needs to see {NEW_INFORMATION_OR_CAUSAL_STATE}.
DRAMATIC BEAT: {BEAT_ID_AND_PHASE; WHAT_THE_VIEWER_ANTICIPATES_OR_REALIZES; HOW_THIS_VIEW_SHOWS_THE_ACTIVE_PRESSURE_DISCOVERY_OR_CONSEQUENCE}.
REFERENCES: {ACTUAL_ORDERED_INPUT_PURPOSES: CURRENT_SETUP / SUBJECT_DESIGN / MATERIAL_DETAIL}. {EXACT_EDIT_IF_EDITING}.
SPACE: {VISIBLE_SUBJECT_COUNT_AND_SCALE; FOREGROUND_MIDGROUND_BACKGROUND; PERSISTENT_LANDMARK_RELATIONSHIPS; LIGHT_DIRECTION}.
INSTANT: {ONE_LEGIBLE_ACTION_PHASE; BODY_SUPPORT; GAZE; HAND_OR_MECHANISM_CONTACT; PROP_OWNER_AND_CONDITION}. {ACTION_SOURCE_TARGET_AND_PATH; VISIBLE_FORCE_OR_EFFECT_OR_NONE; DAMAGE_ALREADY_PRESENT}. Capture the state before the action this cut must perform, unless this cut deliberately begins at contact or aftermath.
VIEWPOINT INTENT: {AUDIENCE_RELATION_TO_SUBJECT; THREAT_ALIGNMENT_VULNERABILITY_OR_DIAGNOSTIC_PURPOSE; ONE_DOMINANT_DETAIL_AT_VIEWING_SIZE}.
CAMERA: {ACTUAL_STARTING_VIEW_AND_CROP; HEIGHT_AND_DISTANCE_RELATIVE_TO_FULL_SCALE_SUBJECT; POSITION; RELEVANT_LENS_CHARACTER; LOOK_AT; OPTICAL_FOCUS; IMPORTANT_OCCLUSION}. Frame for {PLANNED_CONTINUOUS_MOTION} without rendering multiple times or views into one image. {APPROVED_LAYOUT_REFERENCE_AND_THE_EXACT_PROJECTED_RELATIONS_TO_PRESERVE}.
MOTION READINESS: {SPACE_AND_VISIBLE_GEOMETRY_FOR_THE_SUBJECT_PATH; REQUIRED_CONTACT_OR_SUPPORT; DEPTH_LAYERS_FOR_CAMERA_PARALLAX}. Capture {PRECISE_OPENING_PHASE}, leaving the intended action available to perform rather than already completed. {IF_MECHANICALLY_CRITICAL: CLEAR_MOVING_PART_JOINT_AND_FIXED_REFERENCE; UNOBSTRUCTED_SWEEP_OR_TRAVEL_SPACE; VIEW_THAT_WILL_REVEAL_THE_REQUIRED_ENDPOINT}.
CONTINUITY: Carry forward {SPECIFIC_PREVIOUS_STATE}. Keep {ACTUAL_INVARIANTS}; show {ONLY_AUTHORIZED_CHANGE}. {FEW_SHOT_SPECIFIC_FAILURES_TO_AVOID}.
```

A still is one instant, not an instruction to perform several seconds of choreography. Select the useful starting phase instead of repeatedly commissioning generic hero poses. For mechanisms show the state/connection that explains operation. For acting show a meaningful task, thought or reaction. For environments give scale, layers and a reason for the camera to move.

Keep the production-input board distinct from the action/story review board. The former shows each selected starting image; the latter must let the creator see decisive action and outcome, not just a row of preparations. For important beats include an explicitly labelled planned contact/result state where useful, or actual decisive frames once video exists. A cut can begin during an ongoing action, at contact or in aftermath when continuity supports it; not every opening must precede all action. Never rewrite an input's lineage or present an extracted result frame as the original generation reference. A blank pre-fire input does not prove missing video action, and an attractive pre-fire board does not prove that the action works.

Give the video model useful visible evidence: a plausible grip and support, separation between interacting limbs/props, a readable travel path, enough room for the planned movement and stable background landmarks. Do not put both pre-action and post-action poses, motion trails, duplicate objects or diagram arrows into a normal frame. Keep indispensable identities and contacts inside the delivery crop. Generate a genuinely new viewpoint when the plan calls for one, not a tighter crop mislabeled as a reverse angle. Inspect the actual selected still before deriving video: an already released object, opened door or altered cast changes what can happen next.

Use the actual available GPT image tool with authorized local references. Do not silently replace it with Qwen, Higgsfield images or another billed API route. Review the output against the requested camera and state; changing the camera notes to describe a failed image is not a correction.

## Camera detail carried forward

For geometry-sensitive action prepare a simple blockout and check its projected relations before paid images. Build each image from its directed cut and opening state, with scoped layout/cast references; inspect the actual result against the guide. Prepare useful critical/outgoing key states as needed, keeping storyboard guides distinct from model controls. Use the creator's GPT image route; requested label is GPT 2.5, but record the actual tool/model rather than guessing an alias. Register and place selected images as unapproved previews covering the continuous scene audio.

Resolve emotional framing and geometry; check demanding source/path/target views with a blockout before image generation. Separate camera attachment, aim and optical focus.

## References and cut boundaries

Use the minimum sufficient compatible inputs. A second whole-scene image with changed geometry can make a model morph the world; more references are not automatically more continuity. Compare perspective, horizon, scale, landmarks, lighting and action chronology. Use another input as a design/detail reference only when that is its actual purpose. Do not force incompatible angles into start/end constraints. A real cut gets a separate generated video and retains continuous scene audio.

Scope reference roles explicitly. A face/prop reference for a new location must not import its old room or other cast. A rendering-style reference must not import its composition. A frame with the object absent must not override a later restored-object state. Prefer one selected opening image for each continuous video when it already contains the required designs and geography. A camera change across editorial cuts does not require interpolation between two incompatible stills.
