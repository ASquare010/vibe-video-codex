# Reproduce the completed November 3–4 films

This is the curated source bundle for six delivered exports: Alkemade, Okene,
Ghost Army, both Salary Dance versions, and Luxury Aura. Global Aura and Cat Sword
Battle were skipped by the creator and are not represented as completed films.

Each film keeps its exact final export snapshot (`timeline.json`), writer and
direction in that snapshot, selected native source intervals/rates and resolved
generation settings, actual job IDs, original-input hashes, and delivery checks.
The historical Salary Dance snapshot is separate from the newer kitten revision.
The history packaging folder includes the exact thumbnail prompts and copy.

## Offline rendering without generating or paying for new media

1. Use Node 20+ and Python 3.11+. Run `npm ci` from the repository root.
2. Obtain the separately saved `video-reproduction-media-20261103.zip` archive.
   It contains content-addressed native takes, accepted audio, and selected image
   references. These large binary inputs intentionally stay outside Git. The
   manifest records the archive hash and each input's hash. A fresh clone alone
   does **not** contain enough media to reproduce the finished films.
3. Restore all inputs (Windows example; adapt the archive path):

   ```powershell
   python productions/20261103/restore_media.py --archive C:/Users/awais/Videos/YT_video/video-reproduction-media-20261103.zip
   npx tsx productions/20261103/render.ts --verify-all --verify-only
   npx tsx productions/20261103/render.ts 04-salary-dance-kittens
   ```

Use a different film key from `manifest.json` to render another film. To restore
only one film, add `--film KEY` to the Python command. Outputs go to ignored
`local-media/` and `rendered/` directories here, never to the live editor projects.
Existing differing inputs are never silently overwritten. The commands do not
contact generation providers, start GPU services, or resume skipped jobs.

The native renderer retains the exact selected clips, narration, timing, source
speeds, text and audio placements. Okene also receives its recorded -1 dB final
audio master. Windows Arial/font availability and the pinned npm FFmpeg package
are relevant to matching text rendering. Re-encoding may change MP4 bytes; the
original delivery hash proves the original artifact, not byte-identical output
on every operating system. Decode, dimensions, fps and frame count are checked.

## Regeneration versus reproduction

`generation.json` preserves actual requests for the selected takes and original
image/audio provenance. Use `tools/minimax_h3/client.py` and its instructions only
when intentionally generating a **new** take. Existing IDs are history, not a
request to resubmit. Same prompt and seed do not guarantee the same pixels after
backend/model changes. The archive's saved native takes are the reproducible
authority. Remote narrator generation and built-in image-generation backend
versions were not fully exposed; no deterministic regeneration claim is made.

All native unreviewed sound remains excluded. Original creator playback/listening
was pending; saved numerical and sequential-frame checks do not claim real-time
audition. The kitten revision's second take uses near-static framing after two
rejected camera attempts; the exact requested figure-eight throughout was not
achieved. Original/rejected job receipts remain locally in ignored drafts.

## Repository hygiene

Do not `git add -f drafts/` or commit `data/`, native media, exports, frameboards,
model weights, credentials, host caches, or local services' live state. Keep small
new recipes here, and store new binary inputs in a separately hash-verified
archive. `source-environment.json` records renderer source hashes and versions.
