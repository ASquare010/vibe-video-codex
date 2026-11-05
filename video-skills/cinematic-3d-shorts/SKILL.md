---
name: cinematic-3d-shorts
description: Turn a short topic brief into spoken YouTube stories and explainers, then audio-led scenes and detailed cinematic 3D images and videos. Use for original 1–3 minute films across factual, fictional, how-it-works and what-if subjects.
metadata:
  display-name: Cinematic 3D storyteller
---

# Purpose
Make the viewer understand and want the next development. Write something a person would tell another person, with concrete events and explanations, rather than prose that announces how dramatic it is. The visual theme is detailed modern 3D feature-film graphics: tangible modeled objects, readable mechanisms, motivated cameras and persistent space. Slight exaggeration is welcome when it improves clarity or force.

Read [the story engine and reusable writer prompt](references/story-engine.md) for every new story. It accepts one paragraph; infer ordinary creative choices rather than requesting a questionnaire. Read [the output contract](references/output-contract.md) when saving the draft.

These resources live under `video-skills/cinematic-3d-shorts/` in this workspace. Loading only the selected skill's inline text is insufficient for writing; read the linked story engine and contract as well.

# Required sequence
1. Develop the complete idea, causal or explanatory progression, payoff and exact spoken script. Divide it into audio scenes with proposed camera shots. No media yet.
2. Read [audio direction](references/audio-direction.md). Establish the speech theme with a short measured Higgsfield pilot before multiplying a new voice/delivery recipe. Generate the approved scene narration files, one continuous audio file per scene. Keep words separate from instructions. Measure actual speech and pauses; a rate setting is not evidence of delivery.
3. After audio is accepted, read [visual prompt templates](references/visual-prompts.md). Derive shot images from the whole idea, the exact scene audio and phrase anchors. Generate with the creator's GPT image tool; requested label is GPT 2.5, but record the actual tool/model rather than inventing a version. Place selected images as unapproved timeline previews.
4. After image approval, generate each continuous shot using the creator's installed MiniMax on GCP. A new cut is a new shot, not an interpolation between incompatible views. Fit coverage to measured audio, assemble and inspect the film.

A **scene** is one continuous audio unit and may contain several **shots/cuts**. A **shot** is one continuous camera/subject event and normally one generated video. A reverse angle inside a conversation changes the shot, not automatically the scene or its audio. Never restart a spoken sentence at a camera cut.

Respect the current stage. A writing or audio-theme request does not authorize images or video. Full-production authorization can cover the sequence, but a requested review gate remains in force. Preserve old assets, creator edits, exact requests, IDs, costs and alternatives. Retrying paid media needs a concrete defect and bounded scope; do not make endless comparison batches.

# Story and speech standards
- Choose one governing question or predicament and a clear carrier of attention: a person, object, process, investigation or journey. Different subjects need different structures; do not force every explainer into a disaster story.
- Make each development follow from the last. For a consequential detail, explain what it changes. A list of increasingly impressive nouns is not progression.
- Deliver useful information early and keep developing it. A hook earns attention with a specific event, contradiction, demonstration or question; it does not demand viewers stay to the end.
- Keep connected spoken sentences with varied length. Fragments, questions, humor and pauses are tools, not the default rhythm. Do not manufacture naturalness with filler, fake mistakes, slang or constant shouting.
- Distinguish verified facts, disputed accounts, reconstruction, opinion and counterfactual assumptions. Research load-bearing factual claims. The style of a supplied transcript is not evidence that its claims are true.
- End by paying off the opening promise with a consequence, mechanism, decision or changed understanding. Do not append a generic moral, engagement request or unrelated twist.

# Production boundaries
Higgsfield is for audio; GPT is for still images; the user's installed MiniMax is for videos. Do not substitute Higgsfield video or Qwen images. Discover actual audio voices/parameters through the connected tools. Use the exact selected voice pair; do not invent IDs or unsupported emotion fields.

For MiniMax, read `tools/minimax_h3/AI_INSTRUCTIONS.md`, use the existing client and live configuration, connect through the documented private IAP route and reconcile saved jobs before submission. The shared GPU is sequential. Preserve automatic unload after all submitted work is finished. Do not change services, GPU stack, IAM or networking as routine production work.

State what has actually been assessed. Text scores do not establish spoken energy; sampled frames do not establish native-rate movement or perceived impact. Keep unavailable playback checks pending. Keep infrastructure cost unpriced when unknown, separate from audio credits.
