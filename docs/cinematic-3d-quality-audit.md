# Storytelling quality, timing and continuity audit

Reviewed baseline: `6cebca3`. This report records findings and proposed changes; it does not implement them or change any existing film, project snapshot, provider job or service. The four supplied screenshots are visual references, not instructions or evidence of native motion.

## Decisions from the creator's clarification

- Keep an existing project's skill version frozen. A stable tested skill is the goal; new versions apply to new work, with an explicit upgrade only when an existing project needs one. Automatic global refresh is not a fix.
- The director owns events, causal states, scene/cut membership and editing intent. Image and animation prompt writers realize the supplied cuts. They can report an unfilmable or missing beat to the director, not silently change the sequence.
- The image prompt writer owns the shot's concrete angle, viewpoint, framing, expression, appearance and usable opening phase. The animation prompt writer owns movement, force, camera travel and continuation from the selected image.
- The same director checks generated selections against story and narration. A shared plan reduces intended contradictions; it cannot guarantee that a stochastic media model performed the planned action. No additional automatic reviewer agent is needed.
- Script comprehension and attention belong to the writer. A later director cannot repair missing explanation by hiding it in visual notes. The writer should revise the actual spoken text before narration.

## Active-file audit

| File | Finding / proposed disposition |
| --- | --- |
| `SKILL.md` | Keep workflow, stage ownership and final director verification. Consolidate repeated board/ending/continuity/evidence checks into one stage-specific procedure. The lowercase “can…” and “briefly…” paragraphs are leftover fragments of moved output lists. Distinguish script acceptance before audio from final film verification. |
| `templates/script.md` | The telling-angle, conversational-hook, concrete-detail and fiction-commentary guidance is repeated in the saved-preferences preface and writer prompt. Consolidate each principle once while retaining useful nuance. “Trust the listener” must apply after the necessary relationship is explained, not license missing mechanisms or orientation. Preserve meaningful scientific uncertainty when it changes the explanation; distinguish it from repeated commentary about staging an imagined trip. |
| `templates/image.md` | The top fixes cut IDs/events, but “Give a separate cut…”, “combine phases…” and “Build scenes…” still assign sequence planning to this role. Convert these into recommendations returned to the director. The input and output ask for camera attachment/path/end-view before the animation role has resolved them: retain opening composition and available movement space here; animation supplies its path. Several paragraphs repeat low-poly/full-scale/not-toy guidance. Merge those into one resolved style section. The per-cut response currently repeats scene-wide geography and coverage records; reference unchanged plan records and return the cut-specific additions instead. |
| `templates/animation.md` | Keep explicit action/contact/response and camera attachment/look-at/focus separation. Consolidate repeated movement motivation, mechanics, natural-speed and reference-scope paragraphs. “Describe only subjects actually visible in the input” is too broad: it can conflict with a directed entrance. Preserve the zero-unplanned-subject rule for empty inserts while permitting an established offscreen participant to enter from a known route. Add an explicit editorial timing/retiming policy instead of relying on “natural speed” alone. |
| `references/director.md` | Keep one authoritative action/state/cut plan. The prose, artifact table and reusable instructions repeat the same duties; a concise decision procedure plus one record contract can carry them. Add the beat's audience effect and necessary visible development without moving angle/lens prescriptions back into the director. Add narrative timing versus action time versus edit time. Preserve a minimum of three meaningful cuts per scene without equal-length or per-verb subdivision. |
| `contracts/production.md` | The shot fields and expanded direction artifact are described in several locations. Make this the authoritative storage/handoff shape and have role templates consume it. Record whether fields are director-owned or image/animation additions. Add explicit previous/current/next context, source selection, playback rate and deliberate time treatment. Keep actual media evidence distinct from planned states. |
| `references/audio-direction.md` | Useful performance guidance, word fidelity and pause checks should stay. Repeated urgency/expression/pace directions can be consolidated. Historical Holden take observations and unrelated model comparisons are candidates for evidence/adapter notes rather than every narration task. The 1.10–1.20× example exceeds the saved 1.15 maximum; resolve the precedence. This audit does not request a narrator speed change. |
| `config/narrator-default.json` | Keep the accepted voice and settings. `tempo_edit.default_factor` is 1.0 and maximum is 1.15; the helper defaults differ. Use one clear default/policy source. |
| `scripts/prepare_narration.py` | `--tempo` defaults to 1.15 and accepts 0.9–1.3, whereas saved policy defaults to 1.0/max 1.15. Align the default and distinguish explicit override from normal policy. Pause-only preparation should not accidentally speed articulation. No helper change is made in this audit. |
| `scripts/blocking_previs.py` | Retain. It provides genuinely useful coarse geometry/projection checks and already states its limits. No reason found to remove it. A computed guide is not proof that an image or video obeys it. |
| `references/template-refinement.md` | Retain for specifically requested comparisons. Its writer-review prompt still asks whether every shot is a continuous view, although the writer no longer returns shots. Scope writing evaluation to the story; assess shot records in the director's normal workflow when they exist. |
| `agents/openai.yaml` | Retain the discovery metadata. It is short and does not duplicate the detailed contracts. |

Ten Markdown compatibility redirects and the unchanged old narrator JSON snapshot are not active duplicate prompt libraries. Retain them for saved callers until a deliberate compatibility cleanup. The historical proposal in `cinematic-3d-workflow-refactor-plan.md` is a record, not a new generation instruction.

Some repetition across the two standalone LLM templates is intentional: each role must know reference scope and state continuity, and each resulting provider request needs its actual style/design instructions. Deduplicate repetition within a role; do not remove essential context merely because another role also needs it.

## App alignment

The app here is VibeCut / `vibe-video-codex`. `shared/project.ts` already gives image/video prompt strings empty defaults. The blocking requirements are mainly runtime validation and instruction text in `server/codex.ts`, `server/handoff.ts` and the copy-context route in `server/index.ts`. `server/production.ts` queues audio, images and video without a director stage.

Proposed progression:

1. Save the complete story and exact narration scenes; visual prompts can be absent.
2. Generate/measure authorized narration.
3. Save the director's cut/state plan against that measured audio.
4. Write current-cut image prompts, then generate/select stills.
5. Write animation prompts using the actual selected stills, then generate/select video.
6. Director assembles and verifies the film.

“Optional at draft time” must not mean “silently optional at execution.” Require a resolved image prompt when generating that image and a resolved animation prompt plus its actual selected image when generating video. Preserve intentional still-only and source-rerender workflows. Frozen project skill copies remain deliberate; do not globally replace them to implement this flow.

## Generation length, action time and edit length

The local wrapper source `tools/minimax_h3/app.py` accepts duration values below four seconds and rounds frame counts to a `17k+5` grid. Its documentation in `tools/minimax_h3/AI_INSTRUCTIONS.md` describes approximately 5–15 seconds as the trained range and five-second requests producing 124 frames at 24 fps, about 5.17 seconds. Thus four seconds is not a verified hard minimum for this installation. Shorter API acceptance is not evidence of useful generated motion. These are local source/documentation findings, not a live endpoint or short-duration quality test.

The editor already has playback-rate controls: `shared/project.ts` and `src/components/controls.tsx` allow 0.25–4×; `server/export.ts` applies the clip speed to video while the continuous scene narration is supplied separately. A new generic speed feature is not the first prerequisite.

Keep three times distinct: native generation duration, duration of the useful source action, and selected editorial duration. Use the complete useful action interval, trim idle lead/tail, then apply a justified rate adjustment when appropriate. For example, about 1.2 seconds of good action played in 0.8 seconds needs 1.5× speed. Playing an entire five-second take in 0.8 seconds is a different, much more aggressive operation and exceeds the existing editor limit.

The words “he walked over and picked up the key” do not mandate a cut per verb or force both actions into the exact duration of that phrase. Narration can lead the motion, span several views or accompany an already-started action. Preserve causality and readable completion; do not create unnecessary subsecond jobs just because a phrase is short.

Proposed pacing policy:

- Default to purposeful real-time action; natural event speed and camera smoothness are separate.
- Ask for the required beat in the intended useful interval, with a readable starting phase and endpoint. A native model handle is not the intended shot duration.
- Trim idle time first. Retiming is allowed for demonstrated slow cadence or a deliberate editorial treatment, provided contact, support, action completion and viewing readability survive. Record the chosen source interval and rate; do not speed accepted narration to fit footage.
- A source with the wrong action, broken contact or missing result does not become correct by speeding it up.
- Use additional meaningful detail, reaction, travel or consequence cuts to cover longer narration. Do not fill it by slowing, looping or duplicating the same event.
- A briefly time-expanded fast-object insert can be intentional and expressive. Label that treatment, keep it local and return to the scene's ordinary rhythm; distinguish it from accidental slow motion throughout the film.

## Expressive coverage from the supplied references

The low seated-character frame uses a very low viewpoint, foreground foreshortening, elevated placement and silhouette to suggest dominance. The tank frame uses proximity and a large body in the foreground for scale. The muzzle/detail and projectile frames isolate a critical interface and a moving object. Their contribution is the relationship among audience position, scale, attention and phase, not merely “add a camera move.” The screenshots do not prove weight, acceleration, impact or successful animation.

General direction rule: choose the audience response and new information first. For example, the director can request a dominating arrival or a forceful decisive action. The image writer then chooses the vantage, composition, silhouette, expression and scale cues; the animation writer chooses motion and camera behavior. Keep camera prescriptions in those templates.

For connected action, choose useful phases such as setup, anticipation, release/contact, travel, consequence and reaction. Use only those that earn coverage. A firing-to-flight-to-impact sequence continues one event: preserve its origin, trajectory, participant/prop identity and result instead of generating another launch in each angle. A muzzle discharge belongs with release; the later impact belongs at the established destination. These examples explain coverage, not a mandatory tank sequence or genre/style change for future briefs.

## Adjacent-cut context for the LLM prompt writers

Provide the same scene/world version and a compact packet:

- **Previous:** actual selected outgoing state when available; position, direction, held objects, action phase and screen attention. Before generation, label this state planned rather than observed.
- **Current:** cut ID, exact narration/window, visible development, audience effect, incoming state, chosen starting phase, intended change and outgoing state; selected image for animation.
- **Next:** required incoming state and joining requirement, with its intended time relationship. Include the next event as editorial context only.
- **Timing:** intended edit interval and pace/time treatment; native generation constraints separately; actual source selection and rate once known.

The LLM uses neighboring context to preserve the join, but compiles only the current cut's visible state and permitted event into the provider prompt. Full next-cut prose can otherwise invite future props/actions into the current shot. A next shot's need for an object to be held is a current outgoing-state requirement, not permission to replay a pickup.

## Writing acceptance and validation before media

Strengthen the writer's existing revision step around comprehension rather than adding more banned phrases. Read the uninterrupted speech as a first-time listener: what is happening, who/what carries it, why does the current change occur, how does the important mechanism work, and what answer follows? Identify the actual sentence that supplies each necessary connection. If it is absent, repair the spoken text before audio. A hook is not sufficient if the explanation then becomes a sequence of topic headings. Preserve factual grounding and uncertainty that matter to the explanation; avoid production commentary interrupting the premise repeatedly.

Evaluate the revised writing prompt on more than the Jupiter example. Use an unfamiliar factual event, a mechanism explainer and a speculative journey, without supplying the Mona Lisa answer as a pattern to copy. Separately exercise an allowed contextual/anticipatory visual pairing, a genuinely contradictory pairing and adjacent cuts sharing one action. A text-only pass tests decisions and contracts; motion/pace still need actual selected-footage review when playback is available. No paid generation is requested by this audit.

Suggested implementation order: first deduplicate and fix writer/role ownership; second add adjacent-cut context, expressive intent and timing policy; third align app stage validation/queueing while preserving snapshots; then evaluate text behavior and authorized footage. Keep each implementation group in a separate commit. No global skill refresh, extra automatic reviewer or blanket speed multiplier is proposed.
