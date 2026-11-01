# Camera, layout and physical scale

Use after the action director has designed the event, before commissioning its images. For geometry-sensitive action, establish a simple reusable layout and camera views before surface detail. A text description of a fixed world does not establish that independently generated images obey that world. The procedure below is a practical adaptation of the sources at the end, not a proven guarantee of model compliance.

## Choose what the shot means before choosing its angle

For each cut state the audience's relationship to the subject: threatened by it, aligned with its effort, observing a mechanism, sharing vulnerability, or discovering a consequence. Then choose height, distance, angle, lens character, staging and light together. Low angles can give a hero resolve or make an opponent oppressive. They do not inherently mean villain, and high angles do not inherently mean weak. Judge the resulting face, silhouette, gaze, behavior, light and relation to the preceding shot.

| Information/experience needed | Useful starting coverage | What must remain legible |
| --- | --- | --- |
| Who threatens whom, and along which route? | Brief wide/master or re-establishing view with readable depth | Actors, route, obstacle and direction; scenery must not eclipse the relation. |
| Mass approaching the viewer's space | Low, close camera beside the travel path, with appropriate perspective and foreground occlusion | Human/world scale, ground contact, looming body and a clear path. |
| A participant makes a pressured decision | Eye-level or modest low three-quarter view aligned with their attention | Gaze, restraint/effort and what motivates it; avoid accidentally imposing a threatening portrait. |
| A mechanism causes the next event | Close or extreme-close action insert at the physical interface | Actual contact point, support, direction and one recognizable connection to the established object. |
| A fast moving object carries attention | A following/attached/parallel camera with an explicit target and offset | Origin, travel direction and destination; the background changes coherently. |
| Something has broken or a plan has failed | Diagnostic detail, then a result/reaction view as needed | The precise defect and its consequence; generic smoke cannot replace visible damage. |

These are choices, not a mandatory wide/close/wide cycle. Combine views when a continuous shot communicates the relationship clearly. Cut on an ongoing action when that carries energy, preserving its phase rather than replaying it. A tight insert can simplify visible geometry after its context is established; it cannot justify an impossible direction, unexplained target or hidden state change. Re-establish when geography changes or becomes uncertain, not after every insert.

Guide attention across the edit. Record the outgoing and incoming point of interest in normalized screen space when the cut is fast. Keeping it in a similar region can reduce visual searching; a deliberate shift can reveal new information. Portrait framing needs particular care: preserve the relevant source/target relation in depth or change coverage instead of squeezing a landscape tableau between large empty areas. Select one dominant subject/detail per image, with enough contextual cues for the event to make sense. Check the frame at phone size before scaling production.

## Treat spatial layout as a separate artifact

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

Feed the approved blockout through the image tool's actual reference mechanism, alongside scoped identity/style references where supported. Ask the image model to preserve projected layout, view and direction while developing the approved look. Inspect the resulting still against the guide: geometry can drift during stylization. Fix the selected opening image before animating it when its critical relation is wrong. Do not relabel a failed camera as the intended shot or rely on a video prompt to repair it.

## Define a camera rig rather than a movement adjective

Record separately:
- `positionAttachment`: fixed world, vehicle/body, moving object or path; with an offset in the named coordinate frame.
- `lookAt`: exact object, feature or point the camera points toward, including any intended handoff.
- `focusOn`: the depth/feature that should be sharp. This is distinct from aiming the camera.
- `framingTarget`: desired subject scale and screen position, plus allowed foreground occlusion.
- `pathAndEnd`: physical camera travel and resulting view; distinguish it from subject travel.
- `rollAndHorizon`: stable, body-relative or deliberately disturbed. Following a rotating projectile does not automatically mean copying its spin.

In a prompt these are clear intentions, not invented MiniMax parameters. In a real 3D rig, attachment controls camera translation while target tracking controls its aim. The rig is only actually constrained when implemented. A phrase such as 'camera attached to object' alone leaves offset, angle, focus and roll ambiguous.

For a fast-object insert establish its origin and path first. Keep the same source point and target when cutting into the close following view. A side-follow camera can keep the object nearly stationary in frame while the environment sweeps past; it must still advance through world space and leave the source behind. Avoid a free-floating object that hovers beside its origin. Show the payload/projectile appropriate to the event, not an entire cartridge or unrelated prop. A speed-emphasized insert may expand time intentionally; label the temporal treatment and keep it brief in the edit rather than stretching the whole encounter into slow motion. Long native generation handles do not determine its editorial duration.

## Preserve scale and force in the chosen style

The default remains low-poly Blender-style cinematic 3D, with full-scale subjects and believable construction. Simplification concerns modeling language, not tiny physical scale, toy proportions or comedy. Establish the subject's dimensions and compare it with grounded environmental details. Keep barrel/wheel/track/door proportions plausible within the design. Camera height must be meaningful relative to those dimensions. Avoid a distant, elevated catalogue view and decorative foreground/background blur when the intended feeling is proximity to a heavy machine; use these only when the story calls for them.

Choose lighting and materials for the event. A scenic golden landscape can be appropriate, but it should not overwhelm the threatened route, contact point or damage. Restrained metal response, construction thickness, contact shadows, accumulated dirt/wear, terrain interaction and sound can support industrial mass. 'No toy look' does not counteract a tiny protagonist, oversized cartoon parts, playful narration and miniature staging elsewhere in the brief.

Describe force through observable mechanics and timing: stable preparation/support, decisive acceleration or discharge, actual contact or miss, a specific material/target response, then recovery or irreversible change. For rigid machines put recoil in the designed mechanism, suspension, loose equipment or terrain; do not squash the whole hull as if it were rubber. Let loose matter and camera response follow the source event. Do not replace force with shake, white flash, slow debris or a larger explosion. The appropriate response depends on the object and event; greater spectacle does not imply greater physical correctness.

## Resolved prompt additions

Add only the relevant information to the existing image/video templates:

```text
VIEWPOINT INTENT: {WHOSE_EXPERIENCE; EMOTIONAL_RELATION; WHAT_THIS_VIEW_REVEALS}
LAYOUT EVIDENCE: {APPROVED_BLOCKOUT_OR_UNVERIFIED_PLAN; WORLD_POSITIONS_DIMENSIONS_AND_ACTION_AXIS; REFERENCE_ROLE}
CAMERA GEOMETRY: {START_POSITION_AND_HEIGHT_RELATIVE_TO_SUBJECT; DISTANCE_AND_LENS_CHARACTER; LOOK_AT; OPTICAL_FOCUS; SCREEN_ATTENTION}
ACTION GEOMETRY: {SOURCE_POINT; AIM_OR_PATH; TARGET; SUPPORT_AND_MATERIAL_RESPONSE; INCOMING_AND_OUTGOING_STATE}
CAMERA RIG: {WORLD_OR_OBJECT_ATTACHMENT; OFFSET; PHYSICAL_PATH; LOOK_AT_CHANGE_OR_LOCK; ROLL_POLICY; END_VIEW}
EDIT CONNECTION: {CONTINUING_PHASE_OR_ELLIPSIS; DIRECTION; ATTENTION_MATCH; REAL_TIME_OR_EXPLICIT_TIME_EMPHASIS}
```

Keep the full layout and next-cut plan in editorial records. Compile each provider prompt to this shot's actual visible state and change, without importing a future event or absent cast. Camera numbers in prose are not calibrated outputs; only a rendered/projected guide has an actual computed camera.

## Research basis and limits

- [ASC: Where Do You Put the Camera?](https://theasc.com/article/shot-craft-where-do-you-put-the-camera/) — camera placement is part of the story's emotional language.
- [ACMI: Exploring camera angles](https://www.acmi.net.au/education/school-program-and-resources/exploring-camera-angles/) — angle effects depend on context and intent, including heroic versus threatening low views.
- [ASC interview with Pixar's Onward cinematographers](https://theasc.com/article/onward-quest-for-magic/) — camera/staging, lens choices, previsualization and physically motivated camera behavior are developed together.
- [ASC: John Seale on Fury Road framing](https://theasc.com/video/john-seale-asc-acs-framing-mad-max-fury-road/) — consistent screen attention supported that film's fast editing. This is a useful option, not an all-shots-center rule.
- [Columbia: 180-degree rule](https://filmglossary.ccnmtl.columbia.edu/term/180-degree-rule/) — a stable action axis helps preserve the spectator's spatial understanding.
- [Animation Mentor: Believable weight](https://www.animationmentor.com/blog/how-to-create-believable-weight-in-animation/) and [timing/spacing](https://www.animationmentor.com/blog/tutorial-animate-with-timing-and-spacing-in-mind/) — force is communicated through opposing effort, posture and timing.

These sources support filmmaking and animation principles. They do not establish a measured success rate for GPT or MiniMax. Our blockout/reference/acceptance workflow is an engineering adaptation to observed failures, to be tested on actual outputs. Keep written intention, computed plan, selected still and generated motion as separate evidence stages.
