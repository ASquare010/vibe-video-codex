# Story engine

## Choose the appropriate engine
Infer the subject, audience, promise, factual status and intended duration from the brief. Default to a general audience, portrait, about 90 seconds when unspecified. Do not confuse suspense with universal menace. An explanation can create curiosity through an apparently simple result that needs a surprising mechanism. A character story can create it through a meaningful attempt meeting resistance. A what-if can create it by following a single changed assumption through its consequences. A comparison or investigation can create it by testing competing explanations against a concrete observation.

Before drafting, identify:
- The precise question the viewer should be able to answer at the end.
- The person, object, process or location that carries attention through the film.
- The causal or logical dependencies: what changes, why it changes, and what that permits or prevents next.
- The information the viewer needs before each reveal makes sense.
- The final observable result or insight that fulfills the opening promise.

Do not expose a lengthy planning monologue. Save a compact premise and progression alongside the script.

## Make the progression do work
Open at the most useful entry point: an event underway, a tangible puzzle, a demonstration, a consequential choice, or an arresting fact whose explanation the film supplies. Give enough orientation to understand what matters. A date, name or number belongs early only when it changes the viewer's mental picture or reasoning.

For every beat, identify its function: show an attempt, reveal a constraint, explain a mechanism, supply evidence, change the available options, correct an expectation or deliver a consequence. Several functions may share one beat. If removing a beat changes neither understanding nor the next event, combine or remove it.

Use concrete specifics selectively. Explain why a location, part, distance, sound, gesture or limitation matters. Specificity must change the picture or causal model, not decorate the nouns. Introduce technical language after a comprehensible action or problem gives the term a job. Re-anchor people and objects when switching perspective; a listener cannot scroll back to untangle pronouns.

Answer local questions as the film proceeds, then let the answer produce the next development. Do not hold all information hostage until the end. New stakes should arise from established facts or choices. A reversal needs an earlier setup; surprises cannot depend on invented evidence or a conveniently withheld fact the viewpoint character already knows.

At a consequential choice, test the obvious easier alternative. If it would work, use it or establish the relevant reason it cannot solve the immediate problem. An urgent choice is not automatically a permanent sacrifice: distinguish what is lost now from what can be recovered later. Track quantities when they drive the solution, and name the counted people or objects before using a pronoun for them. The closing interpretation must follow the character's established behavior, not invent an earlier belief just to make the ending elegant.

Vary explanatory scale with purpose: world or situation, local task, mechanism, result, larger implication. Change perspective to reveal information that the previous view could not show, not because a cut quota demands it.

## Write for a mouth and an ear
Use familiar verbs, contractions when natural, clear referents and a conversational point of view. Let longer sentences carry a connected thought; let a short sentence land a meaningful change. Do not convert a paragraph into a string of isolated slogans. Do not write every scene as a fresh introduction.

For explanations, let an understandable action or observation carry the idea before naming its category. Use a technical term when it helps the viewer understand what follows, then explain its immediate consequence. Do not spend the same breath introducing a term, a research institution, a measurement method and several caveats when the listener needs one relationship. Keep necessary uncertainty faithful and compact; put supporting citations and methodological detail in research notes unless the evidence itself is the story.

Urgency comes from a problem developing while the narrator explains it. Awe comes from a concrete scale or relationship the viewer can grasp. Humor comes from the situation or a precise observation. Avoid announcing emotions the events have not earned. A calm subject need not sound frantic.

Use direct questions when an answer can follow or when they expose a real choice. Repeated question/answer pairs feel like a classroom script. Likewise, repeated transition words and canned audience-address phrases can disguise missing causal links. Fix the link rather than merely replacing the transition word.

Punctuation serves understandable speech. Use normal periods and commas. An occasional dash can express a genuine interruption or turn. Avoid ellipsis trails, one-word paragraphs and an emphatic pause after every clause. Do not add fake stumbles or filler as a shortcut to human delivery.

For an energetic English short, begin planning around 175–195 words per minute, then adjust for technical difficulty, dialogue and meaningful pauses. This is a provisional writing budget, not a measured voice result or a pass/fail target. Shorten the scope before cramming too much information into fast speech. Retain the explanation that makes the action intelligible.

## Truth and imagination
For factual work, verify the claims on which the explanation or outcome depends. Do not invent quotations, private thoughts, precision, source access or archival evidence. Mark a reconstruction as such. For original fiction, establish constraints and honor them. For a counterfactual, state the changed assumption clearly once, carry its effects consistently, and distinguish further speculative leaps where needed. Do not repeatedly interrupt the film with the same disclaimer.

Style references are analysis material, not a fact database. Remove sponsor sections, platform calls to action, transcription noise, stage directions and accidental errors from style analysis unless specifically requested. Learn mechanisms, not a creator's signature wording, jokes or branded persona.

Keep the narrator inside the subject. Production decisions, how a picture will be rendered, and the writer's justifications belong in notes, not in the spoken story. State a necessary fictional allowance compactly, then let the experience unfold. Qualify a particular uncertain claim where it matters; do not repeatedly stop the film to reannounce that the whole film is a visualization. Replace abstract transition sentences with the actual change and why it matters to the current question.

## Reusable story-agent prompt
Use the following as the actual task prompt. Resolve only the brief and optional overrides. It contains no sample topic or ideal answer. Send the referenced skill files with it when the recipient cannot read local files.

```text
Use cinematic-3d-shorts/SKILL.md, references/story-engine.md and references/output-contract.md. The user brief below is the only topic brief. Develop the complete film without asking routine creative questions. Honor explicit constraints; infer reasonable defaults for missing choices.

USER BRIEF
{ONE_PARAGRAPH_BRIEF}

OPTIONAL OVERRIDES
{DURATION_AUDIENCE_FACTUAL_STATUS_OR_EMPTY}

Deliver a complete story draft suitable for spoken narration, not an essay or a trailer slogan reel. Select the appropriate narrative/explanatory engine rather than imposing a fixed plot. Establish one clear promise, enough orientation, a connected progression of developments, selective causal specifics and a payoff earned by earlier information. Write connected conversational language with varied sentence lengths and clear referents. Do not imitate a named creator. Keep facts, reconstruction and invention distinguishable. Flag unresolved load-bearing factual claims instead of fabricating them.

Return:
1. A short complete idea: premise, viewer promise, carrier of attention, factual status, progression and ending.
2. Exact full spoken script, contiguous and free of production instructions.
3. The same script divided into audio scenes. Each scene has one continuous narration file and may have multiple planned shots. Supply scene purpose, exact spokenText, delivery intention, approximate duration, and each shot's phrase anchor, new information, proposed viewpoint, causal event and start/end continuity. Every shot is one continuous viewpoint/motion: if it includes an edit, split it into separate shot records under the same scene audio. Proposed timings remain provisional until audio is measured.
4. A short editorial audit naming any weak causal connection, unearned reveal, repetitive verbal pattern or unsupported claim still present. Revise the draft if an identified defect prevents it from fulfilling its promise.

Stop at writing. Do not generate audio, images or videos. Do not claim measured timing, audience retention or production success.
```

## Editorial pass
Read the contiguous script without the headings. Does it sound like someone sharing something worth understanding? Can the viewer tell what changed and why? Is a detail doing useful work, or merely sounding precise? Does the ending answer the actual opening? Is each scene continuing the same thought rather than restarting the video? Repair the weakest real passage rather than adding more universal rules.
