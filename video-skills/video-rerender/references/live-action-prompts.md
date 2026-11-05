# Live-action image and video templates

Use for photographic reference construction and video performance direction. Both models share the same project look, actors, set and physical continuity. Accurate reference matching and natural motion are separate requirements.

## What the older prompts contributed

The creator preferred photographed people, tangible cloth/skin/props, convincing space, a camera following action, and decisive hit/reaction/recovery. Their feedback also identifies changing actors and objects appearing without an entrance. Retain the physical direction while stabilizing the cast and set.

Useful fight direction names a planted support foot, hip/torso drive, glove/boot meeting an existing target, target displacement along an established exit, and immediate recovery. “Powerful,” “cinematic” and “realistic” alone omit those events. An ordinary reveal or conversation needs ordinary balance, expression and gaze; a generic combat suffix invites the wrong action. Repeated copies of a prompt are not additional guidance.

Check actual inputs/settings before explaining an old/new difference. One photograph plus a small motion reference, one photograph plus audio, and eight phase photographs are different recipes. Do not attribute a delivered difference to wording alone. Preserve the current input policy: historical motion-video success does not authorize adding source animation again. Treat suspected causes as hypotheses until compared in authorized output reviews.

## Required shared scene contract

Save the look/cast/set once per project or connected sequence. Resolve these fields for each scene, then send only their relevant concrete facts to the provider:

| Always resolve | Required information |
| --- | --- |
| Photographic look | Believable adult proportions and skin variation; practical clothing/props and physical surroundings; actual light direction, exposure, depth and contrast. Physical fantasy creatures/effects where needed. |
| Cast and ownership | Stable actor identity, wardrobe condition, visible count, who owns each important prop and in which hand; visible injuries/transformations. |
| Persistent world | Foreground/midground/background, named landmark relationships, scale, lighting and established entry/exit lanes. |
| Camera | Actual viewpoint/crop and locked/pan/track/tilt/cut behavior. Describe camera travel separately from actor travel. |
| Current phase | Existing pose, support, gaze, contact and incoming velocity. Continue the action instead of resetting to rest. |
| Reference roles | Which picture anchors the scene; which supplies identity/detail, another compatible phase or a distinct source view. |
| Event and outgoing state | One causal action, its visible consequence and carryover; appropriate human behavior for quiet shots. |
| Video sound/timing | Resolved speech/no-speech and speaker, event effects/ambience/music preference, project fps and meaningful action landmarks. |

Do not invent hidden footwork, a lens number, another opponent, dialogue or an impact to fill an unknown. Resolve essential missing geometry before generation; keep offscreen uncertainty in the plan. Lock **identity and world relationships**, not every subject's screen coordinates, pose and crop while the camera or actor moves.

## Compatible references instead of background morphing

Use one canonical photographic set/cast anchor per compatible camera setup. Derive subsequent same-view phases by editing it: change the required body pose/contact/expression while retaining background geometry, light, object design and camera calibration. For a genuine new view reconstruct that same set in perspective.

Before passing several photographs to video, compare horizon/perspective, landmarks after accounting for camera parallax, relative sizes, lighting, cast/wardrobe/props and chronology. Prompt wording cannot reliably reconcile incompatible full-scene images. Reuse or repair the compatible photograph within authorization, or omit the conflicting secondary tableau and use an identity/pose detail where sufficient. Do not supply rejected/mismatched images merely to fill input slots.

Use the minimum **sufficient compatible** coverage. A simple continuous view may need one scene anchor plus a useful detail; difficult contact can need loaded, contact and consequence guidance. Keep essential source views/action phases in the plan. A genuine cut is separate coverage, not a morph between camera positions; additional requests still require the current take/budget authorization.

An edit can retain the old photographic pose even when its text asks for a different macro or kick. When this is observed, do not call near-identical outputs distinct phase coverage. A bounded repair can return the current source layout to the target slot and reduce the competing photograph to the relevant face, costume or prop detail. Inspect the changed view before expanding the phase set when review is authorized. Changing reference format and prompt brevity together is a practical repair, not proof of which change caused the improvement.

Multi-image references are not automatically endpoint constraints. Use actual supported start/end controls only for physically compatible states. Describe the connecting performance, not “interpolate these pictures.” Existing trees, walls and ground reproject through camera parallax; they do not slide/stretch/dissolve into another layout. Actors/props enter from established frame edges, depth or occlusion and persist afterward rather than materializing from a later reference.

## Image model template

Generate one physical instant, not an action montage. Resolve placeholders and omit unused clauses:

```text
One photographic live-action movie still, {aspect/size}. Believable adult facial and joint proportions, natural skin variation, practical cloth and {relevant prop/creature materials}; {actual lighting, exposure and depth}. Every visible person and background shares the photographic treatment.
{Actual ordered input roles: edit target/canonical photograph; current source layout/pose guide; matching identity/wardrobe/prop guides.}
At this instant: {actual viewpoint/crop, visible count, current pose/support/gaze, owned prop/contact and action phase}. Preserve {named cast/wardrobe details} and the same {specific set landmarks and depth relationships}. {Exact change from the photographic base when editing.} Keep {important foreground occlusion or out-of-frame constraint}.
The body carries {visible load/weight/incoming movement appropriate to this instant}; clothing/equipment hang from their real attachment points. {Only a visible source effect, with origin/path/current contact.} No added cast, props, invented attack or portrait recrop; no illustrated, game-render or waxy-beautified finish.
```

For **Qwen Image 2.1 editing**, `<image1>` is the actual target. Prefer a compatible photographic base there and assign later inputs to the current source pose/layout or identity details. State the exact change and retained set/cast. If there is no initial photograph, the source can be the target: explicitly replace its drawn appearance completely while preserving geometry and using photographic appearance guides. Never mislabel a file as the established photograph.

Example role sentence: “Edit `<image1>`, the established photograph of this setup. `<image2>` supplies the new body pose/count only; retain `<image1>`'s actors, costumes, ground, trees, light and perspective.” For a real source camera change replace that last perspective lock with the required new view of the same set. Use the actual tags of another selected image tool.

## Video model template

Write a concise causal performance, without appending another generic realism/force paragraph. MiniMax uses `<Picture N>` and the request's actual `<Audio N>` mapping:

```text
Photographed live action, {project fps}, {actual lighting}; believable adult performers and tangible {relevant materials} in one persistent physical set.
{Picture-role sentence: current-shot anchor; compatible secondary pose/detail guides or explicitly separate cut views.}
{Incoming loaded/moving state}. {Camera's actual path and framing behavior, separate from subject travel}. {Current scene's performance: cause → event/contact → visible result → recovery/carryover}. Continue the movement through the shot rather than resetting to poses between beats.
Keep {named identities, costume/prop ownership, creature scale} and {specific world landmarks/depth/entry lanes}. The camera reprojects this same space with natural parallax; actors and objects persist through occlusion. {Only the demonstrated continuity risks for this shot.}
{Exact dialogue or explicit no-speech contract, owned speaker, actual audio role, appropriate effects/ambience and music preference}. {Only required cuts or one continuous shot; no unrequested slow motion, dissolve, extra event or frozen lead-in.}
```

Select the relevant module; do not stack all of these onto every shot:

| Scene | Concrete physical/performance direction |
| --- | --- |
| Punch/kick/weapon | Existing support/loaded state → leg/hip/torso drive → the actual striking surface reaches an already present target → immediate target deformation/rotation/displacement and material response → follow-through and recovered balance. Preserve fantasy force through required displacement, not impossible joints. If already airborne/striking, continue that phase without a fresh plant/wind-up. |
| Running/approach | World/depth direction, forward body drive, push-off/flight/landing rhythm, pelvis/shoulder counter-motion, ground contact, equipment lag and size change. Source-required camera behavior. No foot sliding or translation of a rigid pose. |
| Dialogue/quiet reveal | Specific thought/eyeline, natural jaw/lip articulation, breathing, weight shift or actual prop task. Complete speech and pauses. Avoid immobile portrait performance, random fidgeting and combat recoil. |
| Spell/projectile | Existing emitter and loaded state → release direction/shape → continuous readable path → source-required target interaction/consequence. Preserve origin and aftermath; exposure flicker is not the attack. |
| Camera move | Starting view, physical track/pan/tilt direction, subject-relative distance and ending frame. Foreground passes at its real depth; background parallax comes from camera travel. Motivated operator follow/settle only where compatible. Locked shots stay locked; “cinematic” does not authorize arbitrary shake, orbit or zoom. |

Normal-rate action can accelerate very rapidly and carry superhuman force while retaining readable contact, continuation and recovery. Do not make the whole body uniformly fast/eased. Blur, global shake, dust and severe retiming cannot replace mechanics. Appropriate softness/slowness is natural in quiet scenes; “never slow” is not a blanket direction for all behavior.

State the finite action count and concrete outgoing state when repetition is a risk. For example, after one release, kick and punch, the hands are empty, the striking leg recovers under the body and the performer continues in guard; the captured opponent is no longer in the hand. A generic “return to guard” may leave enough ambiguity for a model to repeat attacks or reconstruct the opening pose at the end. Check the last moving phase, not only the first photograph.

In reference-method experiments, keep photographs, seed, dimensions, native duration and audio fixed between matched guidance tests. Change the declared guidance/performance variable and retain each expanded request. Compare photographic appearance, persistent space and causal choreography separately: improved pose order can accompany background/style drift, and photographic bodies can still perform a weak sustained push. Sampled frames can establish such visible discrepancies; they cannot establish perceived force, natural timing or sound quality at playback speed.

Sound reinforces the actual event: weighty contact/landing, foot-ground friction, cloth/equipment and local ambience as appropriate. Do not add heavy impacts or speech to a silent reveal. Quote dialogue only from its resolved contract; audio guidance does not establish that speech was delivered correctly.

### Duration and final input sanity

The model cannot see source footage it did not receive. Replace “where the source shows him” or “exact reviewed motion” with the actual camera/body/event description. Honor an images-plus-standalone-audio policy rather than restoring historical source-animation input.

Separate the desired edit beat from native duration/frame padding. Describe the complete action and its landmarks; do not stretch a short attack into a long smooth transition. Select/trim a complete useful action later within the authorized edit/review mode. Keep speech natural. A timing instruction is not proof that the event fits or was delivered.

Before submission resolve the contract, check references against each other, remove contradictory camera locks and duplicated boilerplate, and include only the current scene's module. Save the expanded prompt/input mapping. Never rewrite submitted requests to match the new template.

## Make the image stage visible

After a scene's selected photographs are registered, immediately place them into that scene's visual timeline as **image previews**, before video generation. Use held images with simple cuts, not invented camera animation or a crossfade/morph. Preserve source audio, duration/IDs, original references and alternatives. Mark unapproved and not a rendered video. Keep already selected videos and creator edits by default.

Use `tools/place_scene_images.ts --plan PLAN.json` for registered image assets, then `--apply` after checking the dry run. The plan identifies scene and ordered active image/version IDs with bounded frame intervals. Held, outdated, support-only, rejected and missing phases remain pending. Never substitute an empty plate or identity crop for the story shot. Completed video replaces that scene's previews/source-audio placeholders through source-aware tools; photographs remain available in the library.
