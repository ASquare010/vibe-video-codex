# Audio writing and delivery

The spoken text and its performance are separate artifacts. Good wording does not prove that a speech engine will deliver it well. A fast setting can still produce long dramatic gaps; high words-per-minute can still sound like a monotone readout.

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
provider_controls: {ONLY_FIELDS_CONFIRMED_BY_THE_ACTUAL_TOOL}
provisional_word_budget: {DURATION_BASED_ESTIMATE}
```

Delivery intention guides casting, writing and review. Pass it to the provider only through an actual supported instruction field. If the tool accepts only text and speed, do not sneak the direction into spoken_text, invent emotion parameters or pretend the model received it. Use the exact script as the tool prompt. Preserve the editorial direction separately.

For this workflow use Higgsfield speech. Discover the model, voice pair and controls using its tools. Reuse the user's selected voice; if a choice is required, use the voice picker. Obtain a cost preflight before paid comparisons and save actual requests/receipts. Do not switch engines or select an unsupported voice silently.

## Establish a speech theme before a batch
1. Choose one representative 20–30 second passage containing connected explanation and a meaningful change, not just the hook.
2. Start with one voice and one explicit set of supported controls. If pace calibration is needed, allow at most two differently configured pilots with the SAME text and voice. This isolates delivery settings. Do not simultaneously rewrite the script and change voice, speed and sound mix while calling it a controlled test.
3. Measure duration, words per minute, leading/trailing silence and unusually long internal gaps. Check words and pronunciation. ASR can reveal omissions; it cannot approve naturalness, acting or intelligibility on its own.
4. Listen at normal speed when permitted. Assess whether the narrator sounds as if they understand and are communicating the thought, whether stresses land on meaning, and whether momentum survives sentence boundaries. User listening decides the preferred theme. If playback is unavailable to the agent, label that judgment pending and present the actual audio.
5. Save the accepted voice, exact text, controls and measured result as the project delivery preset. Generate all scene audio with it before images. If the pilot fails, identify whether wording, voice or settings caused the observed problem; a faster rerender is not automatically a fix.

Use the scene's complete thought, not an arbitrary word count, as its boundary. A scene can include a narration section or a continuous conversation with multiple camera angles. For two distinct speakers, use a genuinely supported multi-speaker workflow and stitch one final scene audio asset if necessary. A single-voice API does not acquire two voices from character names inserted in its prompt.

## Audio acceptance record
Save native file, job ID, exact provider prompt/controls, duration, script word count, measured pace, any ASR discrepancies, and listening findings or their pending status. Keep complete sentences and endings. Do not disguise a new rejected take by overwriting the old file. Do not pad every short line to an unrelated video minimum; handle video limits after the scene audio is accepted.

Preserve narration separately from ambience and effects. Do not generate unwanted speech or music in MiniMax. Camera cuts must not reset the narration or create AAC padding gaps. Do not accelerate approved speech merely to fit bad footage.
