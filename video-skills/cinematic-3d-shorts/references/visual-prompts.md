# Detailed 3D image and video direction

Read only after the story and scene audio are accepted. Prompts must be derived from the whole story and the exact current scene audio, not from the scene title alone. Resolve templates into concise standalone instructions; omit irrelevant clauses rather than stacking every module onto every shot.

## Shared world contract
Define the rendering language, subject design, scale, materials, lighting, set geometry and recurring landmarks once. Use detailed modern 3D graphics with coherent modeled geometry, physically based material response, meaningful surface wear and volumetric light. Maintain readable silhouettes and subject/background separation. Bodies, props, creatures and backgrounds share this rendering language. Avoid a photoreal head on a flat graphic body, plastic display figurines or frozen anime tableaux unless explicitly intended.

Slight exaggeration can improve pose readability, acceleration, force, scale and emotional expression. Preserve support, contact and persistent objects. Detail and realism do not require mechanically exact documentary simulation. A requested Blender-like look is an aesthetic; do not claim an actual Blender scene or rendered camera rig exists unless one was built.

For connected coverage retain world-space relationships, ownership and causal state. Screen coordinates may change with camera travel. Establish the relevant geography before a reverse angle makes it ambiguous. A new view is a new view of the same set, not a new set arranged to resemble the old picture.

## GPT image template
```text
OUTPUT: One edge-to-edge {ASPECT_RATIO_AND_SIZE} detailed cinematic 3D movie frame, not a collage or storyboard sheet. {SPECIFIC_RENDERING_MATERIAL_AND_LIGHTING_LANGUAGE}.
STORY JOB: At the spoken phrase {EXACT_AUDIO_ANCHOR}, the viewer needs to see {NEW_INFORMATION_OR_CAUSAL_STATE}.
REFERENCES: {ACTUAL_ORDERED_INPUT_PURPOSES: CURRENT_SETUP / SUBJECT_DESIGN / MATERIAL_DETAIL}. {EXACT_EDIT_IF_EDITING}.
SPACE: {VISIBLE_SUBJECT_COUNT_AND_SCALE; FOREGROUND_MIDGROUND_BACKGROUND; PERSISTENT_LANDMARK_RELATIONSHIPS; LIGHT_DIRECTION}.
INSTANT: {ONE_LEGIBLE_ACTION_PHASE; BODY_SUPPORT; GAZE; HAND_OR_MECHANISM_CONTACT; PROP_OWNER_AND_CONDITION}. {VISIBLE_FORCE_OR_EFFECT_OR_NONE}.
CAMERA: {ACTUAL_STARTING_VIEW_AND_CROP; HEIGHT; SUBJECT_RELATIVE_POSITION; RELEVANT_LENS_CHARACTER; IMPORTANT_OCCLUSION}. Frame for {PLANNED_CONTINUOUS_MOTION} without rendering multiple times or views into one image.
CONTINUITY: Carry forward {SPECIFIC_PREVIOUS_STATE}. Keep {ACTUAL_INVARIANTS}; show {ONLY_AUTHORIZED_CHANGE}. {FEW_SHOT_SPECIFIC_FAILURES_TO_AVOID}.
```

A still is one instant, not an instruction to perform several seconds of choreography. Select the useful starting phase instead of repeatedly commissioning generic hero poses. For mechanisms show the state/connection that explains operation. For acting show a meaningful task, thought or reaction. For environments give scale, layers and a reason for the camera to move.

Use the actual available GPT image tool with authorized local references. Do not silently replace it with Qwen, Higgsfield images or another billed API route. Review the output against the requested camera and state; changing the camera notes to describe a failed image is not a correction.

## MiniMax video template
```text
LOOK AND INPUT: {DETAILED_3D_RENDERING_LANGUAGE_AND_FPS}. <Picture 1> fixes this shot's actual opening composition, subject designs, material and geometry. {ROLES_OF_ANY_ADDITIONAL_COMPATIBLE_INPUTS}.
START: {THE_ACCEPTED_IMAGE'S_REAL_ACTION_PHASE; INCOMING_VELOCITY; SUPPORT_OR_CONTACT; OWNED_PROPS_AND_GAZE}.
CAMERA: One continuous {PHYSICAL_CAMERA_PATH}, beginning {START_VIEW}, following {MOTIVATION}, ending {END_VIEW}. {FOREGROUND_OCCLUSION_AND_DEPTH_DEPENDENT_PARALLAX}. Distinguish camera travel from subject travel.
EVENT: {CAUSE_OR_LOADED_STATE} leads to {DECISIVE_ACTION_OR_MECHANISM}, then {READABLE_CONTACT_OR_CHANGE}, then {CONSEQUENCE_AND_RECOVERY_OR_CONTINUATION}. {FINITE_ACTION_COUNT_IF_REPETITION_IS_A_RISK}. Time important landmarks to {MEASURED_SHOT_DURATION_OR_AUDIO_CUES} without stretching the action into uniform slow motion.
END AND JOIN: End with {CONCRETE_OUTGOING_STATE}; next shot begins from {COMPATIBLE_STATE_OR_JUSTIFIED_ELLIPSIS}. Preserve {SPECIFIC_SUBJECTS_PROPS_SCALE_AND_SET_RELATIONSHIPS}. New objects must enter from an established direction or occlusion.
SOUND: {EXACT_EFFECTS_AND_AMBIENCE_OR_SILENT}. Narration is the separately approved Higgsfield file, mixed locally: no generated narration, dialogue or music in this shot unless a specifically authorized native performance requires it.
CONSTRAINTS: One uninterrupted shot, no extra camera cuts, dissolve, background morph, new event or frozen lead-in. {ONLY_OBSERVED_OR_RELEVANT_LOCAL_RISKS}.
```

Physical direction depends on the event. A strike needs loaded balance, acceleration, visible contact, target displacement and recovery; dust and shake cannot substitute for them. Running needs push-off/flight/landing, counter-motion and equipment lag. A machine needs an actuator, linkage, resistance and output. Quiet acting needs a thought, eyeline or purposeful task; do not append combat recoil to a conversation. Camera movement needs motivation and a changing view, not an orbit on every shot.

## References and cut boundaries
Use the minimum sufficient compatible inputs. A second whole-scene image with changed geometry can make a model morph the world; more references are not automatically more continuity. Compare perspective, horizon, scale, landmarks, lighting and action chronology. Use another input as a design/detail reference only when that is its actual purpose. Do not force incompatible angles into start/end constraints. A real cut gets a separate generated video and retains continuous scene audio.

## Timing, review and costs
Read the installed MiniMax instructions and live config. Use native frame count and actual duration, not a guessed padding rule. Keep the scene narration at its accepted pace. Cover it with motivated shots; do not stretch an attack or loop a performance to fill speech. If tool duration limits conflict with a planned shot, adjust shot coverage deliberately before generation instead of cutting words or secretly creating a montage inside the take.

After a scene's images are selected and registered, place them immediately as held unapproved previews with phrase-based cut points. Preserve originals and alternatives. Once video is completed, check opening/middle/end geometry, action/contact/consequence, persistent state and adjacent joins. Inspect at native rate when available before claiming natural timing or force. Frame sheets and probes support narrower technical/visual findings only. Keep unavailable listening/playback approval pending. Save actual paid calls once, credits separately from unknown GCP infrastructure cost, and allow the installed shared idle coordinator to unload model weights after all submitted jobs finish.
