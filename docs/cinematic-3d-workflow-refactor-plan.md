# Cinematic 3D workflow: audit and staged refactor

Status: file organization completed after the audit; runtime and quality fixes remain deferred. The historical audit/proposal below is retained. The creator's subsequent ownership clarification takes precedence over its camera/review recommendations.
Baseline: `1bb975b` (`Checkpoint current cinematic 3D storytelling workflow`).
Scope: the current `video-skills/cinematic-3d-storytelling/` workflow. Preserve later camera, geometry, force, audio and review improvements. Do not change the completed Mona Lisa film or run media generation as part of this refactor.

## Completed organization pass

The creator requested organization before issue fixes: the writer handles research and spoken story only; image-stage files own camera angles, audience perspective and appearance; animation-stage files own camera movement. The director owns events and continuity, then returns for final verification through `SKILL.md`. No final-verification request is appended to generation prompts and no separate automatic reviewer role is introduced.

Follow-up clarification: each creative template instructs the **LLM that writes a prompt for a supplied cut**. It is not itself the payload sent to GPT images, MiniMax or another media model. Image composition/layout now live inside `templates/image.md`; camera motion/physics live inside `templates/animation.md`. The provider-facing layouts within those files describe the output the LLM must resolve. SKILL.md routes prompt writing separately from actual authorized generation and verification.

| Maintained home under `video-skills/cinematic-3d-storytelling/` | Content |
| --- | --- |
| `SKILL.md` | Workflow, scope, role routing, continuation, provider limits and the director's verification duties. |
| `templates/script.md` | Existing research/writing craft, exact speech, scene text and the spoken-story record; no shot-planning deliverable. |
| `templates/image.md` | Single LLM prompt-writer template: cut inputs, composition, camera angles, perspective, appearance, layout and output prompt structure. |
| `templates/animation.md` | Single LLM prompt-writer template: cut/image inputs, subject action, force, camera movement, native/edit duration and output prompt structure. |
| `references/director.md` | Existing story-to-event direction, persistent world, choreography, timing evidence and cut states. |
| `references/image-composition.md`, `image-layout.md`, `camera-motion.md`, `animation-physics.md` | Compatibility redirects to the corresponding sections inside the two LLM templates; no separately maintained guidance. |
| `references/audio-direction.md` | Existing model-aware speech/performance and narration preparation; updated links. |
| `references/template-refinement.md` | Existing creator-requested script/template evaluation and comparison procedure; not an automatic production-review role. |
| `contracts/production.md` | Stage records, state/evidence/lineage fields and app storage mapping. Camera fields store image/animation outputs. |
| `config/narrator-default.json` | Canonical unchanged Holden settings. |
| `scripts/` and `agents/openai.yaml` | Unchanged executable helpers and skill metadata. |

Ten old Markdown paths remain as short compatibility redirects for saved project instructions: `story-engine.md`, `visual-prompts.md`, `action-direction.md`, `camera-and-layout.md`, `output-contract.md`, `quality-review.md` and the four combined-guide paths listed above. The old `references/narrator-default.json` remains an unchanged compatibility snapshot for saved callers; new maintained guidance points to `config/narrator-default.json`. Thus there are 12 maintained role/support files and 11 compatibility files, 23 total excluding ignored bytecode. There are exactly three creative template files.

This pass relocated existing guidance, split mixed passages, adjusted ownership labels and repaired links. Writer shot fields moved to the director/production record; camera details moved to image/motion guides; existing final-review material moved to the skill. It did not rewrite the story engine to address the Jupiter quality findings, implement the minimum-three-cut readiness check, add a semantic contradiction gate, change app stages or refresh saved project snapshots. Those remain the next work.

Preservation and validation: compare against baseline `1bb975b`; retain all 95 original prompt slots and all 10 external source URLs; retain the narrator values, both helper sources and agent metadata unchanged. Check local Markdown links, fenced JSON and code-fence balance. The bundled skill validator is now available through the existing `.venv/Scripts/python.exe` environment, whose installed PyYAML avoids any dependency installation. These structural checks do not establish story quality, physical motion or cross-stage semantic reliability.

## Historical audit and proposal

## Creator requirements

- One scene retains one continuous narration asset and contains at least three distinct cuts. Cuts need useful functions; do not fill a quota with duplicates or equal-duration holds.
- Writer/narration role: develop a clear hook, understandable events or explanation, connected speech and an earned outcome, then generate and measure authorized narration.
- Director role: own the persistent environment, cast, objects, physical actions, sequence of states and cuts around measured audio. Establish what happens before image prompting.
- Image role: realize the director's cut using the image template, selecting concrete composition, expression, camera and one usable action phase. Preserve the directed event and geography.
- Animation role: animate the actual selected image through the directed change using the animation template. Express relevant support, acceleration, force, contact, response and recovery.
- Three separate creative templates: script, image, animation. The skill routes the workflow and defines stage boundaries. Supporting guidance, contracts, settings and scripts have distinct homes.
- Contextual visuals, anticipation, reaction and deliberate time offsets are allowed. A contradictory action or state is a defect, not creative freedom.
- Work incrementally with reviewable commits; preserve existing improvements and report limitations honestly.

## What the current files actually do

The broad narration-first flow is already in `SKILL.md` under “Workflow and units.” `action-direction.md` already describes a director, persistent world, causal states and physical choreography. `camera-and-layout.md` contains later geometry, camera attachment, scale, force and blockout guidance. `visual-prompts.md` contains both image and MiniMax templates, plus another coverage planner. These resources should be reorganized with their useful content preserved.

All twelve maintained files were read: the entrypoint; seven Markdown references; narrator settings; two Python helpers; agent metadata. Ignored Python bytecode is not a maintained skill file.

### Findings

| Finding | Evidence | Consequence / repair direction |
| --- | --- | --- |
| Coverage has overlapping owners. | `story-engine.md` asks for nested shot records; `action-direction.md` replaces provisional writer coverage; `visual-prompts.md` asks its planner to return world, coverage map and cut records again. | A later stage can reinterpret the event. Give final cut/state ownership to the director; image and animation roles report conflicts back rather than silently rewriting it. |
| The app's planning contract conflicts with measured-audio direction. | `server/codex.ts` requires standalone image/video prompts in a plan result and rejects plans without them. `server/handoff.ts` and the copy-context text in `server/index.ts` also request prompts in the initial whole-film draft. | Changing templates alone will not implement the requested flow. Later revise app instructions and validation together; distinguish provisional story intentions from ready-to-submit prompts. |
| The automatic queue has no explicit director stage. | `server/production.ts::nextProductionTask` selects audio, then images, then videos. | Add a director handoff/readiness step after measured audio before commissioning stills. A renamed file is not a working stage. |
| Current skill files are not automatically the project's saved instructions. | `server/index.ts` copies a catalog skill into a new project; `shared/project.ts` stores `skill.content`; `server/codex.ts` embeds that stored content in job instructions. The Mona Lisa project's normalized stored entrypoint differs from the current entrypoint and lacks its camera/layout reference. | Use an explicit versioned refresh policy for future/continuing work. Preserve historical snapshots, submitted requests and accepted media. Do not silently overwrite every project. A snapshot mismatch does not prove what an earlier agent read. |
| Contradiction review is mostly implicit. | Existing references discuss continuity, semantic windows and before/after states, but do not require a per-cut comparison of narrated action against planned and observed action. | Record the intended audio/visual relationship and actual actor/action/object/state evidence. Check it before images, after still selection, after video selection and in the assembled scene. |
| Three cuts per scene is a new requirement. | Current visual planning says “Do not return a fixed cut quota”; the schema allows an empty `shots` list. | Apply the minimum at direction/readiness for this workflow, not globally to unrelated skills or old projects. Regroup overly brief new scenes before recording rather than padding or accelerating footage. For accepted inputs, flag an infeasible constraint instead of silently changing audio. |
| Existing prose rules did not prevent the supplied Jupiter draft. | The writer and review guides already reject fiction/realism interruptions and require concrete explanation. The supplied text nevertheless says “Without that fiction, this trip ends here” and repeatedly comments on how it is illustrated. | Treat this as an observed output failure, not proof the relevant rule is absent. Strengthen output acceptance and verify which version/references a future writer actually receives. No claim is made about the unknown prompt/version that generated this excerpt. |

The Jupiter excerpt also shifts between “our capsule” and “you” without a stable audience position, repeatedly announces descent without consistently explaining what the new material means, and ends on an abstract “harder idea.” A useful repair would supply the missing orientation and explanatory connections, then a concrete answer to the opening promise. This is an editorial assessment of the supplied text, not a fact-check, listening test or rewritten script. Preserve scientifically meaningful uncertainty where it changes the explanation; avoid repeated commentary about producing a fictional visualization.

## Proposed ownership and file categories

| Category | Proposed home | Existing content to preserve/move |
| --- | --- | --- |
| Workflow, scope, defaults and stage routing | `SKILL.md` | Current authorization, provider, resume and evidence limits; concise role order and stage acceptance. |
| Script generation | `templates/script.md` | `references/story-engine.md`; writer owns exact speech and story constraints, director owns final cuts. |
| Still generation | `templates/image.md` | GPT template and image-specific guidance from `references/visual-prompts.md`. |
| Animation generation | `templates/animation.md` | MiniMax template and motion-specific guidance from `references/visual-prompts.md`. |
| Director's instructions | `references/director.md` | `action-direction.md` plus coverage planning now repeated in `visual-prompts.md`; one authoritative plan. |
| Audio performance and preparation | `references/audio-direction.md` | Keep provider-aware delivery, word fidelity, measured timing and isolated-pause checks. |
| Camera, layout and physical guidance | `references/camera-and-layout.md` | Keep the later camera/geometry/blockout/scale/force work; templates consume relevant details. |
| Output and stage handoffs | `contracts/production.md` | `references/output-contract.md`; add role ownership, versions and audio/visual relationship evidence. |
| Stage review | `references/quality-review.md` | Keep independent evaluation, actual evidence and pending playback distinctions. |
| Narrator settings | `config/narrator-default.json` | Move the unchanged Holden settings; repair its callers together. |
| Executable helpers | `scripts/` | Keep both existing helpers; no functional rewrite for a folder cleanup. |
| Skill discovery metadata | `agents/openai.yaml` | Preserve metadata and update routing language when the new flow exists. |

This is three creative generation templates, plus director/audio guidance and shared contracts. Do not merge narrator settings, implementation scripts or model/API operating instructions into those templates. Keep old paths temporarily as short redirects only if caller inspection shows they are needed; avoid maintaining duplicate full templates.

## Director handoff and contradiction check

Use a versioned plan carrying script/audio hashes, scene/cut IDs, measured intervals, exact relevant narration, shared world/reference versions, participants, action, object ownership, incoming state, selected opening phase, intended change, outgoing state and visible completion evidence. Camera intent belongs to the director; the image role resolves its concrete view without changing the event. The animation role receives the same cut revision plus the selected image/hash and observed starting state.

For each relevant phrase/cut record whether the picture is direct depiction, context, anticipation, reaction, retrospective coverage or an intentional ellipsis. Record why that relationship fits and which event/state must remain true. A hand beginning to reach can lead the narrated grasp; a picture of the same person closing the same door during a narrated forced entry conflicts unless the temporal relationship is deliberately established. No requirement to synchronize every verb to one syllable or to illustrate every spoken noun.

Image and animation agents must not repair a bad input by quietly redefining the event, inventing a new person/prop or rewriting accepted speech. Return the discrepancy to the owning stage. Review the actual retained interval and its narration together; a strong prompt, good first frame or successful job receipt does not prove agreement.

## Small implementation steps

1. **Checkpoint and audit — this change.** Preserve the current skill exactly and record problems, callers and migration plan. No active workflow rewrite.
2. **Separate files without changing behavior.** Extract the three creative templates, move support files, fix callers and retain useful later additions. Check content preservation and links; commit separately.
3. **Revise workflow and handoffs.** Give each role clear ownership, add the three-cut minimum and semantic agreement checks, remove duplicate planners, improve script clarity acceptance. Commit separately.
4. **Wire the app.** Address initial-draft prompt requirements, director readiness, stored-skill versions and stale generated project guides. Preserve existing projects, approvals, source-video workflows and submitted jobs. Check the changed runtime behavior and commit separately.
5. **Evaluate behavior before spending on media.** Use text-only realistic briefs plus a conflicting-action case and an allowed contextual/anticipatory case. Evaluate script comprehension and cross-stage state agreement, retaining failures and evaluation limits. Independent agents may perform the creator-requested roles/evaluation when appropriate; do not claim a role-based process has been wired into the app before it actually is. Authorize any paid production separately from this refactor.

## Checks and scope of this checkpoint

- All twelve maintained workflow files are saved in the baseline commit; no intentional content changes.
- Markdown relative targets within the skill resolve; both helper sources compile without execution; narrator settings parse as JSON; entrypoint has the required name/description fields; staged whitespace check passed.
- The bundled skill validator could not run because the local Python environment lacks `PyYAML`. The narrower checks above are not a substitute for complete validation or behavioral evaluation.
- App source was inspected, not changed. The checkpoint does not include unrelated existing app changes or other untracked directories. Baseline the relevant runtime files before implementing step 4.
- No generation, audio editing, project migration, provider call, service change or modification to the completed film occurred.
