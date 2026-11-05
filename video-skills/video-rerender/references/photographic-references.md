# Source-grounded photographic references

Use when converting source animation/video into photographic reference images or preparing a multi-image video request. Project-specific examples, actor assignments, source times and accepted files belong in the project's manifest, not this reusable skill.

Use the shared look/scene contract and image template in [live-action-prompts.md](live-action-prompts.md). Derive continuing poses from a canonical photographic set/cast base and check reference compatibility before video. A pose change does not justify changed trees, walls, lighting, actor identity or prop ownership. A real camera change reprojects the same world; it does not freeze the old frame or morph between sets.

## Choose useful instants before generating

Watch the whole relevant source action with its neighboring shots. Select legible moments at exact recorded source times; inspect more native frames around a fast contact or uncertain camera cut. A black fade, white flash, occluding tree, transition blend or unreadable smear is a poor sole action guide. Choose a nearby readable instant without removing the event from the story.

The primary image should represent the action state the output needs, often already underway: a caster with a charged spell, a loaded swing, an airborne collision, an already braced block or an ongoing retreat. Do not turn every new clip into a ready pose. If the primary time is later than the scene boundary, record that offset; the image does not silently delete the preceding approach or change the edit duration. Secondary images can retain that necessary earlier coverage.

Reference count follows motion and camera coverage, not a fixed quota. A simple view may need only a small pair of meaningful states when multiple images are requested. A rapid action, interaction, effect or camera reveal usually needs more distinct views: the loaded phase, release/approach, actual contact, target consequence/recovery and any essential new source angle. Three to five can be useful for complex coverage when the model permits it; add only views that explain a real event. Keep within the actual provider limit and reference-token budget. Do not fill spare slots with nearly identical frames or unrelated identities. Preserve real source cuts even when their views share one logical production scene.

## Separate layout from appearance

Label each actual input in order. The source snapshot controls this instant's perspective, camera height, framing/crop, subject scale, visible count, locations, facing, gaze, occlusions, pose and action phase. Reviewed photographic inputs control only the matching actor identity, wardrobe, object design, creature species/material or compatible endpoint that each was chosen to supply. A supporting identity photograph must not override the target camera, pose or visible cast.

Use a cropped identity/material guide when a full previous tableau encourages the wrong composition or adds unshown people/effects. Inspect a cropped face for realism, but compare the complete output frame with the complete source for layout. Do not identify two characters as the same person merely because both wear a similar robe or have the same hair color; verify costume, props and source sequence.

Carry concrete object and body state: weapon owner and hand/grip, shield straps, book open/closed and held corner, staff design, hood up/down, hats, injuries, loaded weight and existing contact. Keep a face outside frame when the source hides it. Preserve a reassuring or frightened expression rather than replacing every face with a hostile cinematic glare. Remove non-diegetic credits/subtitles only; do not erase actual book pages, equipment markings or meaningful scenery.

Across a compatible continuing view, an accepted preceding image or actual rendered endpoint can help preserve state. Across a camera cut, reconstruct the same state from the required new angle. Retain source placement and movement direction; do not force the old camera into the new shot. A pose is not velocity, so save a concise incoming/outgoing motion description alongside the image.

## Photographic prompt pattern

Adapt this compact pattern to the selected image tool and actual reference order:

> Create one photographic live-action movie still at the requested aspect ratio. Image1 is the exact source camera, composition and action-phase authority. Image2 supplies only [matching actor/wardrobe]; Image3 supplies only [prop/creature design]. At this instant, [visible subjects, loaded pose, direction and current contact/effect]. Preserve [essential grip, object state, scale and occlusion]. Use real adult facial/joint anatomy, natural skin, practical cloth/metal and convincing physical creature materials, with source-appropriate lighting and moderate contrast. Every visible face and background element must be photographic. Keep source framing and expression; no portrait recrop, unshown people, invented props or illustration/game-render finish.

Name actual input roles instead of blindly assuming Image1 is always the source: for an edit, it may be the existing photograph and Image2 the new source pose/layout. Preserve the original's established design while changing only the required pose, view, prop state or expression. Keep detailed analysis in the project; image prompts should state the few invariants that matter to that frame. Video prompts use their own supported media tags and a concise complete motion job, not this longer image template.

When the creator selects GPT images, use the available imagegen skill and built-in tool workflow. Generate separate requested assets rather than collages. Keep paused video workers and GPU model services paused during an images-only task. Do not silently switch to API/CLI generation, raw animation video guidance or another provider after a tool failure.

## Inspect, correct and preserve

Compare every candidate with its exact source snapshot: camera/crop, visible people, pose/contact, props/state, expression, physical anatomy and photographic style. Then compare adjacent selected images for identity, wardrobe, geography and chronological action continuity. Look for a partly drawn face inside an otherwise realistic frame, a copied earlier pose, an unwanted camera zoom, a newly exposed face, a disappearing book or a wrong hood state. Texture and attractive lighting alone are not acceptance criteria.

Correct a demonstrated discrepancy with a focused edit that preserves successful parts, and inspect it again. Reuse accepted photographs and completed matching requests; do not regenerate the whole batch for a few failures. Keep prior versions, source times, input roles, prompts, output files/hashes and actual receipts. If a tool constraint requires a non-graphic or other material adaptation, label that source-fidelity difference and do not claim an exact reconstruction. Repeated unresolved failures stay flagged rather than becoming accepted to fill a count.

Save originals plus requested-resolution derivatives without cropping out source content or distorting aspect ratio. Keep all project assets in the scene/project folder, with a small source/output review gallery and a manifest that identifies the selected version. Do not use filenames alone when an older version remains beside a correction. Record unknown image/infrastructure prices as unpriced, not zero.

In this repository, `tools/reference_images/register_gpt_images.py RECORDS_JSON REFERENCE_PACK_FOLDER` saves completed built-in image outputs, prompts, selected versions and supplied review notes into an existing pack manifest. It does not call a generation API. `tools/reference_images/build_review_gallery.py REFERENCE_PACK_FOLDER --first-scene N --scenes COUNT` makes full-frame source/output comparisons and 720p derivatives for that numbered range. Inspect their current interfaces and retain actual review decisions; neither tool judges source fidelity automatically.

## Video review remains a separate gate

When video generation is authorized, feed the reviewed photographic views with explicit roles and source audio/script as requested. Watch the full delivered video and source at normal speed, not only their first/last frames; inspect dense frames where contact or a cut is ambiguous. Compare native generation, edited timing and adjacent joins for camera path, actor placement, action phase, acceleration, contact/force, effects' origin/path/target, prop ownership, identity/style drift and intelligible exact-language dialogue. A still-image or codec pass cannot approve these.

Diagnose each wrong shot before the smallest authorized repair: a different saved phase, complete-action retiming, a local edit/effect, corrected guidance or a bounded new take. Recheck the source and neighboring output after the repair. Do not repair wrong anatomy or missing impacts with smoothing, severe speed changes or a dissolve; do not launch unbounded retries. Preserve residual defects and require review before declaring the film finished.
