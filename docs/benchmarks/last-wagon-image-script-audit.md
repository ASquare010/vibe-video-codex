# Last Wagon: image, script and skill audit

Checked 2026-11-01. Project `99e496a2-6745-482f-8d92-8390efee472a`, revision31 at inspection: 157 narrated words, ten cuts, 62.5 seconds. Scope is diagnosis and research. No media was regenerated, no live production was changed, and no external skill was installed. No native playback or listening judgment is claimed.

## Finding

The major defect is an unreliable physical scene carried into polished images and then animation. Style, facial identity and texture are comparatively consistent. Wagon alignment, mechanical placement and useful body contact are not. Another style adjective or a longer user prompt will not establish those relations.

The script has a clear immediate predicament, a failed attempt, an intelligible complication and an ending. Its weakness is converting a plausible-sounding operation into an executable, connected visual event. Existing guidance already discusses geometry and returning wrong stills for repair; this run did not reliably apply it. Treat this as both an execution failure and a weakness in how the skill makes acceptance concrete.

## The supplied images

| User image | Selected source | What can be concluded |
| --- | --- | --- |
| 1: tunnel close-up | [S01-10](../../data/projects/99e496a2-6745-482f-8d92-8390efee472a/media/S01-10.png) | This isolated portrait does not establish a railway-layout error. One track inside a tunnel is legitimate. Its position and viewing direction must agree with the adjoining shots. Avoid rejecting every attractive portrait simply because other shots fail. |
| 2: yellow lever | [S01-06](../../data/projects/99e496a2-6745-482f-8d92-8390efee472a/media/S01-06.png) | Major layout failure: a coupler-like bridge links the apparent flank of the red wagon to the teal end, while the long bodies read as parallel. The end-to-end train relation and shared rail alignment are not convincingly present. A gloved hand on a lever does not make the assembly physically valid. |
| 3: wide viaduct | [S01-01](../../data/projects/99e496a2-6745-482f-8d92-8390efee472a/media/S01-01.png) | Establishes colors, cast, fire and tunnel. The key connection is partly obscured and the curve complicates interpretation; this is an insufficient geometry reference for the close mechanical views. Single track means one pair of running rails, not two separate tracks. |
| 4: handbrake | [S01-07](../../data/projects/99e496a2-6745-482f-8d92-8390efee472a/media/S01-07.png) | Repeats the incompatible wagon arrangement. The work plane, torso facing, hand contact and force direction are poor foundations for a forceful two-handed crank. It does not deliver the requested clear two-hand wheel contact. The problem is action staging, not simply an insufficiently shocked face. |

The original [S01-03](../../data/projects/99e496a2-6745-482f-8d92-8390efee472a/media/S01-03.png) also has Mara gripping the fixed rail rather than the intended release handle. These are still-image observations, not proof of how every animation frame moves.

## What actually went to the generator

[Exact image-generation calls](../../evaluations/last-wagon-image-script-audit/actual-image-invocations.json) were recovered from the benchmark's own production log. The thread-reading tool could not return its oversized turn, so only relevant image tool inputs were extracted from its identified local log. No hidden reasoning was copied. [Evidence and source hashes](../../evaluations/last-wagon-image-script-audit/evidence.json) preserve the audit basis.

1. A wide first image was generated with no separate layout guide.
2. Shots02–10 were generated in three concurrent groups, all using that first wide image as their sole image reference. This preserves an appearance cue, but does not supply a checked mechanism or new viewpoint geometry.
3. Actual prompts did request facing platforms, connected wagon ends, supported boots and hand contact. The generator failed some of those requests. Do not diagnose this as merely forgetting to write the words.
4. The source for Shot07 requested both hands on a chest-height wheel. The selected output did not clearly provide that. Written director observations acknowledge wrong starting contact in Shots03/07 and direct animation to reposition the hands. A deliberate reach is valid when planned and timed; it is not a repair for incompatible wagon geometry.
5. Image06 was locally corrected for a misplaced background tunnel and lever orientation; Image10 was corrected for fire inside the tunnel. These repairs preserved the surrounding geometry instead of first establishing whether that geometry was valid.
6. The ending had a separate image repair. The audit distinguishes these real repairs from initial success; it does not erase them from the benchmark.

The `project.json` asset provenance records a shorter planned imagePrompt, while some actual invocation text is more detailed. A faithful request ledger should preserve the expanded provider input and actual attached files together. A selected image's output receipt alone does not provide that information.

## Writer and director weaknesses

| Concern | Evidence in this run | Improvement to evaluate |
| --- | --- | --- |
| Goal and danger can be more explicit | The opening names fire and tunnel; the desired separation emerges through the operations. | State the consequence and Mara's objective once in plain speech, then develop the attempt. Avoid repeating that the situation is dangerous. |
| Causal narration is stronger than executable staging | Release, slack, brake and jump form a readable verbal chain, but the physical shared design was never established. | The writer checks the story's causal logic; the director checks whether the action can exist in one consistent world. Resolve questionable mechanisms in production research/design before commissioning images. |
| Critical transition is assumed | Mara goes from the teal release handle to the red handbrake, then jumps back. Her first crossing is not covered by its own development. | Decide whether to show that crossing or make the ellipsis unmistakable. A new scene/cut quota is not the solution. |
| Deadline stops developing in the middle | Tunnel danger is introduced, followed by operations and reactions; the final approach carries most of the payoff. | Renew the visible proximity/obstacle when it changes her choices. No mandatory countdown or arbitrary cut frequency is needed. |
| Wording follows operations closely | Most sentences recount an action and then its result. | Retain the clarity but vary anticipation, decision and consequence; let selected physical action occasionally carry the development without speech. Do not add hook gimmicks or a forced CTA. |

These are editorial findings from the written treatment and stills. They are not measured retention findings or a listening assessment. A fictional mechanism can be simplified, but its rules and placement must remain consistent. No real-world railway procedure has been validated here.

## Existing guidance versus execution

The maintained image template already requests contact paths, supports, stable world landmarks and a blockout where useful. The production contract already calls for geometry evidence on sensitive action, and the director guide says a wrong opening image returns to the image stage. Adding the same instructions again is unlikely to solve this.

Two execution weaknesses are demonstrated:

- `dump/last_wagon.ts` builds the draft, cuts and image prompts together, saves only the skill entrypoint, and writes `directorBasis: last-wagon-treatment-v1` directly. There is no `skill-snapshot` directory or saved raw director result in the inspected project. This is weaker evidence of a separately completed director treatment than the managed application supplies.
- A read-only call to the application's current `directorTreatmentIssue()` reports that the project's treatment is not certified by its expected basis. Direct ProjectStore writes were able to proceed outside the managed production checks. This does not prove that no creative thought occurred; it proves the stored marker is not the app's validation evidence.

The skill's roles should remain writer → director → image → animation, with final verification by that same director. A script that names all four roles or writes a treatment JSON is not by itself evidence that their required work happened.

## External skills: popularity and fit

Counts below are the live Skills.sh listing values observed on 2026-11-01, not unique active users, film quality scores or a global ranking. Repository stars are not per-skill adoption.

| Skill | Observed installs | Recommendation |
| --- | --- | --- |
| [OpenAI imagegen](https://www.skills.sh/openai/skills/imagegen) | 5.9K | Strong relevant starting point; already available locally. Its [prompting source](https://github.com/openai/skills/blob/main/skills/.system/imagegen/references/prompting.md) covers explicit input roles, structured complex requests and narrow edits. It is not a multishot scene-geometry solver. |
| [AgriciDaniel / Claude YouTube](https://www.skills.sh/agricidaniel/claude-youtube/youtube) | 535 | Useful source to study audience promises and diagnosing attention. Its [script module](https://github.com/AgriciDaniel/claude-youtube/blob/main/skills/claude-youtube/sub-skills/script.md) assumes long-form sections and CTAs that do not fit this minute-long fictional thriller. Do not import it wholesale. |
| [ravsau / youtube-script](https://www.skills.sh/ravsau/youtuber-skills/youtube-script) | 24 | Smaller adoption signal; prescriptive minute maps and timed pattern interrupts are a poor match for this film. |
| [Remotion best practices](https://www.skills.sh/remotion-dev/skills/remotion-best-practices) | 723.0K | Much more widely installed video skill, but for React-based video construction and rendering. It will not correct GPT poses, coupling design or narrative staging. |

Also reviewed [TheCraigHewitt's script structure source](https://github.com/TheCraigHewitt/skills/blob/main/youtube/script-structure/SKILL.md). Writing for the ear and making each development earn the next are useful. Fixed long-form retention intervals are not universal film rules. No verified most-popular cinematic YouTube storyteller was established by this search.

Some directory mirrors returned much larger counts for frontend image skills. Their actual instructions concern horizontal website sections, not portrait action film frames. Those counts do not justify selecting them for this problem.

## What primary practice supports

[OpenAI's image guide](https://developers.openai.com/api/docs/guides/image-generation) explicitly acknowledges recurring-subject consistency and precise composition limitations. [Its prompting guidance](https://developers.openai.com/api/docs/guides/image-prompting) supports concrete subjects/composition, explicit reference roles and controlled iteration. Better wording helps, but cannot guarantee the generated structure.

[Disney Animation's layout practice](https://www.disneyanimation.com/process/layout/) establishes scene staging and camera work as part of storytelling before final polish. The transferable lesson is to settle the space and readable performance before treating a beautiful frame as a completed shot. This is compatible with our existing director/image responsibilities; it does not require another agent.

[YouTube's own guidance](https://support.google.com/youtube/answer/16559650?hl=en) emphasizes delivering the title/thumbnail promise, maintaining anticipation and checking actual audience response. It does not justify universal retention percentages or a compulsory cut every few seconds. The community reference [retention guide](https://github.com/AgriciDaniel/claude-youtube/blob/main/skills/claude-youtube/references/retention-scripting-guide.md) contains numerical claims whose supporting studies were not established here; those are not adopted as evidence.

## Recommended next change, in order

1. **Make one valid world before polishing its shots.** Director owns train order, path, platform adjacency and mechanism states. Image role resolves the camera and a simple verified layout/pose guide for each difficult view. A shared track centerline and end-mounted connection must survive viewpoint changes. This is not the writer choosing lenses.
2. **Use references by purpose.** Character/design reference for Mara; a checked layout or blockout for geometry; a mechanism/pose reference where contact matters. Do not use an unverified wide beauty frame as the only source for all three. The existing box-based blocking helper can help with vehicles/camera but cannot certify elbows, grips or mechanism function.
3. **Change image acceptance.** Before animation the same director must be able to trace bodies → facing ends → connecting part → wheel/rail support, and torso → arm → hand → actual contact. If a critical relationship is wrong or hidden, repair the still or change the view. Do not defer an impossible starting state to animation.
4. **Separate repair scopes.** A hand-only correction must preserve a valid base. An invalid arrangement needs a corrected layout and a new image composition; preserving everything else preserves the defect. Validate the corrected output rather than its prompt.
5. **Close the execution bypass.** Direct production helpers should use the same treatment validation and saved-skill resources as managed production. Preserve exact image requests/reference paths, not only abbreviated plan prompts.
6. **Benchmark the small hard sequence first.** Compare the failed lever/brake arrangement with a guide-driven corrected version, then test one complete action at native cadence. Measure critical relationships satisfied and what repairs were required. Do not regenerate another whole film to discover the same layout problem.

No model/style superiority, prompt-length optimum or successful repair is claimed by this audit. The current task produced research and evidence, not another paid benchmark. Proposed changes should remain short additions to the existing owners, not another scattered collection of templates.
