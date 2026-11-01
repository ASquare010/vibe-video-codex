# Image layout, action geometry and blockout

Use after the action director has designed the event, before commissioning its images. For geometry-sensitive action, establish a simple reusable layout and camera views before surface detail. A text description of a fixed world does not establish that independently generated images obey that world. The procedure below is a practical adaptation of the sources at the end, not a proven guarantee of model compliance.

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

## Layout evidence in the image prompt

```text
LAYOUT EVIDENCE: {APPROVED_BLOCKOUT_OR_UNVERIFIED_PLAN; WORLD_POSITIONS_DIMENSIONS_AND_ACTION_AXIS; REFERENCE_ROLE}
CAMERA GEOMETRY: {START_POSITION_AND_HEIGHT_RELATIVE_TO_SUBJECT; DISTANCE_AND_LENS_CHARACTER; LOOK_AT; OPTICAL_FOCUS; SCREEN_ATTENTION}
ACTION GEOMETRY: {SOURCE_POINT; AIM_OR_PATH; TARGET; SUPPORT_AND_MATERIAL_RESPONSE; INCOMING_AND_OUTGOING_STATE}
```

Use [image composition](image-composition.md) for viewpoint and appearance. Record the physical room, actors, objects and required action from the director; the image role resolves and checks the projected view.
