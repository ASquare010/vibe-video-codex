# Narration: performance before speed

Record the writer's exact script using the director's separate performance intentions. The director and audio role do not rewrite the words. Preserve the selected Holden identity, source files, exact requests and receipts. Existing accepted audio is not replaced by a new default.

## Voice and controls
Use [the saved preset](../config/narrator-default.json): Higgsfield Seed Audio, Holden, the exact preset ID/type, WAV 48 kHz. Native rate30 is provisional. The creator found Apollo 12's rate40 slightly rushed and emotionally flat. If needed compare a slower supported rate such as20 on the same passage; do not choose40 simply because it removes seconds.

The live catalog checked 2026-10-31 exposes speech_rate (-50..100, positive faster), loudness_rate (-50..100), pitch_rate (-12..12), voice ID/type, format and sample rate. It does not expose an independent Seed emotion/style/pause-length control. Refresh actual controls before generation; do not invent fields or treat rate units as percentages.

Higgsfield is the service, not the speech engine. Saved Apollo requests name `seed_audio` (ByteDance), not ElevenLabs. Its [audio guide](https://higgsfield.ai/blog/higgsfield-audio) describes Seed's free-form scene/audio prompting; its website speed values are not the connector's integer rate units. For an isolated narrator, explicitly request a dry voice with no ambience, music or effects rather than letting a scene-capable audio model invent them.

## Direct the delivery
Keep exact spoken words, performance intention, expanded provider prompt, controls and measured result separate. Use the model's actual prompting mode: exact-text endpoints receive words only; Seed's free-form mode can receive resolved delivery direction, which still needs a check for spoken instructions, missing/repeated words and pronunciation.

Make the current thought playable: who is addressing whom, what they notice, what raises pressure, what lands decisively and what changes their assessment. Vary stress, pitch and rhythm with that thought. Speed, loudness, stretched spelling and constant exclamations do not create acting. Explanation needs room to be understood; a sharp action can have a decisive accent without every sentence becoming hurried.

```text
One clean, dry Holden narrator addressing an interested listener. {SCENE_THOUGHT_AND_CHANGE_OF_ATTITUDE}. Use a comfortable connected pace, clear consonants and natural pitch/rhythm variation. Give {MEANING_BEARING_WORDS_OR_TURN} its appropriate emphasis. {ONLY_THE_PURPOSEFUL_BREATH_OR_SUSPENSE_BEAT_NEEDED}. No ambience, music, effects, other voices or added words. Speak the exact narration once; do not speak these directions.
Narration: "{EXACT_FINAL_TREATMENT_WORDS}"
```

Resolve this for the scene rather than copying generic urgency throughout. Pass numeric controls separately. Preserve meaningful space for visible action or sound designed by the director; silence is not automatically an error, and the narrator need not describe every movement.

Use a short performance arc rather than a list of adjectives: a confidential discovery becomes concern when the threat is understood, then a decisive phrase lands on the action. Name the actual phrase/turn in the scene. Before recording, return ambiguous spoken numbers or abbreviations to the writer for exact wording; keep name pronunciation guidance outside the script. After recording, do not silently rewrite the accepted script to match a mispronunciation.

For the current route, the resolved Seed prompt goes in `generate_audio.params.prompt`; set `model: seed_audio`, the saved voice pair and the preset's supported numeric settings alongside it. Do not paste provider instructions into exact-text dialogue endpoints.

## If ElevenLabs is explicitly selected
The live Higgsfield catalog checked 2026-10-31 exposes `elevenlabs_v4` and `elevenlabs_v4_turbo`, plus the separate `text2speech_v2` engine selector. Their schemas differ from Seed. Select an actual compatible voice; do not assume Holden's Seed preset ID transfers across engines. Preserve the default unless the creator selects a change.

For `elevenlabs_v4`, send ordered `dialogue` objects containing `text`, `voice_type`, `voice_id`; `params.prompt` is still required by the enclosing tool. The connector exposes `stability`, `similarity_boost` (0..1) and `batch_size` (1..4); it exposes no numeric speed control on this route. Omit unspecified controls rather than inventing an optimal value or transferring Seed's `speech_rate`. Default to one variation unless a comparison is authorized.

In the dialogue text use sparse, local delivery tags supported by [ElevenLabs' current guide](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices), natural punctuation and a voice suited to the intended performance. Example shape, to be resolved by the prompt writer:

```text
{SUPPORTED_DELIVERY_TAG} {EXACT_FIRST_THOUGHT}
{SUPPORTED_CHANGED_DELIVERY_TAG} {EXACT_TURN_AND_RESULT}
```

For example, `[whispering]` is a documented delivery tag, not spoken narration. Use a tag only where that delivery serves the story. V4/V3 do not support SSML break tags; avoid transferring older-model break syntax. Tags can misfire or produce unwanted sounds, so audition the actual take. Keep exact narration separately from tagged provider text. The Higgsfield blog's older Eleven v3 description is not the current connector's model identity.

## Calibrate before the batch
1. Generate one representative passage within production authorization and check the actual provider cost/ID. Keep voice, text and performance fixed when comparing speed.
2. Measure duration, overall/articulation pace and gaps. The provisional 155–180 WPM planning range is not mandatory for every scene or proof of expression. Judge the performance, not how quickly the file ends.
3. Listen at normal playback speed when permitted. Check meaning-led stress, changing attitude, clear connected speech and purposeful pauses, plus exact words and pronunciation. ASR/waveforms support narrower checks; unavailable listening remains pending. Never bypass a blocked route or invent an audition.
4. Save the selected project preset and use it across scenes, adapting performance to each development. Preserve rejected takes and the reason for selection.

Use one continuous narration file per scene, with complete thoughts and intentional non-spoken intervals where directed. Multiple cuts can share one sentence. Do not pad speech to a native video handle or accelerate accepted speech to compensate for bad visual coverage.

## Pause preparation and assembly
Inspect the isolated voice. Detector settings in the preset identify candidates, not automatic deletions: preserve intentional suspense, breaths and quiet consonants. Ambience cannot repair bad articulation or excessive dead air.

Do not append a fixed lead, tail or transition gap to every scene. A longer unspoken interval needs a specific directed action/sound purpose; a provider's accidental pause is not that purpose. Inspect multi-second gaps and scene joins before selecting the audio. Use the existing pause-preparation step before cut timing when excessive dead air is found; keep short natural phrasing and do not speed up spoken words to compensate for padding.

The [existing preparation helper](../scripts/prepare_narration.py) preserves originals, refuses overwrites and defaults to tempo1.0. It copies retained PCM for pause-only cleanup and records the removed intervals. Use --protect START:END for intended holds. Non-1.0 tempo is an explicit, bounded existing-audio preview, not the routine performance fix; its timing map is approximate. Recheck speech and realign after editing.

```text
python video-skills/cinematic-3d-storytelling/scripts/prepare_narration.py --input ABSOLUTE_NATIVE_WAV --out-dir ABSOLUTE_NEW_FOLDER --tempo 1.0
```

Finalize selected audio before frame timing. Hand back exact words, selected file/version/hash, measured duration, controls, edit map, alignment status and performance findings. Distinguish spoken mentions from recorded sound anchors. Preserve narration apart from physical sound/ambience; assembly mixes those layers and maintains continuous speech across cuts.
