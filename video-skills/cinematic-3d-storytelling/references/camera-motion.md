# Animation camera motion

Use with [the animation template](../templates/animation.md). The selected still supplies the starting viewpoint. This guide owns pans, arcs/orbits, tracking/following, camera attachment, focus handoffs, parallax and continuous movement. Static angle and appearance decisions belong to [image composition](image-composition.md).

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

## Motivated travel and attention

- Move alongside, lead or follow a person/object when their progress carries the event. An attached viewpoint moves with its subject while the fixed environment produces coherent parallax.

- Arc, pan or rise when this reveals previously hidden information, scale or a reaction. A camera turning in place and a camera translating through space are different instructions.

Favor visible subject activity plus a purposeful camera move over repeated drifting past held poses. One smooth move does not mean slow action: the camera can follow fast action continuously at natural speed. Let camera inertia, subject acceleration, foreground crossings and depth create energy; do not use zoom, blur, orbit or shake as decoration. Avoid impossible travel through solid objects, a full orbit that must invent an unseen room, or occlusion that hides the action the cut is meant to explain. A restrained or briefly held camera is appropriate when extra movement would obscure the event.

Give each camera move a subject and a reason: follow the entering person, travel beside the carried object, move from the hand contact toward its result, arc enough to reveal an obscured detail, or track the event's path. Specify the camera's starting position, path, point of attention and ending view in the same fixed world. A closer crop alone is not a new viewpoint; a generic slow push or orbit is not a substitute for an event. Quiet reactions still need a thought, eyeline or task that changes. Preserve the selected low-poly or other rendering language rather than making every model input photorealistic.

Smooth camera movement must not turn a quick event into slow motion. State the intended action speed separately from camera speed and name the moving attention target. A following camera may match the subject's travel; an orbit moves relative to it; an attached view shares its motion. In each case the background stays fixed and produces depth-dependent parallax rather than sliding or warping as a flat plate. Preserve planted support, weight transfer, momentum, resistance and recovery even with stylized geometry. For reactions specify the observable behavior, not an abstract instruction to feel an emotion. Keep each prompt focused enough for one short continuous take; a new location, reverse, impact insert or time jump belongs in the edit unless the planned physical camera move actually connects it.

A camera may lead, follow, attach to a moving object, pan to new danger, arc to reveal a blocked relationship or briefly hold so contact reads. Plan start, path, attention and end in the same world. Cutting on a continuing action can carry momentum into a new view without replaying the full action. Match ownership, damage, velocity, direction and relevant supports across the join.

## Motion prompt additions

```text
CAMERA RIG: {WORLD_OR_OBJECT_ATTACHMENT; OFFSET; PHYSICAL_PATH; LOOK_AT_CHANGE_OR_LOCK; ROLL_POLICY; END_VIEW}
EDIT CONNECTION: {CONTINUING_PHASE_OR_ELLIPSIS; DIRECTION; ATTENTION_MATCH; REAL_TIME_OR_EXPLICIT_TIME_EMPHASIS}
```

Keep the full layout and next-cut plan in editorial records. Compile each provider prompt to this shot's actual visible state and change, without importing a future event or absent cast. Camera numbers in prose are not calibrated outputs; only a rendered/projected guide has an actual computed camera.

## Research basis

- [ASC interview with Pixar's Onward cinematographers](https://theasc.com/article/onward-quest-for-magic/) — camera/staging, lens choices, previsualization and physically motivated camera behavior are developed together.

- [ASC: John Seale on Fury Road framing](https://theasc.com/video/john-seale-asc-acs-framing-mad-max-fury-road/) — consistent screen attention supported that film's fast editing. This is a useful option, not an all-shots-center rule.

These sources support filmmaking and animation principles. They do not establish a measured success rate for GPT or MiniMax. Our blockout/reference/acceptance workflow is an engineering adaptation to observed failures, to be tested on actual outputs. Keep written intention, computed plan, selected still and generated motion as separate evidence stages.

## Moving-subject coverage

| Information/experience needed | Useful starting coverage | What must remain legible |
| --- | --- | --- |
| A fast moving object carries attention | A following/attached/parallel camera with an explicit target and offset | Origin, travel direction and destination; the background changes coherently. |

Specify camera translation/attachment, look-at, optical focus and roll separately; 'follow the object' alone is incomplete.

A quiet attempt to avoid notice and a fast mechanism need different movement treatments. Do not apply the same orbit, slow push or level of agitation to both.
