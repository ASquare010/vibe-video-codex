# Narration: performance before speed

Record the director's final spoken treatment, not the writer's earlier draft. Preserve the selected Holden identity, source files, exact requests and receipts. Existing accepted audio is not replaced by a new default.

## Voice and controls
Use [the saved preset](../config/narrator-default.json): Higgsfield Seed Audio, Holden, the exact preset ID/type, WAV 48 kHz. Native rate30 is provisional. The creator found Apollo 12's rate40 slightly rushed and emotionally flat. If needed compare a slower supported rate such as20 on the same passage; do not choose40 simply because it removes seconds.

The live catalog checked 2026-10-31 exposes speech_rate (-50..100, positive faster), loudness_rate (-50..100), pitch_rate (-12..12), voice ID/type, format and sample rate. It does not expose an independent Seed emotion/style/pause-length control. Refresh actual controls before generation; do not invent fields or treat rate units as percentages.

## Direct the delivery
Keep exact spoken words, performance intention, expanded provider prompt, controls and measured result separate. Use the model's actual prompting mode: exact-text endpoints receive words only; Seed's free-form mode can receive resolved delivery direction, which still needs a check for spoken instructions, missing/repeated words and pronunciation.

Make the current thought playable: who is addressing whom, what they notice, what raises pressure, what lands decisively and what changes their assessment. Vary stress, pitch and rhythm with that thought. Speed, loudness, stretched spelling and constant exclamations do not create acting. Explanation needs room to be understood; a sharp action can have a decisive accent without every sentence becoming hurried.

```text
One clean Holden narrator addressing an interested listener. {SCENE_THOUGHT_AND_CHANGE_OF_ATTITUDE}. Use a comfortable connected pace, clear consonants and natural pitch/rhythm variation. Give {MEANING_BEARING_WORDS_OR_TURN} its appropriate emphasis. {ONLY_THE_PURPOSEFUL_BREATH_OR_SUSPENSE_BEAT_NEEDED}. No other voices or added words. Speak the exact narration once; do not speak these directions.
Narration: "{EXACT_FINAL_TREATMENT_WORDS}"
```

Resolve this for the scene rather than copying generic urgency throughout. Pass numeric controls separately. Preserve meaningful space for visible action or sound designed by the director; silence is not automatically an error, and the narrator need not describe every movement.

## Calibrate before the batch
1. Generate one representative passage within production authorization and check the actual provider cost/ID. Keep voice, text and performance fixed when comparing speed.
2. Measure duration, overall/articulation pace and gaps. The provisional 155–180 WPM planning range is not mandatory for every scene or proof of expression. Judge the performance, not how quickly the file ends.
3. Listen at normal playback speed when permitted. Check meaning-led stress, changing attitude, clear connected speech and purposeful pauses, plus exact words and pronunciation. ASR/waveforms support narrower checks; unavailable listening remains pending. Never bypass a blocked route or invent an audition.
4. Save the selected project preset and use it across scenes, adapting performance to each development. Preserve rejected takes and the reason for selection.

Use one continuous narration file per scene, with complete thoughts and intentional non-spoken intervals where directed. Multiple cuts can share one sentence. Do not pad speech to a native video handle or accelerate accepted speech to compensate for bad visual coverage.

## Pause preparation and assembly
Inspect the isolated voice. Detector settings in the preset identify candidates, not automatic deletions: preserve intentional suspense, breaths and quiet consonants. Ambience cannot repair bad articulation or excessive dead air.

The [existing preparation helper](../scripts/prepare_narration.py) preserves originals, refuses overwrites and defaults to tempo1.0. It copies retained PCM for pause-only cleanup and records the removed intervals. Use --protect START:END for intended holds. Non-1.0 tempo is an explicit, bounded existing-audio preview, not the routine performance fix; its timing map is approximate. Recheck speech and realign after editing.

```text
python video-skills/cinematic-3d-storytelling/scripts/prepare_narration.py --input ABSOLUTE_NATIVE_WAV --out-dir ABSOLUTE_NEW_FOLDER --tempo 1.0
```

Finalize selected audio before frame timing. Hand back exact words, selected file/version/hash, measured duration, controls, edit map, alignment status and performance findings. Distinguish spoken mentions from recorded sound anchors. Preserve narration apart from physical sound/ambience; assembly mixes those layers and maintains continuous speech across cuts.
