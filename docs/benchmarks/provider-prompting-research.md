# Provider prompting evidence, 2026-10-31

Scope: research and reusable guidance only. No paid generation, model/voice migration, existing project snapshot update or film replacement occurred.

## MiniMax: evidence before a style recommendation

The installed adapter uses the H3 Ref2VA checkpoint through `MiniMaxH3ReferenceToVideo`. Results from other Hailuo models or hosted 2K pipelines are not measurements of this installation.

| Candidate | Primary evidence | What it establishes |
| --- | --- | --- |
| Cinematic naturalism / science fiction | Official [768p starship request](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/scripts/readme/reproducible-768p-t2va-request.sh) and [published result](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/assets/t2va.mp4) | Publisher supplies a concrete scene, request and result. This example uses text-to-video, not our one-still Ref2VA setup. |
| Photographic people and environment | Official [Ref2VA request](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/scripts/readme/reproducible-768p-ref2va-request.sh) and [published result](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/assets/ref2va.mp4) | Publisher supplies a pastoral subject/voice editing example. It uses video/audio references, so it is not a one-image action benchmark. |
| Feature-style stylized 3D | Official [3D animation workflow](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/3d-animation-short-generator/SKILL.md) | An authored H3 narrative-animation direction with dimensional materials, designed proportions and energetic acting. A workflow is not proof of a winning output or success rate. |
| Tactile papercraft | Official [papercraft workflow](https://github.com/MiniMax-AI/MiniMax-H3/blob/main/skills/papercraft-stop-motion-explainer/SKILL.md) | A supported explainer direction with intentional stepped movement, rather than a substitute for naturalistic action. |

Recommendation: test feature-style stylized 3D for the next character-action animation, using sculpted shapes, cloth/metal texture, physical shadows and readable poses. Keep naturalism as an option when realism serves the subject. This is a story-fit recommendation, not a measured easiest/best-style ranking. The earlier automatic naturalism baseline had no comparative local evidence and has been replaced with an explicit choice. No existing film's look changed.

The published videos above are provided for creator inspection; native playback was not performed here. The demo image CDN could not be opened through the research tool. No alternative playback route was used. Neither a published clip nor a prompt description certifies motion in our own selected takes.

[Comfy's H3 documentation](https://docs.comfy.org/tutorials/video/minimax/minimax-h3) distinguishes local open-weight output around 768px short edge/24fps from hosted 2K processing. Do not call a 480p draft upscale equivalent to a stronger native generation. Preserve the existing final-quality setting guidance and compare the hardest action before commissioning a film under full production authorization.

## Narration: actual route and optional alternative

Saved Apollo `pilot-request.json`, `pilot-rate40-request.json` and `audio-batch-requests.json` use ByteDance `seed_audio` and the selected Holden preset. The current saved default is still Holden at provisional native rate30, with slower20 as a comparison candidate. Rate40 was creator-rejected for rushing/flatness. There is no newly auditioned optimal setting.

Live Higgsfield catalog checks on 2026-10-31:

| Route | Exposed controls relevant here |
| --- | --- |
| `seed_audio` | `speech_rate` -50..100, loudness -50..100, pitch -12..12, format/sample rate, voice ID/type. No independent emotion/style/pause-length parameter. |
| `elevenlabs_v4` | Required ordered `dialogue` with text and voice pair; optional stability/similarity 0..1, variation batch1..4. No exposed numeric speed. |
| `text2speech_v2` | Explicit engine variant, including ElevenLabs, and a voice pair; not interchangeable with either schema above. |

The [Higgsfield audio article](https://higgsfield.ai/blog/higgsfield-audio) describes Seed's free-form audio scene prompts and an older Eleven v3 route. Its website units are not the connector units. [ElevenLabs' current guidance](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices) supports model-specific delivery tags and natural text structure, with no SSML break tags on v4/v3. The reusable audio reference now separates these modes and explicitly requests an isolated dry Seed narrator. No Seed voice ID is assumed portable to ElevenLabs.

## GPT Image: named availability versus historical identity

Higgsfield's live `gpt_image_2_5` catalog exposes variant Flare/Sunburst, quality low/medium/high/xhigh/max, resolution1k/2k/4k and image references. Its defaults are Flare/low/1k. The tool used in the saved Apollo image invocations was the built-in `image_gen.imagegen`; that interface exposes neither a model name nor a variant selector. Its historical alias remains unverified.

For an explicitly selected Higgsfield GPT Image 2.5 route, Sunburst/high/2k is a proposed quality-first starting configuration, not an optimality result or a silent route migration. [OpenAI's Sunburst page](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst) and [prompting guide](https://developers.openai.com/api/docs/guides/image-prompting) support quality-focused selection and explicit reference/edit intent. The image template now keeps identity, geometry and style references distinct and directs local corrections without unnecessarily changing the rest of the frame. No Qwen enhancer settings were added to the GPT path.

## Changes and checks

1. Visual/image guidance commit `f75c5cc`: style evidence, explicit story-fit choice and GPT route/prompt handling.
2. Narration guidance commit `87d8632`: Seed-specific prompt, conditional ElevenLabs mode and actual connector controls.
3. This evidence record: sources, limitations and validation.

Validation: skill frontmatter, local Markdown targets/anchors, JSON examples and fence balance checked; Git whitespace check passed. Changes are documentation only, so app tests/build were not repeated. Existing accepted media and frozen project copies were not edited. Creative improvement remains unmeasured until a new authorized production is generated and reviewed.
