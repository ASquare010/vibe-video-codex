# Image prompt writer

You are the LLM writing a resolved GPT image prompt for each needed keyframe of a directed cut. This file instructs you; it is not the provider request. Use the treated story, exact scene words, cut purpose/states, neighboring packet and actual cast/prop/set references. Preserve cut membership and events. Return a coverage or consolidation concern to the director instead of silently adding cuts or inventing a different action.

## What to design
Choose the audience's view of this development: angle, perspective, scale, staging, expression, light and one useful action phase. Use the project's explicit look and accepted designs. For a new animated narrative, default to this hybrid look:

- **Characters:** flat 2D cartoon shapes, simple outlined faces, expressive eyes/brows, clean flat colors and slender graphic limbs. Use consistent thin black ink contours and simple costume shapes; avoid low-poly facets, sculpted skin, realistic facial rendering or accidental inflated 3D dolls.
- **Environment and props:** dimensional 3D toon construction, hand-painted textures, saturated colors, ink outlines on important geometry edges/creases and readable foreground/middle/background depth. Keep mechanisms and load-bearing connections clear rather than flattening the whole world into an illustration.
- **Integration:** characters receive the scene's light and simple shadow shapes, cast contact/ground shadows and sit correctly behind/in front of set objects. Favor warm key light with blue/purple shadows, selective pools of light and soft background depth of field. Flat character design does not mean unlit stickers floating over a 3D plate. Change lighting with the story's actual time/place, not arbitrarily between views.

Describe these visible properties rather than a studio name. An explicit creator theme or saved project look overrides this default; do not restyle existing assets without authorization.

Make the intended movement possible from the still. A running subject should have a supported, committed action phase and space to travel; a hand/mechanism needs a plausible contact path and a visible result area. Resolve torso facing, joint reach, grip surface, planted support, resistance and room for the intended movement. A hand on a nearby fixed rail is a different state from gripping the moving control. An opening may be mid-action or aftermath when the directed join supports it; preparation before contact is valid when the director explicitly budgets that reach. Do not commission another neutral preparation merely because this is an image-to-video input.

Build the view around the director's first-notice priority and expose its cue at delivery crop/viewing size. Face, mechanism and landscape need not compete equally in every image. Preserve essential contact and travel space within the portrait or landscape crop and any known display overlays; do not impose another format's fixed margins. A subject name, generic shocked face or attractive object may not show the required relationship. Plan depth through foreground/middle/background separation, overlap, coherent scale, texture, contact shadows and motivated light. Leave depth and travel room for animation rather than painting every element onto one flat plane.

## Camera angles, perspective and appearance
Choose for meaning, not a compulsory rotation of shot types:

| Need | Options to consider | Keep readable |
| --- | --- | --- |
| Scale, route or environment | Wide relational view, useful foreground scale, elevated or grounded perspective | Subject, destination and geography |
| Dominance, effort or vulnerability | Lower/higher angle, distance, silhouette and foreground relation | The intended power/effort relation rather than an automatic villain/hero rule |
| Discovery or important detail | Diagnostic close view, hand/object insert, supported eyeline | The critical contact, state or new information |
| A response between people | Shared composition, over-shoulder or motivated reverse | Who sees/reacts to what, eyelines and axis |
| Speed and dynamic action | A useful oblique/side/low perspective with travel space | Support, path, obstacle and possible outgoing state |

Specify camera position relative to the actual subject/set, height/distance, look-at, optical focus and relevant lens character. Favor low camera positions where they strengthen presence or expose the action. Consider a Dutch tilt for instability, a fall or a dramatic power imbalance; keep the needed contact and geography readable. Focus and aiming are different. Use the amount of detail the shot needs; numbers in prose do not make a calibrated camera. A tighter crop is not a new reverse angle.

Use expression, gaze, posture and task together. A sustained emotional face without a developing event is weak coverage. Preserve identity, costume, ownership, damage and lighting across views. Scope references by design, geometry or current state: a design reference must not force every new shot to repeat its original composition. Adjacent cuts should add information or changed behavior, not just a different label.

## Keyframes within one continuous cut
Here, keyframe positions mean reference views of action/composition stages, not images locked to output timestamps. Pass their intended order and role without inventing timed controls.

Resolve an opening image first. Add a later composition/action keyframe only when it clarifies a meaningful camera destination, difficult action phase or required result; do not commission a still for every gesture. Similar views of the same continuous event normally belong to one cut. Return duplicate proposed cuts to the director for consolidation before generating more images.

For a directed multi-keyframe cut, keep one cut ID and label each image's role/phase, such as opening, after-contact or closer result view. Derive later views from the same checked set and selected design references. Carry body support, handedness, prop position/condition and completed progress forward. The later image is a new instant, not a reset to the opening pose. Make the camera route between compositions physically possible and preserve space for it. For example, a tube-guiding medium view can lead to a closer view of the same hand/arm after the first guiding movement; it must not restart the insertion or relocate the doctor.

Generate each needed keyframe as a separate clean image, never a labelled collage for the video input. Record whether it is only a planning target, an attached composition reference or a supported timed/endpoint control. Those roles are not interchangeable. A requested destination image does not itself establish that the installed video route can enforce its frame or timestamp.

## Layout and blockout
For difficult source/path/target geometry, project or render a cheap guide using the existing [blocking helper](../scripts/blocking_previs.py) where useful. Establish connections, positions, facing surfaces, scale, action axis, support and occlusion before adding visual polish. Derive a new camera view from that same world rather than independently rearranging objects to fit it. The helper's boxes/cameras can establish coarse space; they do not prove anatomy, grip or mechanism function. Give the actual guide to the image tool through its supported reference mechanism. A computed plan does not prove the generated image obeys it.

Keep camera/subject motion distinct from the apparatus visible in the scene. Do not invent an operator because the view is moving. Preserve established exits and world landmarks across viewpoint changes. Provide rigid supports for machines and purposeful body support for people.

## Resolved provider prompt
### GPT Image route and references
The saved Apollo calls used the built-in image tool, which does not expose a model alias or variant selector. Do not label those calls verified GPT Image 2.5. Higgsfield separately exposes `gpt_image_2_5`; consult its live catalog if that route is selected. OpenAI recommends Sunburst for demanding quality and Flare for speed. In that Higgsfield route, Sunburst/high/2k is a quality-first starting candidate, not a measured optimum; the catalog defaults to Flare/low/1k. Keep model, variant, quality, resolution and aspect ratio in actual request settings, not as magic words in the prompt. Preserve the creator's selected route.

For new shots, describe subject/action, composition, lighting, materials and essential constraints concretely. Assign each attached reference its role: identity/costume, set geometry, current prop state or visual medium. Repeat the few identity details that matter across shots. A fresh angle may change the composition while preserving design; a local repair should name the one change and explicitly preserve the surrounding frame. Supply the selected image as an actual input, inspect the result, and refine one issue at a time. Do not repeatedly regenerate an entire scene to repair one hand or prop.

Choose references by the question they answer. A character/design view establishes appearance; a checked set/layout view establishes relative positions; a prop/detail view establishes mechanism shape and contact; the selected current frame establishes an edit target or continuation state. One image may serve several roles only where those features are actually clear and correct. Do not make an unverified wide frame the geometry authority for every dependent close view. Resolve conflicting references explicitly and attach only relevant inputs; extra references are not automatically better.

For a correction, decide whether the base arrangement is valid. If it is, change the local defect while preserving the rest. If the connection, viewpoint or working pose is wrong, reconstruct that arrangement from the checked layout instead of instructing the model to preserve it. Keep initial attempts and actual request/reference records. Acceptance and decisions to expand a dependent image set belong to the director checks in SKILL.md.

Source: [OpenAI image prompting](https://developers.openai.com/api/docs/guides/image-prompting). Provider parameter names differ by route; refresh the actual tool schema rather than copying API fields into the built-in tool.

Write a coherent standalone description from the following ingredients. Short labeled lines are useful for complex geometry; natural sentences are useful within them. Remove unresolved placeholders and irrelevant modules. Prompt length follows the shot's requirements, not a fixed word limit:

```text
Frame: {PROJECT_LOOK}, one edge-to-edge {FORMAT} film frame.
Current event: {SUBJECTS_AND_SETTING; PRECISE_DIRECTED_ACTION_PHASE; RELEVANT_PROP_OWNERSHIP_AND_CONDITION}.
View and space: {COMPOSITION_AND_CAMERA_POSITION; LOOK_AT_AND_FOCUS; IMPORTANT_CONNECTIONS_AND_DEPTH_RELATIONSHIPS}.
Pose and contact: {EXPRESSION_POSTURE_SUPPORT_GRIP_AND_REACH; TRAVEL_SPACE_AND_READABLE_CUE}.
Light and materials: {MOTIVATED_LIGHT_AND_REQUIRED_DESIGN_LOCKS}.
Inputs and constraints: {ACTUAL_ATTACHED_REFERENCE_ROLES; WHAT_CHANGES_AND_WHAT_STAYS; ONLY_NEEDED_LOCAL_CONSTRAINTS}.
```

A still is one instant. Do not combine before/after poses, duplicate actors, motion trails or storyboard panels unless the director explicitly wants an explanatory graphic. Keep future events and editorial notes out of the provider prompt. Do not paste narration, every cast design, the whole palette inventory or app review instructions where the image needs only the current scene.

Return the cut ID, keyframe role/phase, resolved imagePrompt, camera/composition, actual reference roles and any unresolved concern. For multiple images retain their order and the state change/path connecting them under the same cut. Preserve the exact expanded provider input and attached reference paths/version IDs with the generation receipt; the shorter planning description is not that request. Workflow execution, inspection of selected stills and final director verification belong to SKILL.md. Pass the actual selected images and their roles to animation; never relabel a generated result as the original input.
