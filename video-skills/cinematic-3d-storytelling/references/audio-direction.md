# Native expressive narration and pause control

The writer supplies exact speech and meaning-led delivery notes; the audio stage turns them into a performance. Quality, useful direction and expressiveness take priority over credit savings. Preserve accepted narration, source files, exact requests and receipts. A new voice setting or template does not replace an old project's approved files.

## Voice and verified controls

Read [the narrator configuration](../config/narrator-default.json). Keep Holden, Higgsfield `seed_audio`, preset voice `3c9d6053-6334-592c-8997-4e325286af3f`, WAV at 48 kHz, loudness/pitch 0 unless overridden. The creator requested faster native articulation after finding the earlier delivery slow. Rate 30 is a provisional new-project candidate, with 40 available for one bounded comparison against the same passage; historical rate 20 remains in saved project receipts and the frozen compatibility configuration. No new rate is claimed to have listening approval.

Checked against the live `models_get(seed_audio)` catalog on 2026-10-31: `speech_rate` is a whole number from -50 to 100; 0 is the default and positive values are faster. `loudness_rate` is -50 to 100, `pitch_rate` -12 to 12. The model supports WAV/MP3/PCM/Opus and sample rates 8000–48000. Send the actual voice ID/type pair. The catalog exposes no separate Seed emotion, style, stability, pause-length, expression-intensity or mood control. Returned backend metadata is not evidence that such fields are writable. Refresh capabilities before actual use and never borrow another model's controls or the website UI's numeric speed scale.

Use native `speech_rate` first for faster new speech, instead of routinely accelerating an audio file afterward. Speed changes articulation, not acting. Brief thoughtful pauses and meaning-led stresses remain useful at a fast pace; do not solve dull performance by making it uniformly louder or rushed.

## Prompt-writing contract

Keep these separate in the record: exact `spokenText`, delivery intention, expanded provider prompt, verified voice/control settings and measured selected result. An exact-text TTS endpoint receives words only. Seed's documented free-form sound prompt supports testing a direction envelope; it is still necessary to check spoken-instruction leakage, added/omitted/repeated words and pronunciation. Do not silently strip a supported direction envelope under a blanket words-only rule, and do not pretend editorial notes reached a words-only endpoint.

Resolve the delivery to the current scene: who is speaking to whom, the changing thought, a few meaning-bearing stresses and where energy/attitude changes. An unfolding threat can build anticipation, a sudden action can land with a crisp surge, and a recognition can turn into a brief startled drop or charged beat. Keep those reactions attached to specific words and developments. Avoid a single emotion throughout, a dramatic gap at every sentence, constant shouting or a monotone fast read.

Use conventional exact spelling. Do not append repeated letters, all-caps text, phonetic cries or another engine's inline emotion tags to force expression. Preserve a name's intended pronunciation separately. The narrator can communicate alarm without adding unscripted dialogue or sound effects. Performance direction stays outside the words and never adds a production disclaimer.

Reusable Seed free-form envelope, to be resolved by the audio prompt-writing LLM:

```text
Create a clean, dry English narration with the selected Holden voice. One narrator addressing one interested listener; no other voices, ambience, music or effects.
Delivery: {SCENE_SPECIFIC_AUDIENCE_RELATIONSHIP_AND_THOUGHT}. Maintain fast, connected conversational momentum with clear consonants and natural pitch/rhythm variation. Keep clauses flowing through to the consequence, rather than stopping after each phrase.
Performance progression: {MEANING_LINKED_BUILD; DECISIVE_CHANGE_OR_STRESS; REACTION_OR_REALIZATION}. Make {FEW_MEANING_BEARING_WORDS} carry the change. Give sharp actions a decisive accent and adapt tone when the meaning changes; do not read every line in one solemn or shouting register.
Pauses: brief breaths at real thought boundaries. {ONLY_NEEDED_INTENTIONAL_HOLD_AND_EXACT_ANCHOR_OR_NONE}. Avoid long empty waits before starting, after each sentence or around every reveal. Preserve the connected thought and complete ending.
Speak the exact narration below once. Do not speak instructions, add words or repeat a phrase. No intro, outro or disclaimer.
Narration:
"{EXACT_SCENE_SPOKEN_TEXT}"
```

Pass supported numeric controls separately. Exact speech, expressive direction and selected control values are distinct evidence; none alone proves fidelity or performance.

## Bounded native-speed calibration

When full narration is authorized, calibrate one representative passage with connected explanation and a meaningful change before scaling. A writing/template task alone does not authorize audio generation. A previous voice choice does not approve new wording; repair a rejected script's actual opening before spending on a new performance. Existing authorization can cover a pilot and the remaining batch without a redundant approval question.

1. Use the same Holden identity, words, delivery envelope and audio format. Start with provisional rate 30. If the measured/listened result is still slow or rushed, compare once at a relevant native rate, such as 40 for faster articulation, changing that variable alone. Do not keep submitting variants without diagnosing a failure. Obtain a cost preflight and retain IDs, source files and actual charges.
2. Measure total duration and articulation/overall pace separately. The saved provisional overall goal of roughly 180–205 words per minute suits this creator's brisk conversational work, with slower sections when comprehension or intentional suspense needs them. It is not a compulsory rate for every genre, a duration guarantee or a threshold that proves acting.
3. Check exact words, repetitions, leaked instructions, pronunciation, onset/end and isolated internal gaps. ASR can flag discrepancies but may collapse repeats; inspect a suspect interval separately when needed. Compare the request, native file and assembled result before attributing a defect to writing or generation.
4. Listen at normal playback rate when permitted. Judge stress on meaning, pitch/rhythm changes, clarity, connected clauses and whether pauses feel motivated. Keep unavailable listening review pending and present the actual result rather than claiming expression from ASR/waveforms. Never circumvent a blocked playback route.
5. Save the chosen project delivery preset and use it across scene files, adapting only the scene's performance cues. No automatic per-scene voice/rate drift. Preserve rejected takes and missing-word evidence. A concrete pilot failure is corrected before the batch.

Generate one continuous narration asset per audio scene, rather than restarting speech for each cut. Multiple camera cuts and a short essential insert can share one spoken sentence. Keep scene boundaries at complete thoughts, not a fixed word count or the video model's native duration. If multiple voices are genuinely required, use supported speaker controls; inserting names in a single-voice prompt does not create another actor.

## Empty pauses and optional preparation

First request connected speech and few purposeful gaps during generation. Then inspect the isolated voice: ambience can hide dead air without repairing delivery. Long low-level intervals are review candidates, not automatically silence without speech. Starting detector settings remain -45 dB, internal gaps at least 0.60 seconds, retained candidate gap about 0.24 seconds, edge pad about 0.10 seconds. Protect an intended suspense/reaction hold, breath and quiet consonants. A gap over one second in brisk narration deserves inspection, not automatic deletion.

When cleanup is within scope, shorten demonstrated excess gaps into a separate derivative before definitive visual timing. The helper [prepare_narration.py](../scripts/prepare_narration.py) now defaults to tempo 1.0: pause preparation preserves articulation speed and copies the retained PCM without atempo processing. Native engine speed is the normal way to obtain faster new narration.

```text
python video-skills/cinematic-3d-storytelling/scripts/prepare_narration.py --input ABSOLUTE_NATIVE_WAV --out-dir ABSOLUTE_NEW_OUTPUT_FOLDER --tempo 1.0
```

Use `--protect START:END` for intentional native-time intervals. The helper requires local FFmpeg and 16-bit PCM WAV, preserves the source and refuses overwrites. It records the exact removed PCM intervals. Non-1.0 tempo is an explicit optional preview for a separately requested existing-audio adjustment, bounded by the saved policy (currently maximum 1.15); it is not the routine correction for slow new generation. Tempo cannot create acting. Its post-atempo map is approximate and requires realignment; a pause-only retained-PCM map is exact. A tighter duration does not prove no word loss or good delivery.

Compare exact words and listen after a substantive edit. Save the selected file hash, original/intermediate/final durations, gap/tempo settings and selected edit map. Realign phrase times to that actual selected file. For a completed film, revise picture/effects deliberately with the changed voice interval; do not leave unexplained holds or add filler silence elsewhere merely to retain the old duration. Preserve accepted audio unless its repair is authorized.

## Handoff and assembly

Hand the director the full researched story and ending, exact scene speech, selected audio version/path/hash, measured duration, chosen voice/controls, gap/tempo edit map and actual phrase alignment/status. Mark narration-only, action soundtrack or hybrid. Keep observed sound anchors and planned effects separate; an impact mentioned in speech is not a recorded contact. Timing from an unedited native file does not automatically apply after pause removal.

Retain clean narration apart from ambience/effects. Fit useful cuts around it, including brief inserts and longer revealing/establishing views. Do not accelerate accepted narration to accommodate bad footage. Cut boundaries must not reset the voice or create AAC gaps. For voice-quality rejection distinguish the wording, articulation setting, pause pattern and performance before choosing a repair.

Sources: [Higgsfield audio model/prompting guide](https://higgsfield.ai/blog/higgsfield-audio), the live Seed MCP catalog checked 2026-10-31, and [FFmpeg audio-filter documentation](https://www.ffmpeg.org/ffmpeg-filters.html). The guide documents UI/model capabilities; only the live endpoint catalog establishes the writable fields used here. These procedures improve control and checking, not a promise that every take will be expressive or exact.
