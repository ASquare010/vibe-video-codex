# Reviewing and repairing a source-grounded sequence

Use for continuity diagnosis, preparing a repair, or checking generated results. Evidence comes from the actual current edit and source, not a previous agent's summary. Do not launch new generations during diagnosis-only work.

## Build an evidence map

Resolve each current selected clip through scene ID, asset/version ID, source offset, duration and speed. Global edit time includes the durations of preceding scenes; `clip.startFrame` is scene-local. Source time, native-take time and edit time are different clocks. A changed edit may make an old exported film stale; compare its manifest revision before using it as current evidence.

Use `tools/review_sequence.py --project PATH_TO_PROJECT_JSON --scenes N N --out REVIEW_FOLDER` for current source-versus-selected-frame boards and exact timing metadata. On this Windows repo, run Python tools through `.venv/Scripts/python.exe` when present; system Python may lack Pillow. Otherwise locate the bundled workspace runtime rather than reinstalling packages blindly. The tool reads saved files only and leaves the project unchanged. It reports placements that sample beyond the physical video endpoint and explicitly clamps those review samples; this does not repair the edit. Its frames exclude editor overlays and grading; use an actual scoped timeline export if these affect the question. Sparse boards are orientation, not sufficient motion evidence. Use `tools/media_preview.py` for short playable reviews and `tools/motion_flipbook.py` for native frames and onion skins. Read `--help` for the actual interfaces. Use the bundled FFmpeg/runtime helpers; avoid assuming optional Python packages are installed.

For the mandatory second classification pass, use `tools/review_boundaries.py --project UUID --scenes N N --neighbors 1 --internal --out FOLDER`. It compares outgoing/incoming native source frames, including retained parts inside joined scenes; `--survey` makes compact first/middle/last pages for orientation. Survey pages alone do not verify fast contact. Use the native flipbook for ambiguous motion and label uncertain boundaries instead of guessing. Review the source on both sides of every proposed merge and split, not just the selected first image. Recheck adjacent windows after topology edits.

Use `tools/edit_scenes.ts --project UUID --join N,N` or `--split-scene N --at-seconds LOCAL_EDIT_SECONDS --source-seconds VERIFIED_SOURCE_TIME` for a validated dry run; `--apply` saves a revision backup. The editor's Join scenes icon joins selected adjacent scene owners, or the current scene and its next neighbor. It preserves picture, separate sound, original handles/source intervals and Undo. Distinguish a production group from its retained camera subshots; one group must not become a prompt that discards the hit, target view, entrance or reaction.

Read saved generation prompts/requests only after inspecting source and delivered motion. Their wording is evidence about inputs, never proof that an instruction was followed. Identify multiple source setups inside an allegedly single-camera candidate. Verify temporal ordering and event coverage, not only the number of scene rows.

## Diagnose with observable distinctions

| Symptom | Evidence to check | Candidate cause and smallest useful response |
| --- | --- | --- |
| Fight repeatedly starts from rest | First/last pose, movement onset, source phase | Initial images show readiness instead of loaded motion; independent starts reset velocity. Carry state and correct the starting phase. |
| A body/weapon suddenly appears in contact | Approach, overlap, attack path, last incoming frame | Connecting event or geography was removed or restaged. Restore the causal coverage; a dissolve does not supply it. |
| Short shot feels sluggish or incomplete | Whole native take vs selected in/out, contact and recovery times | Opening handle was trimmed into the edit while the actual event occurs later. Select the whole useful movement, then retime appropriately. |
| Reaction loops or looks like a pause | Exact native intervals used by neighboring clips | Reused phases overlap or run backward; repeating a crop is not a new reaction. Find a chronological phase or show the actual new event. |
| Damage/recoil seems unmotivated | Visible attack origin/path/target and sound transient | The causal effect was omitted, mistimed, or replaced with generic brightness. Restore a readable event tied to the target. |
| Source motion is lost despite similar first images | All source interval frames and camera boundaries | Analysis missed an internal cut or changed the action's purpose. Revisit the verified shot map. |
| Accurate direction still looks animated/artificial | Weight, joint paths, acceleration, material style throughout | Raw anime guidance transferred held poses or cartoon mechanics. Isolate photographic guidance and natural stunt mechanics; don't just add texture. |
| Smooth playback still feels disconnected | Local saved media or export at normal speed | Editorial/continuity failure rather than loading. Repair state/event/timing, not player buffering. |

Treat these as hypotheses to test, not an automatic diagnosis. A correct source shot may deliberately pause or break motion; preserve its intent.

## Repair specification before submission

For each actual replacement or re-edit, record: what remains reusable; source and desired edit interval; incoming world/action state; required camera and actor positions; event/contact/outcome; outgoing state; image provenance and dependency; selected provider/native duration and cost if needed; audio/effect cues; and a concrete acceptance check against neighboring clips.

Use a dependency edge only when a shot needs a previous render's actual endpoint. Independent inserts can batch; dependent action chains cannot all start simultaneously from unrelated photographs. When a camera changes, carry world state through source-grounded geometry rather than forcing the same image. Do not invent endpoint frames or claim a dependency has been satisfied before its predecessor exists.

An adapted shot must still do its original causal job. If a provider rejects an injury depiction, lawful non-graphic staging can show attack direction, obscured contact, victim displacement and an aligned reaction. An unrelated creature close-up does not explain a person suddenly pinned in the next shot. Respect provider rules and flag unavoidable departures rather than attempting to bypass restrictions.

Effects need an origin, path when visible, target and event time. Align a short discharge and light spill with target contact/recoil and its sound; validate a few frames before and after. A two-frame flicker can supplement a lightning strike, but it cannot replace the strike's visual meaning. Match the event, not a universal frame count. Retain untreated media and an effects-off comparison when adding blur/shake/light.

For duration changes, measure actual action bounds in native time before calculating speed. Keep contact and recovery readable across the neighboring cut. A request to finish within a fraction of a second is not evidence that the output does. Shared-take reuse must maintain chronology, action state and complete speech; inspect repeated native ranges. Treat baked-in speedups as part of the source take, not a reason to apply another default multiplier.

## A review decision must be supported

Review the connected sequence at real speed, then dense frames where ambiguous. Accept only if its story event is understandable, continuity survives the join, motion remains physically legible, required effects and sound have causes, and dialogue is complete. Explain residual failures and their severity. Review placement with `approved=false` is useful feedback, not acceptance.

Report specific observations with saved scene numbers and unambiguous clocks. State what was and was not tested. A codec test confirms decodability; a timing table confirms duration; neither proves performance or continuity. A diagnosis-only result should leave the live edit unchanged and identify the smallest next repair rather than silently generating it.
