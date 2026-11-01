# Creator feedback and director-first redesign

## Creator assessment

The creator rated the Apollo 12 result about **4/10**. They found the story clear with a good opening, but the narration boring and slightly too fast. They found the visuals repetitive, insufficiently directed and lacking depth, with people mainly studying screens/reacting and some frames behaving like flat stills. The supplied screenshot highlights the opening's unnatural banded/faceted cloud treatment. This is creator feedback, not an inferred retention metric.

## Audit of what was actually requested

The audit read the saved narration requests, selected-image prompts and all 32 MiniMax request files under project `34dd7600-10be-483d-8b19-4bc92f818408`, plus the local adapter source. No new media was generated for this redesign.

| Evidence | Diagnosis and limit |
| --- | --- |
| S01-B asks for a fixed cabin-relative composition, only fine ascent vibration, small eye/chin scans and no orbit/pan/zoom. | This take was explicitly directed toward restrained micro-reactions. A static result is partly a consequence of the requested content, not proof the model cannot stage action. |
| S03-A asks for a small brow/chin adjustment, no smile or speech performance, a held camera and tiny background movements. | The central recognition was communicated mainly by a label and micro-acting. Similar tasks/views recur across the sequence. |
| S01-A's image prompt includes faceted-human rules despite no visible people, global cabin/Mission Control palette details, repeated design locks and editorial metadata. | Irrelevant boilerplate obscures the current visual job. The useful requirements are flight phase, rocket/world scale, composition, light and a plausible discharge path. |
| Selected narration used native speech_rate 40. Its request repeatedly asks for fast connected momentum. Listening approval was still pending in the production record. | The creator's actual listening feedback now rejects the pace/engagement of this result. Duration and nominal WPM were insufficient acceptance evidence. |
| 27/32 native requests use 864×480, turbo and four steps; five use non-turbo20. | Much of this baseline used draft-like quality settings. This may contribute to fidelity limitations, but it does not prove the cause of every artifact. Increasing quality cannot supply an event the prompt never asked for. |
| Video prompts range from 152–679 whitespace-delimited words, median352.5. | Length alone is not the failure: H3's guide supports detailed descriptions. The issue is what the detail does—useful physical development versus repeated restrictions, state labels and pipeline bookkeeping. |
| The source files and adapter use MiniMaxH3ReferenceToVideo/Ref2VA. The old requests use custom LOOK/START/PHYSICAL JOB/CAMERA/TIMING headers. | The reusable animation writer now uses the official reference-mode structure. This is a justified format correction, not an already measured quality gain. |
| Native video audio was muted and no effects/music were added to the baseline. | Voice alone had to supply nearly all pressure and release. Directed physical sound and quiet can support future sequences; they still need selection and mixing. |

The pasted Qwen enhancer/edit settings were treated as information about a different image-edit workflow. They are absent from the inspected H3 requests. The local adapter passes request.prompt to the reference-video node, with optional embeddings; it does not invoke that Qwen enhancer. There is no evidence here that enabling Qwen thinking or changing its edit steps would repair this film. GPT remains the selected still-image route.

## Research basis and style recommendation

The [official H3 prompt-writing skill](https://raw.githubusercontent.com/MiniMax-AI/MiniMax-H3/main/skills/h3-prompt-writing/SKILL.md) selects a format by actual input mode. The [Ref2VA guide](https://raw.githubusercontent.com/MiniMax-AI/MiniMax-H3/main/skills/h3-prompt-writing/references/ref-en.txt) specifies six ordered sections and concrete visual/audio development; its normal detailed-description range is 350–500 words, with task-dependent exceptions. The redesign removes irrelevant repetition instead of imposing an arbitrary tiny word cap.

[ComfyUI's H3 guide](https://docs.comfy.org/tutorials/video/minimax/minimax-h3) distinguishes local open-weight output near a 768px short edge from hosted2K processing. The installed local guide already recommends base 20–25 steps for final-quality work. New guidance uses supported native delivery-size/base sampling for final motion and labels four-step 480p as a draft option. It does not silently change a VM, service or model stack.

[MiniMax's model description](https://www.minimax.io/blog/minimax-h3) describes broad generation/reference capabilities and natural-data training; it does not establish a ranked easiest/best style. **Cinematic live-action naturalism** with readable daylight, tangible surfaces and foreground/background depth is the next creative baseline, not a certified winner. The next benchmark should test that choice instead of assuming a style switch alone solves directing.

## Implemented flow

Writer draft → director's spoken/visual treatment → scene narration → final timing → GPT stills → MiniMax animation → director assembly/review.

The director may reshape unrecorded speech together with the visual events, emotional development, provisional cuts and sound/action space. They preserve the researched meaning and classification. This permits an expansive launch, a quick interruption and urgent responses even when narration does not name every movement. The spoken cue and pictured phase still need to agree.

Final frame boundaries follow the actual selected audio. The timing pass preserves the treated words, performance and cut events; it does not replan the film independently. Recorded speech is protected from silent rewrites. Image composition/angle/appearance stays with the image writer, while continuous camera motion and physics stay with animation.

New snapshots opt in with `director-first-cuts-v3`; frozen v2/source projects keep their existing route. The app adds a project-wide pre-audio treatment task and a distinct progress stage. A treatment basis ties later work to the actual words, event states and performance; the writer cannot forge it. Raw director output is preserved before application stamping. Project-local skill snapshots are preferred when present.

## Simplification and calibration

| Maintained resource | Before → after words, approximately |
| --- | --- |
| SKILL.md | 1943 → 936 |
| references/director.md | 1789 → 840 |
| templates/image.md | 4162 → 729 |
| templates/animation.md | 3127 → 792 |

The templates still instruct the prompt-writing LLM, not the media model directly. Camera composition and motion remain in their respective single templates. Critical continuity, geometry, actual-state checks, evidence limits and source preservation remain. Provider UI configuration and editorial/job bookkeeping stay outside shot prompts.

Holden remains the narrator. Rate30 is the provisional starting point with a bounded slower comparison such as 20 when rushed. The soft planning range is 155–180 WPM, with action-specific delivery and intentional non-spoken space. The live Seed catalog still exposes speed/pitch/loudness rather than a separate emotion control; an audition, not a faster file or an emotion label, must establish the performance.

## Validation

The application suite passes 77 tests, including a full protocol-media run through treatment before audio and timing afterward, v2 compatibility, recorded-speech protection, factual-classification preservation and downstream event locking. The build passes. These fixtures test orchestration/lineage, not creative acting or perceived cinematic quality.

The updated skill passes validation and local link/anchor/JSON checks. All 24 files in the Apollo 12 skill snapshot retain their original hashes and the benchmark manifest remains revision 71. Its corrected export and historical attempts remain intact. The new creative guidance has not yet been tested through a new generated film.
