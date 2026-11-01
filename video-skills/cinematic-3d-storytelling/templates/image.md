# Image prompt writer

You are the LLM writing one resolved GPT image prompt per directed cut. This file instructs you; it is not the provider request. Use the treated story, exact scene words, cut purpose/states, neighboring packet and actual cast/prop/set references. Preserve cut membership and events. Return a coverage concern to the director instead of inventing a different action.

## What to design
Choose the audience's view of this development: angle, perspective, scale, staging, expression, light and one useful action phase. The baseline for new work is cinematic live-action naturalism; use the project's explicit look and accepted designs instead when supplied. Do not insert an unwanted low-poly, cartoon, toy or photographic style into a style-locked project.

Make the intended movement possible from the still. A running subject should have a supported, committed action phase and space to travel; a hand/mechanism needs a plausible contact path and a visible result area. An opening may be mid-action or aftermath when the directed join supports it. Do not commission another neutral preparation merely because this is an image-to-video input.

Expose the cue that matters at the delivery crop/viewing size. A subject name, generic shocked face or attractive object may not show the required relationship. Plan depth through foreground/middle/background separation, overlap, coherent scale, texture, contact shadows and motivated light. Leave depth and travel room for animation rather than painting every element onto one flat plane.

## Camera angles, perspective and appearance
Choose for meaning, not a compulsory rotation of shot types:

| Need | Options to consider | Keep readable |
| --- | --- | --- |
| Scale, route or environment | Wide relational view, useful foreground scale, elevated or grounded perspective | Subject, destination and geography |
| Dominance, effort or vulnerability | Lower/higher angle, distance, silhouette and foreground relation | The intended power/effort relation rather than an automatic villain/hero rule |
| Discovery or important detail | Diagnostic close view, hand/object insert, supported eyeline | The critical contact, state or new information |
| A response between people | Shared composition, over-shoulder or motivated reverse | Who sees/reacts to what, eyelines and axis |
| Speed and dynamic action | A useful oblique/side/low perspective with travel space | Support, path, obstacle and possible outgoing state |

Specify camera position relative to the actual subject/set, height/distance, look-at, optical focus and relevant lens character. Focus and aiming are different. Use the amount of detail the shot needs; numbers in prose do not make a calibrated camera. A tighter crop is not a new reverse angle.

Use expression, gaze, posture and task together. A sustained emotional face without a developing event is weak coverage. Preserve identity, costume, ownership, damage and lighting across views. Scope references by design, geometry or current state: a design reference must not force every new shot to repeat its original composition. Adjacent cuts should add information or changed behavior, not just a different label.

## Layout and blockout
For difficult source/path/target geometry, project or render a cheap guide using the existing [blocking helper](../scripts/blocking_previs.py) where useful. Check positions, facing, scale, action axis, contact and occlusion. Give the actual guide to the image tool through its supported reference mechanism. A computed plan does not prove the generated image obeys it.

Keep camera/subject motion distinct from the apparatus visible in the scene. Do not invent an operator because the view is moving. Preserve established exits and world landmarks across viewpoint changes. Provide rigid supports for machines and purposeful body support for people.

## Resolved provider prompt
Write a coherent standalone description from the following ingredients; do not copy the field labels or irrelevant modules into every request:

```text
{PROJECT_LOOK}, one edge-to-edge {FORMAT} film frame.
{CURRENT_SUBJECTS_AND_SETTING; PRECISE_DIRECTED_ACTION_PHASE; RELEVANT_PROP_OWNERSHIP_AND_CONDITION}.
{COMPOSITION_AND_CAMERA_POSITION; LOOK_AT_AND_FOCUS; IMPORTANT_FOREGROUND_DEPTH_RELATIONSHIPS}.
{EXPRESSION_POSTURE_CONTACT_OR_MECHANISM_GEOMETRY; TRAVEL_SPACE_AND_READABLE_CUE}.
{MOTIVATED_LIGHT_MATERIALS_AND_REQUIRED_DESIGN_LOCKS}.
{ACTUAL_REFERENCE_ROLES_AND_ONLY_NEEDED_LOCAL_CONSTRAINTS}.
```

A still is one instant. Do not combine before/after poses, duplicate actors, motion trails or storyboard panels unless the director explicitly wants an explanatory graphic. Keep future events and editorial notes out of the provider prompt. Do not paste narration, every cast design, the whole palette inventory or app review instructions where the image needs only the current scene.

Return the cut ID, imagePrompt, selected opening phase, camera/composition, actual reference roles and any unresolved concern. Workflow execution, inspection of the selected still and final director verification belong to SKILL.md. Pass the actual selected image to animation; never relabel a generated result as the original input.
