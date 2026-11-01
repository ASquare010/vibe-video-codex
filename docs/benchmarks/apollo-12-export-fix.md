# Apollo 12 export boundary repair

The original benchmark review is preserved in [apollo-12-review.md](apollo-12-review.md). This change repairs its confirmed assembly defect only; it does not revise the story or regenerate media.

## Cause and change

The exporter compared frame timestamps against decimal-second clip boundaries. Some first-frame timestamps fell just below the decimal boundary, disabling the picture overlay for one frame. The black base layer appeared even though the timeline had complete coverage and the source frame contained a normal picture.

Clip and text visibility now compare rounded frame positions with the existing integer start/end intervals, including transition holds. This preserves the intended frame grid without extending clips into intentional gaps. An initial fixture reproduced the missing frame at 89/24 and 154/30; a separate one-frame insert also vanished before the repair.

## Verification

- All 72 application tests pass. Six new real-export cases cover both supported frame rates, stills and videos, adjacent cuts and scenes, retimed video with source offsets, intentional gaps, a one-frame insert and exact text intervals. Existing transition-effect checks also pass.
- The application build passes, with existing dependency/chunk-size warnings.
- Re-exported Apollo 12: **2235 frames, 24 fps, 93.125 seconds, 1280×720**. Full audio/video decode passes. No near-black intervals are detected using the same detector that found the original ten flashes; all ten suspect boundaries now contain picture.
- All six scene intermediates retain exactly the same selected narration PCM as their accepted source and the previous export's intermediates. Source media hashes and the project manifest are unchanged. Final AAC remains a lossy delivery encoding, distinct from the PCM preservation check.
- The previous export remains intact. The new verified receipt is selected through the project's `latest-export.json`; the original receipt is preserved under `review/boundary-export-fix/`.
- No provider jobs were submitted. Creative defects from the review, native playback, listening and creator approval remain separate and pending as previously recorded.

Corrected film: [film.mp4](D:/Git/vibe-video-codex/data/projects/34dd7600-10be-483d-8b19-4bc92f818408/exports/dd4bf352-ebbc-4307-bcd7-558fe2797129/film.mp4).

See [the compact verification receipt](../../evaluations/apollo-12-parent-review/export-boundary-fix.json) and [the project-specific re-export/check procedure](../../evaluations/apollo-12-parent-review/reexport-boundaries.ts). Intentional fades or uncovered frames in other projects are allowed; a black-frame detector must be interpreted against their intended edit rather than used as an unconditional rejection rule.
