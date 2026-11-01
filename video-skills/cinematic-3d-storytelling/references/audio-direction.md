# Audio writing and delivery

The spoken text and its performance are separate artifacts. Good wording does not prove that a speech engine will deliver it well. A fast setting can still produce long dramatic gaps; high words-per-minute can still sound like a monotone readout.

Before spending on a replacement after a rejected script, return to the telling angle and exact spoken opening in [the script template](../templates/script.md). Present the revised opening as text for the creator's review unless they authorize proceeding directly to audio. Changing voice or speed cannot repair an introduction the creator does not want to hear. A previously accepted voice preset approves that configuration, not the writing of a new script.

## Scene audio template
```text
scene_id: {STABLE_SCENE_ID}
spoken_text: {EXACT_WORDS_ONLY}
delivery_intention: {WHO_IS_TELLING_THIS_TO_WHOM_AND_HOW_THE_THOUGHT_DEVELOPS}
energy_arc: {WHERE_INTEREST_URGENCY_OR_AWE_CHANGES_AND_WHY}
emphasis: {FEW_MEANING_BEARING_WORDS_OR_NONE}
pronunciation: {ONLY_NEEDED_NAMES_OR_TECHNICAL_TERMS}
pause_intention: {REAL_THOUGHT_BOUNDARIES_NOT_A_PAUSE_AFTER_EVERY_CLAUSE}
voice: {ACTUAL_SELECTED_VOICE_ID_AND_TYPE}
performance_direction: {AUDIENCE_RELATIONSHIP_ENERGY_EMPHASIS_AND_BEAT_CHANGES}
provider_prompt_mode: {EXACT_TTS_OR_DOCUMENTED_DIRECTED_AUDIO}
provider_controls: {ONLY_FIELDS_CONFIRMED_BY_THE_ACTUAL_TOOL}
pace_goal: {CREATOR_APPROVED_PRESET_OR_PROVISIONAL_MEASURED_WPM_RANGE}
pause_edit_policy: {PROTECT_INTENDED_BEATS_SHORTEN_ONLY_EXCESS_DEAD_AIR}
provisional_word_budget: {DURATION_BASED_ESTIMATE}
```

Keep the exact spoken words separate from the performance direction and final provider prompt. Select the prompt format for the actual model: an exact-text TTS surface receives only the words; a documented directed-audio surface may receive a delivery instruction plus clearly delimited exact words. Never invent an emotion field, import another engine's inline tags, or claim that editorial notes reached the provider when they were only saved locally. Compare the result against the intended words, including unwanted spoken direction, additions and repetitions.

Read across the script's sentence and scene boundaries before submission. Connect related actions naturally and resolve unnecessary repeated names without creating ambiguous pronouns. A camera cut does not require a full stop or a repeated lead-in. Alternate versions, shot directions and unrelated surrounding script stay out of the provider prompt. Performance instructions belong only in the documented channel described below.

For this workflow use Higgsfield speech. Discover the model, voice pair and controls using its tools. Reuse the user's selected voice; if a choice is required, use the voice picker. Obtain a cost preflight before paid comparisons and save actual requests/receipts. Do not switch engines or select an unsupported voice silently.

## Expression and model-aware prompting

The creator wants lively, expressive spoken storytelling: a narrator actively communicating discoveries to a listener, with natural pitch and rhythm changes, emphasis on meaning and forward momentum. Specify how delivery changes with the actual material: a reveal may carry disbelief, an attempt urgency, an explanation interested clarity. Do not ask for one emotion throughout, add a theatrical pause after every sentence, whisper by default or equate expression with louder audio. Preserve topic-appropriate restraint where it matters.

The creator explicitly prioritizes quality, useful detail and expressiveness over price. Retain the detailed performance direction needed by the scene, even when it increases a quote. Remove redundant or contradictory instructions for clarity, not merely to lower the word count or cost. Keep expanded requests and price records honest; more instruction text alone is not evidence of better acting. If a request is already submitted, preserve its exact prompt rather than rewriting its history.

For this creator's Shorts, a provisional starting pace is around 165–185 words per minute, adjusted for comprehension and their listening feedback. It is a calibration target, not an engine guarantee or a universal rate for all subjects and lengths. Measure both total pace (with pauses) and audible phrase pace: long dead air and slow articulation are different problems. An expressive result still needs listening approval.

Confirmed through the live Higgsfield catalog on 2026-10-30:
- `seed_audio`: `speech_rate` is an integer from -50 to 100; 0 is default and positive values are faster. `loudness_rate` and `pitch_rate` change volume/pitch, not acting quality. Keep them at the accepted settings unless testing those variables. There is no catalogued separate emotion, style or stability field for this model. Do not treat the speed units as an exact percentage or borrow the web UI's numeric scale.
- Higgsfield's official Seed Audio guide describes its prompt as a free-form sound description. For expressive Seed generation, the direction envelope below is a model-aware candidate, not a new API parameter or a promise of exact performance. Test for instruction leakage and unchanged words before a batch.
- `text2speech_v2` exposes a named engine through `variant`; its catalog does not establish that every engine supports the same speed controls or emotion tags. Do not silently change engines.
- `qwen_audio_tts` exposes a separate `instruction` (up to 128 characters) and a different speech-rate scale (0.5–2, default 1). This documents a capability, not authorization to switch or a guarantee that the creator's voice is compatible. Refresh the actual catalog before use. Never copy those values into Seed's controls.

Reusable **Seed Audio directed narration** candidate (only for that documented free-form prompt mode):
```text
Create a clean, dry, single-narrator English voice track using the selected voice.
Performance: {WHO_IS_ADDRESSING_WHOM}. {SPECIFIC_DELIVERY_CHANGES_AT_MEANINGFUL_BEATS}.
Maintain brisk conversational momentum, natural pitch variation and clear articulation. Emphasize {FEW_MEANING_BEARING_PHRASES_OR_NONE}. Use brief thought-boundary pauses; sustain connected clauses rather than pausing after each one.
Keep the accepted fast conversational pace while changing energy with the meaning: {SPECIFIC_MOMENTS_OF_ANTICIPATION_DISBELIEF_CONCERN_RELIEF_OR_OTHER_APPROPRIATE_ATTITUDE}. Let new information change the delivery; avoid a uniformly slow, solemn or flat read. Protect clarity and purposeful breaths rather than rushing every word or making each reveal a long pause.
Carry the thought across sentence boundaries without long empty waits. {ONLY_IF_NEEDED: A_SPECIFIC_BRIEF_INTENTIONAL_HOLD_AT_ITS_EXACT_PHRASE}. Do not insert a dramatic silence after each sentence or around every reveal.
Speak only the narration below, exactly once. Do not speak these instructions. No introduction, additional words, music, effects or ambient track.
Stay within the supplied story; add no disclaimer about fiction or realism and no invitation to imagine, assume or hypothesize. Those are production notes, not extra speech.
Narration:
"{EXACT_SCENE_SPOKEN_TEXT}"
```
Pass the verified voice pair, format, sample rate and supported numeric controls separately. Store exact scene speech, expanded provider prompt and numeric settings as distinct fields. Do not silently strip a supported direction envelope under a blanket words-only rule. If the selected endpoint requires exact text only, use that mode and disclose that performance direction remains editorial; do not pretend speed alone provides acting control.

Resolve the expression slots for this scene before submission; do not list every emotion as a request. On an already approved performance, retain the accepted voice, speech rate, exact words and file. A reusable template update affects future authorized generations and does not authorize replacing approved audio or modifying historical requests.

In the authorized Holden full-audio run, a directed Seed prompt produced the requested narration without detected spoken instructions. One scene still omitted phrases and needed a separate replacement. This is evidence for using and checking the direction envelope, not proof of expressive acting or guaranteed word fidelity. Completed-job metadata also showed backend defaults `expression_intensity: 5` and `mood: 0`; these were not supplied request controls and their accepted ranges/meaning are not established by that response. Do not present them as validated adjustable MCP controls without further documentation.

Sources: [Higgsfield audio model and prompting guide](https://higgsfield.ai/blog/higgsfield-audio), [voice consistency and saving settings](https://higgsfield.ai/blog/consistent-ai-voice-across-videos), plus current `models_get` results. Web UI expression intensity, mood and save-settings controls are not evidence that identical fields exist in MCP.

## Keep the chosen voice and delivery

The creator explicitly selected **Holden** as the default on 2026-10-30, superseding the unresolved “Gregey” preference. Load [the saved narrator default](../config/narrator-default.json): Higgsfield `seed_audio`, Holden `voice_id` `3c9d6053-6334-592c-8997-4e325286af3f`, `voice_type` `preset`, 48 kHz WAV, baseline `speech_rate` 20, loudness/pitch 0. These controls are the chosen production baseline, not an assertion of listening approval. Reuse them across scenes and new projects unless overridden; do not ask for a new voice choice when this pair is available. Preserve historical receipts unchanged.

On continuation or a fresh test, read the latest applicable approved delivery preset. Do not reset an accepted nonzero speed to 0 merely because it is the model default. Preserve voice identity, model, sample rate and performance baseline across scenes; adapt only the scene-specific beat direction. For an uncalibrated Seed voice, +15 or +20 is a reasonable provisional faster test, not accepted settings. Change speed independently of text/voice when attributing the effect of speed; changing voice and expression together is a new treatment, not a controlled speed comparison.

## Establish a speech theme before a batch
Explicit creator authorization to generate the whole narration permits completing it without another pilot-approval question. For a new directed prompting mode, first check one scene for instruction leakage, missing/repeated words and technical validity; then continue the authorized set when those checks pass. Do not claim that this automatic check approves expression. Stop to diagnose a concrete failure before multiplying it; preserve IDs and originals.

1. Choose one representative 20–30 second passage containing connected explanation and a meaningful change, not just the hook.
2. Start with one voice and one explicit set of supported controls. If pace calibration is needed, allow at most two differently configured pilots with the SAME text and voice. This isolates delivery settings. Do not simultaneously rewrite the script and change voice, speed and sound mix while calling it a controlled test.
3. Measure duration, words per minute, leading/trailing silence and unusually long internal gaps. Check words and pronunciation. ASR can reveal omissions; it cannot approve naturalness, acting or intelligibility on its own.
4. Listen at normal speed when permitted. Assess whether the narrator sounds as if they understand and are communicating the thought, whether stresses land on meaning, and whether momentum survives sentence boundaries. User listening decides the preferred theme. If playback is unavailable to the agent, label that judgment pending and present the actual audio.
5. Save the accepted voice, exact text, controls and measured result as the project delivery preset. Generate all scene audio with it before images. If the pilot fails, identify whether wording, voice or settings caused the observed problem; a faster rerender is not automatically a fix.

Use the scene's complete thought, not an arbitrary word count, as its boundary. A scene can include a narration section or a continuous conversation with multiple camera angles. For two distinct speakers, use a genuinely supported multi-speaker workflow and stitch one final scene audio asset if necessary. A single-voice API does not acquire two voices from character names inserted in its prompt.

## Audio acceptance record
Save native file, job ID, exact provider prompt/controls, duration, script word count, measured pace, any ASR discrepancies, and listening findings or their pending status. Keep complete sentences and endings. Do not disguise a new rejected take by overwriting the old file. Do not pad every short line to an unrelated video minimum; handle video limits after the scene audio is accepted.

Preserve narration separately from ambience and effects. Do not generate unwanted speech or music in MiniMax. Camera cuts must not reset the narration or create AAC padding gaps. Do not accelerate approved speech merely to fit bad footage.

Scene and shot divisions do not dictate sentence breaks.

## Handoff to the visual director

After acceptance, hand over the full story and ending, exact scene text, selected audio version/path/hash, measured duration, voice/delivery preset and any actual phrase alignment. Identify whether each file is narration only, a supplied action soundtrack or a hybrid. Provide the selected edited file's time base; alignment from a longer native take is not automatically valid after pause removal or tempo changes. Preserve the edit map when available and re-align the selected performance before setting definitive cut times.

Keep observed sound events separate from planned effects. A narration describing a shot does not supply a recorded firing/impact anchor. The visual director uses [director.md](director.md) to build the action/dependency timeline and cut plan; effects can then be aligned to actual generated contact where authorized. Do not add explosions or other sound to the clean voice track merely to make it seem more exciting, or revise accepted speech to match a weak visual plan. For an existing draft, the director may replace provisional writer shot suggestions without replacing the narration.

## Faster speech and less dead air

Use two separate controls. Generation speed changes articulation; pause editing changes time spent waiting. If the creator requests a faster edit of existing narration, make a derivative with pitch-preserving time stretching, starting modestly around 1.10–1.20x, then measure and listen. This does not create expressive acting. Keep original files and identify the new version clearly.

Shorten excess leading/trailing silence and long internal gaps, preserving breaths, quiet consonants, intelligibility and intended dramatic beats. Do not delete every pause or apply a noise gate as if it removes elapsed time. Inspect actual silence and protect intentional intervals. A conservative starting detector is -45 dB with internal gaps at least 0.60s shortened to about 0.24s before tempo adjustment; thresholds are candidate settings for clean narration, not guarantees of speech detection. Leave about 0.10s at boundaries and revise if the voice is quiet or breathy.

Audit the isolated voice, not only the finished mix: ambience or effects can cover a speech gap without repairing it. Before locking image/cut timing, record detected gaps, phrase context when established, and whether each long interval is an intended held beat or excess dead air. Flag unplanned gaps from about 0.60s for inspection and especially gaps over 1s in brisk work; these are review triggers, not automatic deletion rules. Compare a reported final-film pause with the native voice, selected voice derivative, scene placement and mix to distinguish a generated pause from an editorial gap, duplicated padding, delayed clip or processing defect. Amplitude detection locates low-level intervals; it does not prove their words, purpose or perceived delivery.

When audio cleanup is within the authorized production scope, tighten only established excess pauses into a new derivative before visual timing, keeping voice, words, pitch and articulation speed unchanged unless a separate speed change was requested. Preserve native files and an exact cut map, then re-align the selected derivative. For a frozen comparison keep its audio/timing constants; a creator-directed pause repair is a separately labelled revision, not silently the same controlled comparison. If editing a completed film, ripple or otherwise deliberately revise picture/effects timing along with the voice; do not remove a voice interval while leaving an unexplained hold, create filler silence elsewhere to preserve duration, or claim an edit not actually made.

For repeated local preparation use [prepare_narration.py](../scripts/prepare_narration.py), which preserves the input, writes a pause-tightened intermediate and a tempo-adjusted preview, and records removed intervals. For example:
```text
python video-skills/cinematic-3d-storytelling/scripts/prepare_narration.py --input ABSOLUTE_NATIVE_WAV --out-dir ABSOLUTE_NEW_OUTPUT_FOLDER --tempo 1.15
```
Use `--protect START:END` to retain an intentional gap in original seconds. The helper needs local FFmpeg and 16-bit PCM WAV. Its cut map after tempo is approximate; inspect words and re-align final narration before setting shot times. Run a transcript comparison on important edits; ASR supports a no-word-loss check but cannot approve naturalness. Save original, intermediate, final durations and edit parameters; shortened duration is not itself evidence of a good result.

Reference: [FFmpeg audio filters](https://www.ffmpeg.org/ffmpeg-filters.html), confirmed against the local `atempo` and `silencedetect` filter help. Do not change pitch by changing sample-rate metadata.

For a reported repeated phrase, compare the exact saved request, native scene file and assembled listening file before assigning a cause. Distinguish duplicated input, extra speech in one native take and repeated overlap during assembly. Full-file ASR can collapse repetitions; inspect the suspect time range separately if automatic text conflicts with the report or has an unexplained timing gap. Keep evidence and the user's listening finding separate, retain the original, and mark the take defective when a repeat is established. Do not regenerate, trim or spend on a repair without authorization, and do not change the written script solely to hide a generation defect.
