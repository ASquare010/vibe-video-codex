# Image prompt-writer template for the LLM

You are the LLM writing the image-generation prompt for one supplied cut. Use the director's event, exact narration context, continuity state and references to choose the camera angle, viewer perspective, expression, framing, appearance and one useful action phase. This complete file is your instruction template. Your deliverable is the cut-specific prompt that will later be sent to the selected image model; this file itself is not that model's request.

Use the camera, composition and layout guidance included below. Resolve the relevant output fields into concrete instructions and omit irrelevant fields. Preserve the supplied cut ID and events. Produce the imagePrompt and its cut/reference context; do not generate media as part of prompt writing. Workflow execution and final director verification remain in SKILL.md. The provider-facing layouts below describe the output you write, not a separate template for the image model to interpret with unresolved placeholders.

Read the accepted story/audio and director's cut states as inputs. Apply the composition, viewpoint, appearance and layout sections included in this template. The writer and director do not need to load those camera guides. The image role enriches the existing cuts rather than changing their events.

Read after the story and scene audio are accepted and [the director](../references/director.md) has produced the sequence/world/beat plan. Image prompts are compiled from directed cuts and their physical states, using the whole story and exact audio as context. Do not skip choreography by translating each spoken noun or writer-proposed shot directly into an image. Resolve templates into concise standalone instructions; omit irrelevant clauses rather than stacking every module onto every shot.

Read [image layout](#layout-and-blockout) before resolving the board. For demanding geometry include a checked composition/blocking guide; preserve its projected relationships through image development. A good style match is insufficient when the selected still has a wrong viewpoint, unconvincing scale or a source aimed away from its intended target.

## Image-stage input and output

```text
Write the image-generation prompt for the supplied directed cut. For a batch, apply the same instructions independently to each supplied cut. Do not generate media from this planning request alone.
FULL IDEA AND ENDING: {COMPLETE_ACCEPTED_STORY}
SCENE AUDIO: {EXACT_SCENE_WORDS; MEASURED_DURATION; ORDERED_PHRASE_TIMES}
DIRECTOR PLAN: {SEQUENCE_OBJECTIVE_AND_AUDIENCE_CONCERN; ESSENTIAL_DEVELOPMENTS; BEAT_IDS_DEPENDENCIES_AND_BEFORE_AFTER_STATES; AUDIO_MODE_AND_EVIDENCE; REVIEWED_WORLD}
LAYOUT AND CAMERA BASIS: {SUBJECT_DIMENSIONS_POSITIONS_ORIENTATIONS; SOURCE_PATH_TARGET; CHECKED_GUIDE_OR_UNVERIFIED_STATUS; VIEWPOINT_INTENT; ATTACHMENT_LOOK_AT_FOCUS_AND_FRAMING}
ESTABLISHED WORLD: {ACCEPTED_CAST_PROP_AND_SET_REFERENCES_WITH_SCOPED_ROLES; CURRENT_STATE}
FORMAT: {ASPECT_RATIO; FPS; TARGET_IMAGE_SIZE}
LOOK: Detailed low-poly Blender-style cinematic 3D; simplified modeled forms, faceted readable silhouettes, consistent stylized cast, tangible restrained materials, contact shadows, atmospheric depth and motivated cinematic lighting. {PROJECT_SPECIFIC_PALETTE_AND_DESIGN_LOCKS_OR_EXPLICIT_CREATOR_OVERRIDE}.

If the director plan is missing, return that dependency to the director before compiling prompts. Realize its cuts in views that make the developing action or explanation understandable and felt. Choose camera positions around the same set, carrying state forward. Develop a progression of scale, angle, visibility, attention and rhythm; do not make each narrated sentence one held illustration. Give decisive changes and their effects readable coverage instead of filling the sequence with support logistics. Choose the useful opening phase for every still so the subsequent video can perform its beat immediately. Normally one selected opening still and one continuous video per cut; additional cuts need additional records. Plan further contact/end key states only where useful, with explicit roles and generation status; do not assume that uploading them gives MiniMax timed keyframe control.

For each supplied cut, preserve its existing record and return the resolved imagePrompt with the following context:
1. Shared cast/prop/set design locks and simple geography, including routes, supports, landmarks and light direction.
2. The director's ordered phase/coverage map, carrying forward essential actions, causal connections, deliberate ellipses and what each view newly reveals.
3. Cut records: stable scene/shot IDs and beat/dependency IDs; exact phrase anchor and measured interval; dramatic job and audience attention; visible cast/count and offscreen participants; incoming action/ownership/state; chosen opening instant; camera start position, height, framing and attention target; one continuous path and end view; subject source/target/path/contact-or-miss/consequence and outgoing state; critical mechanism's moving part, fixed reference, traversal, endpoint and visible completion test when applicable; adjacent continuity and whether a join continues action or elides time; actual ordered reference/keyframe roles; likely shot-specific risks.
4. One resolved provider-facing imagePrompt for the supplied cut using the output structure below. Keep editorial plans and movement instructions from becoming multiple times/views inside the still.

If phrase timing is unavailable, mark timings provisional and align them before placement. Do not change accepted narration to fit a convenient number of pictures. Save the plan and reference roles so the video stage can use the same motion intention and actual selected starting state.
```

## Image-provider prompt output structure

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

## Camera detail carried forward

Resolve emotional framing and geometry; check demanding source/path/target views with a blockout before image generation. Separate camera attachment, aim and optical focus.

## References and cut boundaries

Use the minimum sufficient compatible inputs. A second whole-scene image with changed geometry can make a model morph the world; more references are not automatically more continuity. Compare perspective, horizon, scale, landmarks, lighting and action chronology. Use another input as a design/detail reference only when that is its actual purpose. Do not force incompatible angles into start/end constraints. A real cut gets a separate generated video and retains continuous scene audio.

Scope reference roles explicitly. A face/prop reference for a new location must not import its old room or other cast. A rendering-style reference must not import its composition. A frame with the object absent must not override a later restored-object state. Prefer one selected opening image for each continuous video when it already contains the required designs and geography. A camera change across editorial cuts does not require interpolation between two incompatible stills.

## Camera angles, perspective and appearance

The image role reads this with the instructions in this file. Resolve the director's event into a frame: audience perspective, angle, height, lens character, framing, expression, gaze, scale, lighting and appearance. Camera movement belongs to [camera motion](animation.md#camera-motion-and-framing); geometry/blockout details belong to [image layout](#layout-and-blockout).

### Saved visual language

The creator's default is **detailed low-poly Blender-style cinematic 3D**: deliberately simplified modeled forms and readable faceted silhouettes, consistent stylized people and props, tangible restrained material response, believable contact shadows, depth, atmospheric light and coherent set geometry. Keep richness in composition, lighting, staging and meaningful modeled detail; do not drift into photographic humans, glossy toy figures, flat illustration or generic realistic CGI. Slight exaggeration may improve clarity, expression or force while support, contact and object persistence stay readable. Carry this explicit look through both image and video prompts unless the creator overrides it. A Blender-like look does not prove that an actual Blender scene was built.

Low-poly describes modeling language, not miniature scale or a playful persona. For grounded action, retain full-scale machinery, convincing construction and material response, environmental scale cues and a tone suited to the stakes. Choose comedy, toy proportions or anthropomorphic behavior when the brief supports them. Decide whose experience each camera serves: an empowering low view and an oppressive low view can share an angle while having different staging, light and behavior. Do not obtain 'drama' by applying threat framing to every participant.

The low-poly look below is this creator's saved default. An explicit style override replaces the whole default look clause in the resolved prompts; do not append a conflicting aesthetic to it. Planning fields, reference roles and cut timing are production records, not unsupported provider parameters.

### Shared world contract
Define the rendering language, subject design, scale, materials, lighting, set geometry and recurring landmarks once. The creator's default is detailed low-poly Blender-style cinematic 3D: intentional simplified geometry, legible faceted silhouettes, consistent stylized anatomy, restrained physically based materials, contact shadows, atmospheric depth and motivated light. Detail comes from staging, modeled construction, selective surface wear and lighting; it does not mean increasing polygon density until the look becomes photoreal. Maintain readable silhouettes and subject/background separation. Bodies, props, creatures and backgrounds share this rendering language. Avoid photographic heads on stylized bodies, plastic display figurines, flat illustrations or frozen anime tableaux unless explicitly intended. Repeat the resolved theme in every standalone image and video prompt; a style label saved only in planning notes will not reach the model.

Slight exaggeration can improve pose readability, acceleration, force, scale and emotional expression. Preserve support, contact and persistent objects. Detail and realism do not require mechanically exact documentary simulation. A requested Blender-like look is an aesthetic; do not claim an actual Blender scene or rendered camera rig exists unless one was built.

Default to full-scale subjects within this stylized language. State the physical scale and construction cues, camera distance/height relative to the subject, and the intended tonal register. A tiny or mascot-like protagonist, toy proportions, a miniature camera treatment and playful direction can overpower a negative clause saying 'no toys'. Preserve deliberate miniature sequences only when the story actually calls for that scale.

For connected coverage retain world-space relationships, ownership and causal state. Screen coordinates may change with camera travel. Establish the relevant geography before a reverse angle makes it ambiguous. A new view is a new view of the same set, not a new set arranged to resemble the old picture.

Match the treatment to the requested experience before picking a persona. The saved low-poly look describes modeling, not miniature scale, mascot comedy or anthropomorphic machinery. For grounded high-action briefs choose physical stakes, believable scale and a fitting register unless the user asks for a playful treatment. A light ending can suit a story, but do not add one automatically because the subjects are stylized. In a visual-only comparison with accepted narration, preserve the supplied words and performance; the visual director should record tonal limitations rather than silently rewriting the source.

### Choose what the shot means before choosing its angle

For each cut state the audience's relationship to the subject: threatened by it, aligned with its effort, observing a mechanism, sharing vulnerability, or discovering a consequence. Then choose height, distance, angle, lens character, staging and light together. Low angles can give a hero resolve or make an opponent oppressive. They do not inherently mean villain, and high angles do not inherently mean weak. Judge the resulting face, silhouette, gaze, behavior, light and relation to the preceding shot.

| Information/experience needed | Useful starting coverage | What must remain legible |
| --- | --- | --- |
| Who threatens whom, and along which route? | Brief wide/master or re-establishing view with readable depth | Actors, route, obstacle and direction; scenery must not eclipse the relation. |
| Mass approaching the viewer's space | Low, close camera beside the travel path, with appropriate perspective and foreground occlusion | Human/world scale, ground contact, looming body and a clear path. |
| A participant makes a pressured decision | Eye-level or modest low three-quarter view aligned with their attention | Gaze, restraint/effort and what motivates it; avoid accidentally imposing a threatening portrait. |
| A mechanism causes the next event | Close or extreme-close action insert at the physical interface | Actual contact point, support, direction and one recognizable connection to the established object. |
| Something has broken or a plan has failed | Diagnostic detail, then a result/reaction view as needed | The precise defect and its consequence; generic smoke cannot replace visible damage. |

These are choices, not a mandatory wide/close/wide cycle. Combine views when a continuous shot communicates the relationship clearly. Cut on an ongoing action when that carries energy, preserving its phase rather than replaying it. A tight insert can simplify visible geometry after its context is established; it cannot justify an impossible direction, unexplained target or hidden state change. Re-establish when geography changes or becomes uncertain, not after every insert.

Guide attention across the edit. Record the outgoing and incoming point of interest in normalized screen space when the cut is fast. Keeping it in a similar region can reduce visual searching; a deliberate shift can reveal new information. Portrait framing needs particular care: preserve the relevant source/target relation in depth or change coverage instead of squeezing a landscape tableau between large empty areas. Select one dominant subject/detail per image, with enough contextual cues for the event to make sense. Check the frame at phone size before scaling production.

Choose lighting and materials for the event. A scenic golden landscape can be appropriate, but it should not overwhelm the threatened route, contact point or damage. Restrained metal response, construction thickness, contact shadows, accumulated dirt/wear, terrain interaction and sound can support industrial mass. 'No toy look' does not counteract a tiny protagonist, oversized cartoon parts, playful narration and miniature staging elsewhere in the brief.

### Choosing and connecting views

Choose a point of view and changes in audience knowledge, scale, proximity, rhythm and attention.

The image planner turns the director's reviewed beat plan into a filmable board, not a set of scene-summary illustrations. Read the sequence objective, audience concern, causal dependencies, exact accepted scene audio and established world. Find the strongest visible way to communicate the current development. A spectacular view earns its place through scale, discovery, risk, behavior or a decisive physical change. A quiet attempt to avoid notice can need closer observation and partial concealment; a fast mechanism can need an unobstructed contact detail and a camera tied to its output.

Map the event's necessary phases before choosing images: access or arrival, approach or preparation, contact, operation or transfer, result and continuation as applicable. Give a separate cut to a phase when its detail or new viewpoint is needed to understand the event; combine phases when one continuous view can show them clearly. Skip redundant phases and use deliberate ellipses for unimportant travel. The current film's cut count and particular sequence are not a universal shot recipe.

Treat connected views as cameras placed around one persistent set. Record a simple spatial layout: entrances, important objects, paths, supports, light source and recognizable landmarks. Keep a stable character/prop design record and evolving state record. For each cut resolve who is present, who is offscreen, where the object is, who supports it and what has already happened. Distinguish a harmless screen-position change from a contradictory world-position change. Preserve movement direction and eyelines; if crossing the action axis or changing direction, establish the change visibly instead of teleporting subjects or mirroring the room.

Choose the camera by what the audience needs next:
- Establish geography and the route before a close view would make the action confusing.

- Use a contact insert when a hand, tool, support or mechanism explains the change; keep its decisive contact readable.

- Use a reverse or reaction angle when the action changes what another participant sees, knows or does. Preserve geography and agency.

Build scenes as events covered by several purposeful virtual camera positions. Show preparation, action and consequence where understanding depends on them; choose wide geography, contact detail, tracking, reaction or reverse views for the information they reveal. Each selected still is the usable opening of one later continuous video, not a whole scene summarized in one pose. Keep the same environment and cast across those views. Derive the number of cuts from the event and measured audio, never from the current film's 42-cut count. Use the linked visual planner to resolve coverage before spending on images.

Use existing accepted design references first. When more are authorized and needed, establish a world/cast/prop reference or layout before dependent frames. A reference sheet or map is planning material, not automatically a final video input. Describe camera position, height, lens character, framing and attention target separately. These can be virtual camera intentions; do not claim a Blender scene, depth map or calibrated 3D rig exists unless actually built.

Before resolving image prompts read [image layout](#layout-and-blockout). Set the emotional relationship, physical scale and action geometry, then test difficult views using a cheap blockout. Include the actual source point, target/path and mechanism orientation; compass labels alone do not establish that a selected image aims correctly. Record whether geometry is only described, computed in a guide or checked in the selected still.

Vary the view's function and physical proximity, not only its nominal shot size. A sequence of elevated three-quarter vehicle portraits remains repetitive even when labelled wide, medium and close. Make critical defects, contact interfaces or trajectory changes visible at viewing size. A close following insert can isolate fast action after its origin and destination are established, but it must inherit that same direction and state.

Choose an establishing view, preparation detail, moving-subject view, contact view, reaction or result for its role in the event.

Allocate attention to the event that changes the outcome. When a decisive action is too small in a geography view, plan closer coverage of its operating interface, discharge/contact or result, retaining source-to-target continuity. Cover the useful phases without replaying the event: one operation can continue across cuts, but a new flash, recoil or launch in each angle may falsely imply repeated operations. Make impact legible through affected material, displacement, support failure or another persistent change; camera shake and a flash alone are insufficient. Use proximity and duration selectively rather than applying a fixed close-up quota.

### Image prompt additions

Add only the relevant information to the image template:

```text
VIEWPOINT INTENT: {WHOSE_EXPERIENCE; EMOTIONAL_RELATION; WHAT_THIS_VIEW_REVEALS}
LAYOUT EVIDENCE: {APPROVED_BLOCKOUT_OR_UNVERIFIED_PLAN; WORLD_POSITIONS_DIMENSIONS_AND_ACTION_AXIS; REFERENCE_ROLE}
CAMERA GEOMETRY: {START_POSITION_AND_HEIGHT_RELATIVE_TO_SUBJECT; DISTANCE_AND_LENS_CHARACTER; LOOK_AT; OPTICAL_FOCUS; SCREEN_ATTENTION}
```

Keep the full layout and next-cut plan in editorial records. Compile each provider prompt to this shot's actual visible state and change, without importing a future event or absent cast. Camera numbers in prose are not calibrated outputs; only a rendered/projected guide has an actual computed camera.

### Full-scale construction and camera distance

The default remains low-poly Blender-style cinematic 3D, with full-scale subjects and believable construction. Simplification concerns modeling language, not tiny physical scale, toy proportions or comedy. Establish the subject's dimensions and compare it with grounded environmental details. Keep barrel/wheel/track/door proportions plausible within the design. Camera height must be meaningful relative to those dimensions. Avoid a distant, elevated catalogue view and decorative foreground/background blur when the intended feeling is proximity to a heavy machine; use these only when the story calls for them.

Resolve viewpoint intent, full-scale staging, source-to-target geometry and the camera's attachment/look-at/focus separately.

The image stage resolves the saved visual theme or explicit override into its prompt:

```text
LOOK: {RESOLVED_DETAILED_LOW_POLY_BLENDER_STYLE_OR_EXPLICIT_OVERRIDE}
```

### Research basis and limits

- [ASC: Where Do You Put the Camera?](https://theasc.com/article/shot-craft-where-do-you-put-the-camera/) — camera placement is part of the story's emotional language.
- [ACMI: Exploring camera angles](https://www.acmi.net.au/education/school-program-and-resources/exploring-camera-angles/) — angle effects depend on context and intent, including heroic versus threatening low views.
- [ASC interview with Pixar's Onward cinematographers](https://theasc.com/article/onward-quest-for-magic/) — camera/staging, lens choices, previsualization and physically motivated camera behavior are developed together.
- [ASC: John Seale on Fury Road framing](https://theasc.com/video/john-seale-asc-acs-framing-mad-max-fury-road/) — consistent screen attention supported that film's fast editing. This is a useful option, not an all-shots-center rule.
- [Columbia: 180-degree rule](https://filmglossary.ccnmtl.columbia.edu/term/180-degree-rule/) — a stable action axis helps preserve the spectator's spatial understanding.

These sources support filmmaking and animation principles. They do not establish a measured success rate for GPT or MiniMax. Our blockout/reference/acceptance workflow is an engineering adaptation to observed failures, to be tested on actual outputs. Keep written intention, computed plan, selected still and generated motion as separate evidence stages.

## Layout and blockout

Use after the action director has designed the event, before commissioning its images. For geometry-sensitive action, establish a simple reusable layout and camera views before surface detail. A text description of a fixed world does not establish that independently generated images obey that world. The procedure below is a practical adaptation of the sources at the end, not a proven guarantee of model compliance.

### Treat spatial layout as a separate artifact

Record persistent world coordinates or a clear scaled plan, including subject dimensions, facing direction, turret/tool orientation, source point, target/contact point, obstacles and camera positions. Use one coordinate convention and units. Check the following before generating expensive images:

1. A movement or projectile starts at the established source and travels toward the intended destination. Body heading, mechanism aim and camera-facing direction are separate vectors.
2. A point intended to be in front of the mechanism lies forward along its actual aim. The selected still visibly supports that aim; a written plan cannot correct a misdirected barrel in the picture.
3. The camera sees the required interface and target relationship, or deliberately excludes them after geography has been established. Check for clipping, intersections and a camera physically inside solid geometry.
4. Camera-side changes preserve screen direction, or the crossing is made legible by a moving camera, neutral view or re-establishment. Do not mirror the set to match a preferred composition.
5. Support and damage persist. Decide what the ground/structure does under contact before decorating the image with debris.

For a difficult shot use a cheap geometric blockout as a composition reference. An existing 3D scene is preferable when available; simple projected boxes, paths and camera guides can expose contradictions without a full asset build. [blocking_previs.py](../scripts/blocking_previs.py) projects such a plan into camera views and checks linear source/target aim rays and required point visibility. It is a coarse guide, not collision simulation, ballistics, a Blender renderer or an automatic judge of generated footage. Do not install Blender or another stack merely to satisfy this reference. If no geometric guide exists, mark layout as unverified and use restrained coverage with explicit relationships.

The helper reads objects with `id`, `center`, `size` and optional `yawDegrees`/`color`; paths with `id`, `points` and optional `aimOrigin` or `aimDirection`; and cameras with position/look-at/FOV and optional required visible points. Prefer deriving an aim ray from a mechanism origin to its actual source/muzzle over supplying a disconnected direction vector. Attached cameras use a path progress plus `offsetWorld` and a separate look-at path/progress. Coordinates are Z-up. It always emits SVG guides and also PNG if the existing Pillow package is available. Use a new empty output directory to retain earlier versions:

```text
python video-skills/cinematic-3d-storytelling/scripts/blocking_previs.py --scene ABSOLUTE_LAYOUT_JSON --out-dir ABSOLUTE_NEW_GUIDE_FOLDER
```

Reuse the set and object identities while updating transforms and damage for each beat's actual state. Sharing a world does not freeze actors at their opening positions. Treat coarse guide visibility as a framing check only; the helper does not prove a point is unobstructed by a full model or that a proposed action obeys dynamics.

### Layout evidence in the image prompt

```text
LAYOUT EVIDENCE: {APPROVED_BLOCKOUT_OR_UNVERIFIED_PLAN; WORLD_POSITIONS_DIMENSIONS_AND_ACTION_AXIS; REFERENCE_ROLE}
CAMERA GEOMETRY: {START_POSITION_AND_HEIGHT_RELATIVE_TO_SUBJECT; DISTANCE_AND_LENS_CHARACTER; LOOK_AT; OPTICAL_FOCUS; SCREEN_ATTENTION}
ACTION GEOMETRY: {SOURCE_POINT; AIM_OR_PATH; TARGET; SUPPORT_AND_MATERIAL_RESPONSE; INCOMING_AND_OUTGOING_STATE}
```

Use [image composition](#camera-angles-perspective-and-appearance) for viewpoint and appearance. Record the physical room, actors, objects and required action from the director; the image role resolves and checks the projected view.
