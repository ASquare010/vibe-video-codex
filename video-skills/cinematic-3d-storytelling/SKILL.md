---
name: cinematic-3d-storytelling
description: Develop researched stories, direct their staging and performance, and produce cinematic films using narration, stills and MiniMax animation. Use across genres and lengths, including Shorts and long-form videos.
metadata:
  display-name: Cinematic storytelling
  workflow: director-first-cuts-v3
  story-owner: writer
---

# Scope
A complete-video request authorizes a new VibeCut project, necessary narration/images/video, bounded repairs, local assembly and export. Carry that scope through to the actual film without repeated stage approvals. A script-only request, budget, review gate or stop narrows it. Publishing is separate. Recover the same project and existing job IDs on continuation; preserve frozen instructions, accepted media, creator edits, requests, failures and costs.

Choose and lock the look for the story. For character-led animated action, consider feature-style stylized 3D with tangible materials, strong silhouettes and expressive poses; MiniMax publishes a dedicated workflow for it. Cinematic live-action naturalism remains an option for realistic subjects. Neither is a locally proven winner. The [image template](templates/image.md) owns the visual specification; follow an explicit theme override or an existing project's saved look.

# Workflow
1. **Writer:** use [script.md](templates/script.md) to research and tell a compelling complete story. Return the full spoken draft and continuous scene texts. The writer does not plan shots.
2. **Director, before recording:** read the writer's story and exact narration as read-only input. Use [director.md](references/director.md) and [the record contract](contracts/production.md) to plan staging, provisional cuts, performance, sound and purposeful space without speech. Preserve the words, event order, causes and ending. Return story problems to the writer; the director does not rewrite them.
3. **Narration:** use [audio direction](references/audio-direction.md) and [the voice preset](config/narrator-default.json). Calibrate a representative performance, then record one continuous file per scene. Measure and prepare the selected audio before final timing.
4. **Director, timing:** map actual spoken developments to visible actions, explanations and connected states. Preserve the story and recorded audio; revise insufficient visual coverage through the existing director stage before final timing. Each scene has at least three meaningful cuts, including at least two purposeful subsecond inserts. Follow [the director's timing guidance](references/director.md#after-narration-finalize-timing) for readable movement, narration alignment and longer coverage.
5. **Image prompt writer:** use the single [image template](templates/image.md) to resolve angle, perspective, appearance, framing and a useful opening phase for each directed cut. Generate/select GPT stills through the creator's route, register/place them, and pass actual selected images forward. The requested GPT label does not establish the actual backend alias; record what the tool exposes.
6. **Animation prompt writer:** use the single [animation template](templates/animation.md), actual selected image and directed cut to resolve action, physical force and camera movement. Animate with installed MiniMax and place completed selections promptly.
7. **Same director, assembly/review:** inspect the actual retained sequence against the story, speech and treatment; assemble sound and picture and deliver the full export with honest evidence limits. No separate automatic reviewer or provider-facing review checklist is required.

New snapshots use the director-first workflow. Frozen v2 projects retain their recorded order. In managed VibeCut, the project-wide storyboard task supplies the treatment before audio; later scene storyboard tasks finalize timing. The app stamps the treatment basis and rejects downstream changes to its words/events. For direct file work preserve IDs/revision and the current schema; do not copy portable planning JSON over project.json.

# Director verification
- Before recording, compare the director output with the writer input: story, full narration and ordered scene words must be unchanged. If explanation or story logic is missing, return it to the writer and rerun direction on the revised script. Check the staging and performance together: what is revealed, what changes and where action/sound can carry the moment without narration.
- Within the image stage, inspect a representative view's critical layout/contact before using it as the authority for dependent images. Compare actual adjacent stills and individual details at delivery viewing size. Check the shot's first-notice priority, physical connections/support/reach and the action or spatial clue that joins it to its neighbors. Return a failed relationship for image repair; do not accept it because style and identity match or ask animation to reconstruct an impossible base. Keep a planned reach distinct from an incorrect required contact.
- Before batch animation, test the hardest meaningful cause/action/result sequence. Resolve its selected opening, key action and edit-out target against actual footage. An attractive opening frame is not proof that its movement works. A review board may show those targets, but the video model receives only its supported clean inputs, not a labelled grid by default.
- Against selected footage, check cast, geography, ownership, phase, direction/count, support/contact and achieved result. Context and lead-ins may accompany speech; an opposite event or unsupported completed state needs repair. For a crucial change, compare actual before/result cues rather than trusting its label or caption.
- Assess preparation/action/result across cuts and verify each scene's two brief cuts actually help that progression. Avoid repeated hovering and generic reaction coverage. Preserve a motivated hold; trim idle handles and retime a correct complete action only when justified. Native duration, selected range and edit speed are separate records.
- Check actual lighting/material stability, spatial depth and camera intent. Fix a failed view instead of relabeling it. A push-in, shake, glow or bright flash cannot replace a missing event.
- Verify delivery coverage, accepted audio preservation, lineage, dimensions/fps/frame count, full decode and actual picture at cut boundaries. Interpret intentional fades/black separately from export flashes. Listening and native-motion judgments remain pending when unavailable; never bypass a blocked route.

Internal selection is not creator approval: leave the completed film awaiting review. Save originals, rejected attempts, receipts and concrete findings; count jobs once and leave unpriced infrastructure cost unknown. Repair demonstrated failures within scope, not unlimited blind retries.

For important selections record what was checked, the exact image/source range, the observed evidence and any failed or unclear requirement. Image checks establish a usable still; footage checks establish selected-range behavior. Keep planned, observed and pending findings distinct. These checks belong to the existing director role and do not add a stage or require repeated creator approvals.

# Execution boundaries
Higgsfield/Seed handles the saved Holden narration, GPT handles stills, and installed MiniMax handles animation. Do not substitute Qwen images or another video provider. Provider UI/enhancer settings belong to the relevant tool documentation, not every shot prompt.

Read `tools/minimax_h3/AI_INSTRUCTIONS.md` for the installed client, private IAP route, saved jobs and cleanup coordinator. Preserve the VM/services/GPU stack/IAM/network. Inference on the shared GPU is sequential. Keep the idle coordinator running and check its receipt after jobs.

For final motion, start with supported native delivery-size settings and base sampling (the installed guide recommends non-turbo, about 20 steps); four-step 480p turbo is a labelled draft option. Validate the representative sequence before scaling. More steps do not repair wrong staging or guarantee success. Native output audio may supply authorized ambience/effects; inspect and mix it with the separate narration instead of automatically discarding all sound. Register an aligned audio sidecar when the export path does not mix embedded video audio. Never generate extra speech over the accepted narration.

For requested comparisons/refinement, use [template refinement](references/template-refinement.md). Keep first attempts and changed variables visible. Do not claim audience response, improved model quality or independent review without that evidence.
