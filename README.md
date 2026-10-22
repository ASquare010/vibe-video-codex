# VibeCut

A local video editing harness with Codex as the creative brain. The editor owns the storyboard, files, timeline, preview and export. Codex chooses its available tools and generation models; actual provenance appears when you select an asset.

## Run

Requires Node.js 22.12+ (tested with 24), npm, and a modern desktop browser. Codex is optional for manual editing. FFmpeg and FFprobe are installed as dependencies; `FFMPEG_PATH` and `FFPROBE_PATH` can override them.

```powershell
npm install
npm run dev
```

Open [http://127.0.0.1:4310](http://127.0.0.1:4310). The service binds to loopback and serves the UI and API from the same origin. Copy `.env.example` to `.env` to customize paths or the port. Environment files and generated project data are ignored by Git.

For a saved production build:

```powershell
npm run build
npm start
```

## Make a complete video

1. Create a project, choose one project skill and describe the video. A Codex project gets its own persistent conversation, initialized without inference. Choose **Open Codex chat** in the read-only sidebar and give prompts in the main Codex app. Creating a project does not start generation.
2. Review the complete Storyboard: hook, story, full narration, every scene, voice/audio direction, visual direction, continuity, sound, and individual shot image/video prompts. Edit these in the main workspace or ask Codex to revise them.
3. Request production in that Codex chat: **all scene audio → all planned images → planned image-to-video shots**. Each scene has one measured narration file and may contain several image/video placements. Still-image shots can remain stills with editor motion.
4. The permanent sidebar stays beside the entire editing app. It observes saved Codex replies and progress every four seconds, with the current step (thinking, generating audio/images/video, processing or rendering), ready counts and a last-update timestamp. A production stage supplies context only while the observed chat is running; completion or stale/unavailable status clears the busy display. It never resumes the conversation or starts a turn. Prompts, questions, model settings and approvals remain in the main Codex chat.
5. Edit the timeline or direct Codex to update the project. The project-local `AGENTS.md` tells Codex to read the selected skill and save complete plans and edits into the canonical manifest. The editor watches validated manifest changes; source files and prior versions remain available.
6. Export the saved timeline to a local H.264/AAC MP4 at 30 fps. Each export retains its input snapshot.

Completed results from the earlier managed workflow remain recoverable. Applying a draft merges intended edits against its original snapshot: unrelated timeline and size changes are preserved, while actual story conflicts still require review. A finished turn with an application error is labelled finished with a pending result; it is not left running or automatically regenerated.

## Project skills

Version-control-ready templates live in the repository:

- `video-skills/cinematic-story/SKILL.md`: causal storytelling, natural narration and purposeful cinematic visuals.
- `video-skills/retro-horror/SKILL.md`: whispered retro horror, consistent low-poly visuals, detailed standalone shot prompts and selective animation with a budget. This adapts the supplied horror workflow to one audio file per scene.
- `video-skills/documentary/SKILL.md`: evidence-led narration, factual classification and clear visual context.

One skill applies to an entire project. It contains voice, spoken style, story direction, aesthetics, continuity and production instructions. **Project skill** in the main workspace shows the complete editable Markdown. Selecting a template copies it into the project; project edits do not change other projects. **Save to shared library** updates the repository's `SKILL.md` for future projects. Additional template folders are discovered by `/api/skills`.

These files can be committed and pushed with the rest of the source. The app does not configure a GitHub remote or publish repository changes itself.

## Full-screen document review

Storyboard and Project skill each have a **Full screen** button. The focused view fills the screen with a readable editor and a notes column. **Exit full screen** or Escape returns to the editing workspace; embedded browsers that deny native fullscreen use a full-window fallback.

Select wording to attach a quoted comment, suggestion or pointer. Scene and shot comment buttons attach notes directly to that location. Notes can be edited, resolved, reopened or deleted; selecting a note's location jumps back to its source. Notes and quotes are saved in `project.review.comments`, included in copied project context, and available to Codex without sending it an automatic message.

**Approve storyboard** and **Approve skill** record the current document's content identifier. Subsequent content edits show **Needs review**. Notes, resolution changes and timeline edits do not invalidate a document approval. **Reopen review** clears it. Approval records a review decision; generation remains directed in the main Codex chat. Full-screen edits and review decisions use the same save, conflict protection and undo history as the regular workspace.

## Editing controls

- A black empty program monitor, independent image/video requested sizes, aspect ratio, and export resolution. Size choices: 420, 480, 720, 1080 and 2160. The number is the short edge; the long edge is an even 16:9 dimension. Generation requests remain subject to the actual provider's capabilities, while actual returned dimensions are shown in Provenance.
- Images and video share the Picture lane, with Narration directly below. Overlay, Text, Captions and Music/SFX appear only when used. Labels, waveforms and clips share one scroll area and remain aligned. Narration anchors scene length and can be selected to inspect its audio. Imported video is visually previewed/exported with its embedded audio muted; add audio separately when needed.
- The Media library shows imported and generated assets from **all scenes**, with scene labels and type filters. Ready assets appear as the external chat updates the project. Each asset has Add and Delete controls. Delete removes it from the library and all timeline uses; deleting narration keeps the scene's measured timing. Undo restores the asset and its placements. Source files and versions stay on disk for recovery.
- A full-width timeline grid and ruler that extend as you scroll. Drag clips (or a Shift-selected group) to move; drag either edge to trim; drag the ruler or empty lane space to scrub. A small drag threshold keeps clicks from making edits. Edge scrolling, snapping (hold Alt to bypass), Escape to cancel, Shift-wheel or middle-drag to pan, and Control/Command-wheel to zoom around the cursor support longer timelines. Text does not become selected while dragging. Playback, delete, undo/redo and debounced saving are included.
- Selection tool **V**, razor **C** to cut at the clicked point, and **S** / Split at playhead for the separate playhead operation. Splitting preserves source offsets and never duplicates the source media.
- One contextual **Properties** panel. Image/video selections show motion, color correction and transitions; text selections show font/style controls; audio selections show audio controls. The same panel contains a collapsible **Details** section with provenance and versions. There are no separate Motion/Color or Provenance tabs.
- Cross dissolve, Dip to black, Wipe and Slide are in the selected visual's Properties. Apply one to the next clip or drag it onto a timeline join. Type and duration are editable. There is one razor icon; **S** retains the keyboard-only split-at-playhead operation.
- Transform, opacity, fill/fit, rotation, video retiming, zoom in/out, four pan directions, movement amount and custom start/end position and scale.
- Exposure, contrast, saturation, temperature, blur, vignette and visual fades, with color reset. These affect preview and local exports.
- Text and caption tools with direct preview dragging, five font families, weight, size, fill, alignment, outline, shadow, rotation, opacity and frame timing. Captions are editable text placements; automatic transcription is not built in.
- Asset inspection with the real prompt, tool, provider, model, dimensions and version history. Unknown fields remain labelled “Not reported.”
- Freehand frame annotations with normalized paths, frame/clip context, a note and a captured PNG for agent guidance.

Shortcuts also include Space, frame arrows, Delete, Ctrl+S, Ctrl+Z and Ctrl+Shift+Z. Text inputs keep their normal editing shortcuts. Panel sizes are resizable and remembered locally.

## Codex observation and project handoff

Install and sign in to Codex using its official setup. Set `CODEX_BIN` if it is not on PATH. The bridge uses the installed user's configuration, tools and auth. Desktop-only tools are not assumed to exist in a separate app-server process. No auth tokens are sent to the browser.

The integration uses [Codex app-server](https://learn.chatgpt.com/docs/app-server) over local JSON RPC. Project setup uses `thread/start`, `thread/inject_items`, `thread/name/set` and `thread/unsubscribe`, seeding genuine context without inference and releasing the conversation for the main Codex client. Observation uses only `thread/read` and `thread/turns/list`. A bounded read of the thread's own durable rollout under the Codex sessions directory supplies completion/progress when another client owns the conversation. Only public assistant messages and tool labels are displayed; reasoning and tool payloads are excluded.

The sidebar has **Open Codex chat**, **Copy context** and refresh. Project settings can link a different local chat by ID or `codex://threads/<id>` link. It has no composer, draft/produce controls, duplicated approval settings or question-answer form. Approval policy is controlled in Codex itself. `conversation.mode` defaults to `observe`; generation endpoints reject requests for observed projects before connecting or starting inference.

The internal managed bridge is retained for compatibility and protocol tests, requiring an explicit `conversation.mode: "managed"`. Those tasks use `jobs/<job-id>/input.json`, `result.schema.json` and a structured `result.json`. Saved results can be applied without starting Codex or repeating generation. Media is probed, scope is validated and versions/lineage are preserved.

Do not operate the same Codex conversation concurrently in another client. VibeCut serializes its own turns per project but cannot coordinate another client's active turn. Connection settings include reconnect and project context copying.

ChatGPT is a separate manual handoff mode: copy context, open a ChatGPT chat and save its conversation URL. A web-only ChatGPT chat cannot access the local project folder; import its returned media manually. This mode does not automatically create or drive a ChatGPT chat.

## Persistence and external editing

Default location: `data/projects/<project-id>/`.

```text
project.json          # Canonical schemaVersion 2 state
AGENTS.md             # Instructions for the main Codex chat to edit this project
project.json.bak      # Previous saved state
project.json.pending  # Recovery journal during a locked Windows fallback
media/                # Imported and generated media
jobs/<job-id>/        # Immutable input, result schema and proposed output
annotations/          # Captured annotated-frame PNGs
revisions/            # Storyboard approval snapshots
exports/<export-id>/  # Input snapshot, scene renders and final film.mp4
```

The schema is in `shared/project.ts`. Version 1 projects migrate on read and retain their assets, placements and conversations. Times are integer frames at 30 fps; source duration is rounded down to a frame. Binary files are not embedded in the manifest. Media paths must remain within the project's real directory; traversal and outside symlinks are rejected.

Saves use a synced temporary file and backup. Windows EPERM/EACCES/EBUSY rename failures are retried; if a reader denies replacement but allows writing, a complete synced recovery journal protects an in-place update. If writing is also denied, the app preserves the draft and backup and reports the lock. Invalid partial JSON can recover from the pending journal. A lock that denies all access still needs the conflicting program to release the file.

External manifest edits are watched and validated. Preserve stable IDs, use schema version 2 and increment revision. Optimistic checks prevent silent overwrites; conflicting UI drafts can be downloaded before reloading. If an external malformed manifest has no pending recovery journal, preserve it and restore the `.bak` file manually.

## Verification

```powershell
npm test
npm run test:e2e
npm run build
npm run demo
```

Unit/integration tests cover source/audio bounds, safe asset deletion, migration, Windows replacement-lock recovery, concurrent saves, path restrictions, safe result merging, read-only observation, current production steps, stale status handling, complete multi-scene plans, managed production sequencing, shot lineage and real transition renders. Browser workflows cover aligned contextual lanes, dragging/trimming/group movement, edge scrolling and panning, project-wide media with incoming assets and deletion/undo, the single properties panel and razor, read-only status completion, skills, saving/reloading, annotations and actual MP4 exports.

The demo and tests use local media fixtures, clearly labelled synthetic tones and temporary test projects. They use no generation credits. Browser checks use headless Edge on Windows or Playwright Chromium elsewhere. `scripts/check-codex.ts` separately checks live conversation creation and resume after a process restart with zero inference turns.

## Practical limits

- Generation depends on tools exposed by the user's Codex runtime. Paid external generation is not exercised by these tests; no generation is simulated in the application.
- Transitions currently join adjacent clips on the same visual track within one scene. Dissolve/wipe/slide hold the outgoing clip's last frame as a handle, preserving fixed narration timing. Cross-scene transitions, ripple editing, track lock/mute, arbitrary keyframes and a general VFX graph are not implemented.
- Preview uses browser media elements and a shared frame clock, rather than a sample-accurate composition engine. Heavy timelines may need proxies. Browser and FFmpeg font rasterization, color processing and vignette can differ slightly. Annotation captures are guidance images; advanced grading/transition effects are not all reproduced by the capture path.
- Timeline undo covers manual project edits, not imported files or bridge version changes. Older media versions remain selectable. Narration replacement can trim/remove placements that exceed its new duration.
- Export status is kept by the running service; completed files and snapshots remain on disk after restart.
