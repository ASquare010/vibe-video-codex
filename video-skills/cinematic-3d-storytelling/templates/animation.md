# Animation prompt-writer template for the LLM

You are the LLM writing the animation prompt for one supplied cut. Your inputs are its director record, exact narration/phrase window, selected reference image and actual opening state, continuity, intended action and selected duration. Write how the subject moves and how the camera moves, including the relevant force, contact, momentum and outgoing state. This complete file is your instruction template; it is not the request sent directly to MiniMax or another video model.

Use the camera-motion and physical-action guidance included below. Return the existing cut ID and one resolved videoPrompt for that cut, with the actual image reference roles. Resolve relevant output fields into concrete instructions and omit irrelevant fields. Do not generate video as part of prompt writing. Workflow execution and final director verification remain in SKILL.md. The provider-facing layout below is an output structure for the prompt you write; do not send this whole instruction file or unresolved placeholders to the video model. For a batch, apply the same process to each supplied cut.

Write the animation prompt from the director's cut and its actual selected still. Apply the camera-motion and physics sections included in this template. Carry forward image-stage viewpoint and composition. Do not reinterpret the story or turn one take into several editorial cuts.

Describe the subjects visible in the selected input and any established offscreen participant explicitly directed to enter through a known route or occlusion. Preserve identity, starting location and reason for that entrance. Do not add an unplanned person. For an intentionally unoccupied object/set insert, keep the living-subject count at zero and describe rigid supports rather than human anatomy. Distinguish the virtual viewpoint from camera apparatus inside the set so viewpoint travel does not invent an operator.

Order the action phases before rendering. Keep movement and transfers in causal order; do not reset an event to an earlier state across a cut. Track identity, costume, location, direction, support, ownership, prop condition and set landmarks. A genuine time/travel ellipsis or explanatory callback may change state, but it must be deliberate and legible. Resolve the next prompt from the actual selected image, including whether a hand has already released an object; never invent a second grasp to reproduce a written plan.

For an entrance or exit, resolve the subject's current facing direction before describing travel. If the destination is behind them, include the turn, then the steps and the doorway occlusion that proves arrival or departure. A screen direction alone can leave the model walking past the destination or toward the viewer. Keep the viewpoint restrained when the turn, carried load and another person's doorway contact already make the event complex.

## Animation-provider prompt output structure

```text
LOOK AND INPUT: Detailed low-poly Blender-style cinematic 3D at {FPS}: preserve simplified modeled forms, faceted silhouettes, stylized cast, material response and lighting, without drifting to photographic realism or toy-like plastic. {PROJECT_DESIGN_LOCKS_OR_EXPLICIT_CREATOR_STYLE_OVERRIDE}. <Picture 1> fixes this shot's actual opening composition, subject designs, material and geometry. {ROLES_OF_ANY_ADDITIONAL_COMPATIBLE_INPUTS}.
START: {THE_ACCEPTED_IMAGE'S_REAL_ACTION_PHASE; INCOMING_VELOCITY; SUPPORT_OR_CONTACT; OWNED_PROPS_AND_GAZE}.
PHYSICAL JOB: {THIS_CUTS_BEAT_AND_VISIBLE_CHANGE; ACTION_SOURCE_AND_TARGET; PATH; RESISTANCE_OR_OBSTACLE; CONTACT_OR_MISS_AND_OBSERVABLE_RESPONSE}. {ACTUAL_SUPPORT_WEIGHT_TRANSFER_RECOIL_DISPLACEMENT_OR_MECHANICAL_OUTPUT_RELEVANT_TO_THIS_EVENT}.
ACTION GEOMETRY: {VISIBLE_SOURCE_POINT_AND_ACTUAL_AIM; INHERITED_TRAVEL_DIRECTION; INTENDED_CONTACT_POINT_AND_RESULT}. {CRITICAL_RELATION_VERIFIED_IN_THE_SELECTED_STILL}. Do not create a moving object beside its origin without travelling toward the established destination.
MECHANICAL COMPLETION (only when critical): {MOVING_COMPONENT} moves relative to {FIXED_BODY_OR_SUPPORT} about/along {JOINT_AXIS_OR_PATH}, from {VISIBLE_START_RELATION} through {TRAVEL_DIRECTION_AND_EXTENT} to {VISIBLE_FINAL_RELATION}. {BODY_TRANSLATION_OR_ROTATION_SEPARATELY}. Complete the travel by {CUT_LOCAL_TIME}, then show {SETTLING_AND_READABLE_RESULT}. {PHYSICAL_ENDPOINT_EVIDENCE_AND_ONLY_THEN_NEXT_OPERATION}. Camera motion must not substitute for this component's travel.
CAMERA: One continuous {PHYSICAL_CAMERA_PATH_OR_OBJECT_ATTACHMENT_WITH_EXPLICIT_OFFSET}, beginning {START_VIEW}, aiming at {LOOK_AT_TARGET_OR_HANDOFF}, keeping {OPTICAL_FOCUS_TARGET} sharp, with {ROLL_AND_HORIZON_POLICY}, and ending {END_VIEW_TO_REVEAL_THE_RESULT_OR_JOIN}. {FOREGROUND_OCCLUSION_AND_DEPTH_DEPENDENT_PARALLAX; SCREEN_ATTENTION_FOR_THE_JOIN}. Distinguish camera travel from subject travel; keep the set fixed.
EVENT: Begin {PURPOSEFUL_MOVEMENT} on the first useful frames. {CAUSE_OR_LOADED_STATE} leads to {DECISIVE_ACTION_OR_MECHANISM}, then {READABLE_CONTACT_OR_CHANGE}, then {CONSEQUENCE_AND_RECOVERY_OR_CONTINUATION}. {FINITE_ACTION_COUNT_IF_REPETITION_IS_A_RISK}. Complete the useful beat within {MEASURED_SELECTED_CUT_DURATION_AND_LANDMARKS}, at natural event speed. Do not stretch it over the model's longer native duration or add an idle lead-in. Extra native frames continue the same outgoing state without restarting the action.
SYNC: {CUT_LOCAL_PHASE_WINDOWS_AND_REAL_SUPPLIED_AUDIO_ANCHORS_OR_NARRATION_ONLY_SEMANTIC_WINDOW}. Preparation precedes any fixed contact anchor. {PLANNED_EFFECTS_ADDED_AFTER_OBSERVED_CONTACT_OR_ACTUAL_SUPPORTED_AUDIO_REFERENCE_ROLE}. Timing language directs the shot; it is not a guarantee of frame-exact model control.
END STATE: End with {CONCRETE_OUTGOING_STATE_OF_THIS_SHOT_ONLY}. Preserve {SPECIFIC_SUBJECTS_PROPS_SCALE_AND_SET_RELATIONSHIPS}. {FOR_A_PAYOFF: ESTABLISHED_OBJECT_OR_CONTEXT; OBSERVABLE_ATTEMPT_CHANGE_AND_RESPONSE; WHAT_THE_VIEWER_CAN_READ_WITHOUT_AN_EXPLANATORY_LABEL}. New objects must enter from an established direction or occlusion.
SOUND: {EXACT_EFFECTS_AND_AMBIENCE_OR_SILENT}. Narration is the separately approved Higgsfield file, mixed locally: no generated narration, dialogue or music in this shot unless a specifically authorized native performance requires it.
CONSTRAINTS: One uninterrupted shot, no extra camera cuts, dissolve, background morph, new event or frozen lead-in. {ONLY_OBSERVED_OR_RELEVANT_LOCAL_RISKS}.
```

Keep the following cut's event and props in the editorial plan, outside the generation prompt. Resolve continuity by specifying this shot's outgoing pose, ownership and set state. Telling the model that a later shot contains writing, an arrest or a new location can invite that event into the current continuous shot. This is a prompting risk, not proof of the cause of any particular failure. A static object insert should state its rigid state throughout; do not attach an upcoming human action to its ending.

## Compatible references

Use the minimum sufficient compatible inputs. A second whole-scene image with changed geometry can make a model morph the world; more references are not automatically more continuity. Compare perspective, horizon, scale, landmarks, lighting and action chronology. Use another input as a design/detail reference only when that is its actual purpose. Do not force incompatible angles into start/end constraints. A real cut gets a separate generated video and retains continuous scene audio.

Scope reference roles explicitly. A face/prop reference for a new location must not import its old room or other cast. A rendering-style reference must not import its composition. A frame with the object absent must not override a later restored-object state. Prefer one selected opening image for each continuous video when it already contains the required designs and geography. A camera change across editorial cuts does not require interpolation between two incompatible stills.

## Native duration and edit interval

Read the installed MiniMax instructions and live config. Use native frame count and actual duration, not a guessed padding rule. Keep the scene narration at its accepted pace. Cover it with motivated shots; do not stretch an attack or loop a performance to fill speech. If tool duration limits conflict with a planned shot, adjust shot coverage deliberately before generation instead of cutting words or secretly creating a montage inside the take.

Keep native generation duration, useful action duration and retained edit duration separate. An essential brief insert may come from a longer native take; its duration follows the directed motion and readability, not a fixed one-second target. Direct a useful early action phase and its visible result in the intended interval; extra native frames continue the outgoing state. Do not spread a quick grasp, strike or release across the native handle merely because it is longer. A longer suspenseful opening or reveal can be intentional; record what changes during that time rather than calling every slow movement defective.

Use the director's previous/current/next packet and actual selected image. Preserve incoming motion, ownership, direction and action count across a cut. A reach begun in one view can continue into contact in another without starting again. Neighboring events stay editorial context: the provider prompt describes only this cut and its outgoing state. A source that ends in the wrong action is not repaired by retiming.

Distinguish intended natural-time action from a deliberate speed-emphasis insert. Trim idle lead/tail first. The director may retime a complete useful movement to correct floaty cadence or create an explicit stylized beat, then check contact, support, readable result and camera pace at the selected speed. Record source in/out and playback rate; preserve the native take and narration. Source seconds divided by desired edit seconds gives the playback factor, subject to actual editor limits and visual review. Do not apply a universal speed multiplier, loop motion or slow all action to cover speech. Effects are aligned to the final observed contact after retiming.

## Camera motion and framing

Use with the instructions in this file. The selected still supplies the starting viewpoint. This guide owns pans, arcs/orbits, tracking/following, camera attachment, focus handoffs, parallax and continuous movement. Static angle and appearance decisions belong to [image composition](image.md#camera-angles-perspective-and-appearance).

### Define a camera rig rather than a movement adjective

Record separately:
- `positionAttachment`: fixed world, vehicle/body, moving object or path; with an offset in the named coordinate frame.
- `lookAt`: exact object, feature or point the camera points toward, including any intended handoff.
- `focusOn`: the depth/feature that should be sharp. This is distinct from aiming the camera.
- `framingTarget`: desired subject scale and screen position, plus allowed foreground occlusion.
- `pathAndEnd`: physical camera travel and resulting view; distinguish it from subject travel.
- `rollAndHorizon`: stable, body-relative or deliberately disturbed. Following a rotating projectile does not automatically mean copying its spin.

In a prompt these are clear intentions, not invented MiniMax parameters. In a real 3D rig, attachment controls camera translation while target tracking controls its aim. The rig is only actually constrained when implemented. A phrase such as 'camera attached to object' alone leaves offset, angle, focus and roll ambiguous.

For a fast-object insert establish its origin and path first. Keep the same source point and target when cutting into the close following view. A side-follow camera can keep the object nearly stationary in frame while the environment sweeps past; it must still advance through world space and leave the source behind. Avoid a free-floating object that hovers beside its origin. Show the payload/projectile appropriate to the event, not an entire cartridge or unrelated prop. A speed-emphasized insert may expand time intentionally; label the temporal treatment and keep it brief in the edit rather than stretching the whole encounter into slow motion. Long native generation handles do not determine its editorial duration.

### Motivated travel and attention

- Move alongside, lead or follow a person/object when their progress carries the event. An attached viewpoint moves with its subject while the fixed environment produces coherent parallax.

- Arc, pan or rise when this reveals previously hidden information, scale or a reaction. A camera turning in place and a camera translating through space are different instructions.

Favor visible subject activity plus a purposeful camera move over repeated drifting past held poses. One smooth move does not mean slow action: the camera can follow fast action continuously at natural speed. Let camera inertia, subject acceleration, foreground crossings and depth create energy; do not use zoom, blur, orbit or shake as decoration. Avoid impossible travel through solid objects, a full orbit that must invent an unseen room, or occlusion that hides the action the cut is meant to explain. A restrained or briefly held camera is appropriate when extra movement would obscure the event.

Give each camera move a subject and a reason: follow the entering person, travel beside the carried object, move from the hand contact toward its result, arc enough to reveal an obscured detail, or track the event's path. Specify the camera's starting position, path, point of attention and ending view in the same fixed world. A closer crop alone is not a new viewpoint; a generic slow push or orbit is not a substitute for an event. Quiet reactions still need a thought, eyeline or task that changes. Preserve the selected low-poly or other rendering language rather than making every model input photorealistic.

Smooth camera movement must not turn a quick event into slow motion. State the intended action speed separately from camera speed and name the moving attention target. A following camera may match the subject's travel; an orbit moves relative to it; an attached view shares its motion. In each case the background stays fixed and produces depth-dependent parallax rather than sliding or warping as a flat plate. Preserve planted support, weight transfer, momentum, resistance and recovery even with stylized geometry. For reactions specify the observable behavior, not an abstract instruction to feel an emotion. Keep each prompt focused enough for one short continuous take; a new location, reverse, impact insert or time jump belongs in the edit unless the planned physical camera move actually connects it.

A camera may lead, follow, attach to a moving object, pan to new danger, arc to reveal a blocked relationship or briefly hold so contact reads. Plan start, path, attention and end in the same world. Cutting on a continuing action can carry momentum into a new view without replaying the full action. Match ownership, damage, velocity, direction and relevant supports across the join.

### Motion prompt additions

```text
CAMERA RIG: {WORLD_OR_OBJECT_ATTACHMENT; OFFSET; PHYSICAL_PATH; LOOK_AT_CHANGE_OR_LOCK; ROLL_POLICY; END_VIEW}
EDIT CONNECTION: {CONTINUING_PHASE_OR_ELLIPSIS; DIRECTION; ATTENTION_MATCH; REAL_TIME_OR_EXPLICIT_TIME_EMPHASIS}
```

Keep the full layout and next-cut plan in editorial records. Compile each provider prompt to this shot's actual visible state and change, without importing a future event or absent cast. Camera numbers in prose are not calibrated outputs; only a rendered/projected guide has an actual computed camera.

### Research basis

- [ASC interview with Pixar's Onward cinematographers](https://theasc.com/article/onward-quest-for-magic/) — camera/staging, lens choices, previsualization and physically motivated camera behavior are developed together.

- [ASC: John Seale on Fury Road framing](https://theasc.com/video/john-seale-asc-acs-framing-mad-max-fury-road/) — consistent screen attention supported that film's fast editing. This is a useful option, not an all-shots-center rule.

### Moving-subject coverage

| Information/experience needed | Useful starting coverage | What must remain legible |
| --- | --- | --- |
| A fast moving object carries attention | A following/attached/parallel camera with an explicit target and offset | Origin, travel direction and destination; the background changes coherently. |

Specify camera translation/attachment, look-at, optical focus and roll separately; 'follow the object' alone is incomplete.

A quiet attempt to avoid notice and a fast mechanism need different movement treatments. Do not apply the same orbit, slow push or level of agitation to both.

## Physical action and force

Use with the instructions in this file. These are movement and physical-state instructions, distinct from the image's appearance or the camera's travel.

Describe force through observable mechanics and timing: stable preparation/support, decisive acceleration or discharge, actual contact or miss, a specific material/target response, then recovery or irreversible change. For rigid machines put recoil in the designed mechanism, suspension, loose equipment or terrain; do not squash the whole hull as if it were rubber. Let loose matter and camera response follow the source event. Do not replace force with shake, white flash, slow debris or a larger explosion. The appropriate response depends on the object and event; greater spectacle does not imply greater physical correctness.

Physical direction depends on the event. A strike needs loaded balance, acceleration, visible contact, target displacement and recovery; dust and shake cannot substitute for them. Running needs push-off/flight/landing, counter-motion and equipment lag. A machine needs an actuator, linkage, resistance and output. Quiet acting needs a thought, eyeline or purposeful task; do not append combat recoil to a conversation. Camera movement needs motivation and a changing view, not an orbit on every shot.

For mechanical completion resolve the optional template line into plain physical language, using only relevant measurements. Show the part's final relation to its body/support, not merely a dramatic camera orbit. Check that the selected starting image leaves the intended travel possible. Verify completion in the actual retained frames before accepting a following operation. A prompt saying 'fully' or a successful generation receipt is insufficient. For a decisive fast action, choose a viewpoint and attention target that expose the operation and its effect; split coverage where one view cannot communicate both, preserving action count and avoiding replay.

Set an action-specific pace, separately from camera smoothness. A camera can move smoothly while an attack accelerates sharply. Give contact a readable instant and consequences enough screen time; do not stretch a fast event across a whole narration clause. Use dialogue/narration across cuts, deliberate visual ellipses and changing attention to cover longer speech. Assess every long interval for actual visual development rather than applying a fixed maximum duration.

For a story-critical mechanical movement, specify what moves relative to what: component, joint/axis, starting relation, intended path, final relation and visible evidence of completion. Camera motion and chassis motion are separate from component motion. A direction change seen only in screen space does not prove a rotating part completed its travel. Use a stable body/landmark reference and choose a view that exposes the relation. Record degrees when meaningful, but pair them with a readable physical endpoint; a numeric instruction alone is not verification. Budget acceleration, traversal, settling and a brief readable result inside the selected edit interval. A following operation must start from the achieved final state, not a partial movement quietly relabelled as complete. If full traversal is unreliable, show a motivated continuation or explicit ellipsis into a verified final state; do not imply a continuously demonstrated movement that was never shown.

### Research basis

- [Animation Mentor: Believable weight](https://www.animationmentor.com/blog/how-to-create-believable-weight-in-animation/) and [timing/spacing](https://www.animationmentor.com/blog/tutorial-animate-with-timing-and-spacing-in-mind/) — force is communicated through opposing effort, posture and timing.

- [Animation Mentor: Anticipation](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/) — preparation makes a coming action intelligible. Apply enough preparation for this beat; do not add the same slow wind-up to every movement. Source principles support varying timing, not a model guarantee or a universal shot duration.

These sources support filmmaking and animation principles. They do not establish a measured success rate for GPT or MiniMax. Our blockout/reference/acceptance workflow is an engineering adaptation to observed failures, to be tested on actual outputs. Keep written intention, computed plan, selected still and generated motion as separate evidence stages.
