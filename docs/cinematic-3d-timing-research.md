# Timing and narration research applied to the workflow

Research checked 2026-10-31. These are primary educational/provider sources. Numerical cut budgets below are our worked example, not source-prescribed durations or proof of model output quality.

## Findings and implementation

| Source | Supported principle | Applied change |
| --- | --- | --- |
| [Brooklyn College Film Department glossary](https://userhome.brooklyn.cuny.edu/anthro/jbeatty/COURSES/glossary.htm) | Inserts communicate details/emphasis; matching on action continues a movement across views. | Protect essential brief operations and track the action phase across a cut. |
| [Animation Mentor: staging](https://www.animationmentor.com/blog/staging-the-12-basic-principles-of-animation/) | Composition, attention and consistent screen direction make the scene readable. | Image writer chooses clear contact, silhouette and audience viewpoint using adjacent-cut context. |
| [Animation Mentor: anticipation](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/) | Preparation helps the audience understand an upcoming action. | Allow leading attention/gestures and a useful mid-action opening; do not reset or replay the operation. |
| [Animation Mentor: timing and spacing tutorial](https://www.animationmentor.com/blog/tutorial-animate-with-timing-and-spacing-in-mind/) | Timing contrast and considered retiming affect energy, weight and style. | Separate action/camera pace; allow concise inserts and purposeful holds; review the complete selected movement after retiming. |
| [Toon Boom: animatic curriculum](https://learn.toonboom.com/modules/animatic) | Animatic work includes panel duration, camera and sound timing. | Director saves a timed board/placeholder pass before scaling animation, with provisional status if playback is unavailable. The indexed curriculum was readable in search; direct page access returned 403. |
| [Higgsfield audio guide](https://higgsfield.ai/blog/higgsfield-audio) and live `models_get(seed_audio)` | Seed has free-form audio prompting; the live MCP catalog exposes native speech rate. | Generate faster articulation natively, separate exact speech from scene-specific delivery direction, and check leakage/fidelity. Website UI units differ from MCP units. |

The live catalog exposes `speech_rate` as a whole number from -50 to 100, positive values faster, default 0; `loudness_rate` -50 to 100; `pitch_rate` -12 to 12; sample rates 8000–48000; format and voice ID/type. It does not expose an independent Seed emotion/style/stability/pause-duration control. A speed setting does not prove expression or an exact duration, and no exact percentage mapping is documented. Keep the accepted Holden identity. A new native faster baseline is provisional until measured and listened to; old project copies remain frozen.

## Eight-second coverage worked example

Hypothetical 24 fps scene, 192 frames, before measured speech exists:

| Cut | Frames | Duration | Necessary information |
| --- | --- | --- | --- |
| Approach/geography | 0–71 | 3 s | Person, route, object and doorway relationship. |
| Hand/contact insert | 72–95 | 1 s | Clear grasp and ownership change, continuing the approach/reach. |
| Inside-door reveal | 96–191 | 4 s | Door begins opening from the established state and reveals the next space/threat. |

The short middle cut is not redundant: deleting it can remove the causal fact needed for the next shot. The longer final view earns its time through anticipation and revelation. The one-second value is illustrative, not a target: a brief insert could take about 0.8 seconds, 2 seconds or another duration according to the movement, readability and dramatic purpose. Another brief may need a different order, count or duration. An eight-second narration does not impose equal cut lengths or eight-second native generations.

## Scope and evidence limits

The sources establish film/animation practices, not guaranteed GPT/MiniMax compliance. Our adjacent-cut packet, minimum-three-cut requirement, model-prompt compilation and pipeline readiness rules are engineering adaptations. Sources were not used to claim a universal anime cadence, a mandatory establishing shot in every scene, or a fixed 2–5-second lower bound.

No old film, accepted narration or saved project skill is changed by this research. New native speech settings require output measurement and listening; waveform/ASR checks do not prove acting. Changes to timing rules are structurally verifiable but still need actual production review for perceived rhythm and force.

## Implemented runtime checks

New skill snapshots carry `metadata.workflow: audio-led-cuts-v2`. VibeCut opts only those original-narration projects into the measured-audio director stage; old snapshots and source-video routes retain their existing behavior. Story-only drafts can omit visual prompts. The director stage requires at least three cuts with exact measured coverage, usable state/anchor records and a basis tied to the selected audio version, narration and frame rate. Prompt-writing results preserve those cut IDs, intervals and states. Generated media retains its actual provider prompt. Native generation duration remains separate from edited placement duration.

Media-stage completion leaves the new workflow awaiting review; it does not certify native playback, expression, factual correctness or creator approval. The existing scene text approval field is not used to claim approval of generated motion.

The tests also exercise two reliability fixes: partial results preserve omitted audio/source/settings fields instead of applying schema defaults, and finished video prevents archived preview images from triggering duplicate generation. Synthetic PCM tests verify pause-only sample preservation, protected holds, explicit bounded tempo previews and overwrite refusal. Fixture media tests exercise pipeline state/lineage only; they do not evaluate acting or creative motion.
