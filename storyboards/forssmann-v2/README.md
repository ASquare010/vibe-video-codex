# Forssmann image/audio storyboard v2

Creator scope: update director coverage, keep the exact story and four accepted Holden audio files, deliver 50–60 portrait cuts, stop before video generation.

Applied to project `761bb19c-3366-42b3-bb34-274cc9f0f625`, revision 54: **60 image placements**, grouped **16 / 16 / 14 / 14**, over **3445 frames at 24 fps (143.54 seconds)**. There are **42 newly generated selected stills** and **18 reuse placements**, including deliberate explanatory reprises. Each scene has at least two purposeful subsecond inserts; selected durations vary with the development.

The opening now shows the internal catheter route and atrium, then the guiding hand and doctor/patient reveal. The later sequences connect the supported experiment to the door, corridor, X-ray controls, endpoint, publication, dismissal, systematic research and shared recognition. Corrections remove wrong-direction arrows, a false body-to-machine connection, an invented bystander, inconsistent plate routes and wrong-arm access at arrival. The preparation join was adjusted after actual sheet inspection so an established insertion does not jump backward to an unprepared arm.

`plan.json` holds cut timing, speech windows, incoming/outgoing events and prompt-writing inputs. `selected-images.json` records actual selected files and hashes; `review-notes.json` contains observations of all 60 selected stills. Generation requests, returned/rejected attempts and unknown billing remain in the project and committed generation ledger. Unreturned/uncertain attempts are distinguished from successful images.

The project folder contains:

- `storyboard-v2/review.html`: local image/audio review player; no autoplay or generated video.
- `storyboard-v2/S01-selected.jpg` through `S04-selected.jpg`: selected scene sheets.
- `storyboard-v2/project-immediately-before-apply.json`: original timeline and sidecars before replacement.
- `storyboard-v2/preservation-lock.json`: exact story/performance/audio IDs and hashes.
- `storyboard-v2/director-instructions.md`: explicit director override for this authorized revision; the historical saved skill snapshot stays intact.
- `latest-storyboard.json`: receipt for the current image board. `latest-export.json` still identifies the original historical film, whose hash was verified unchanged.

The editor contains 60 image clips with no synthetic camera motion, no new effects and the original scene-owned narration. Old assets, jobs, costs, videos and rejected still versions remain preserved. Status is **awaiting review**, with storyboard approval reopened. Stills do not demonstrate animated contact, force or motion. Timing was checked against saved speech alignment; native playback/listening and creator acceptance remain pending. Anatomy/radiographs are explanatory reconstructions, not original archival evidence.

Implementation checkpoints: `5c51729` updates director guidance; `5a874bb` saves the initial 60-cut plan; this completion commit saves the applied selections, review player and preservation checks. Unrelated working-tree changes are excluded.

Rebuild review artifacts with `build_review.py`, verify the actual applied project with `verify_storyboard.py`, and check player boundary logic with `node storyboards/forssmann-v2/verify_preview.mjs`. `apply_storyboard.ts` uses existing project-scoped director validation, registers real files and lineage, and applies one atomic manifest change. It refuses a second application; inspect the receipt instead of duplicating placements.
