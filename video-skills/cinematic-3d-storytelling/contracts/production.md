# Draft and production contract

Use stable scene IDs and shot IDs. A scene is an audio unit; a shot is a camera cut. They are not synonyms. The writer supplies a complete spoken draft. The director shapes its unrecorded treatment, provisional cuts and performance before narration; final frame timing and image/video prompts follow measured audio.

The spoken-story record is defined in [the script template](../templates/script.md#spoken-story-record). Add shots only at the direction stage. The following is the preserved portable shot record; `viewpoint` is supplied by the image role, not the writer or director.

```json
{
  "shots": [
    {
      "id": "S01-A",
      "phraseAnchor": "",
      "newInformation": "",
      "viewpoint": "",
      "event": "",
      "incomingState": "",
      "outgoingState": "",
      "timingStatus": "provisional"
    }
  ]
}
```

The concatenation of scene spokenText must equal fullSpokenText without missing or repeated words. A phraseAnchor must actually occur in its scene. Keep a dialogue utterance's speaker and words distinct from delivery instructions. Read every shot record as a continuous take: any internal edit, inserted view or return to another camera needs another shot ID. A physically continuous push from a wide view into a detail can remain one shot; an unspecified jump of viewpoint cannot.

The director derives `visualHandoff` from the story, recording promised experience, objectives/inquiry, opposition/obstacles, essential visible developments, required states, outcome and factual/fictional limits. Existing writer shots remain provisional until the director has interpreted the accepted audio. A dramatic sequence can cross audio-scene boundaries, while each scene retains its one continuous audio asset.

After audio acceptance attach one measured audio asset per scene. Map each shot to a meaningful phrase or event in that audio; do not divide the duration equally by the number of images. At 24 fps, planned shot intervals should cover the scene's exact measured frame interval without unintended gaps/overlaps. Several shots can share a sentence as long as the audio remains continuous.

At image planning add expanded imagePrompt, actual ordered input roles and references, selected image/version ID, camera calibration, persistent set/cast/prop state and review status. At video planning add expanded videoPrompt, one camera path, event timing, sound contract, native size/duration, input hashes, actual provider request/ID and review status. Keep native duration distinct from edit duration and never claim a scene audio duration was measured before a file exists.

After audio acceptance save the versioned direction artifact specified in [director.md](../references/director.md): sources/hashes, sequence, world, audio evidence, causal beats, directed cuts and actual review status. Keep observed events, hypotheses and planned effects distinct. Include explicit time bases and unknown timing states; a phrase timestamp is not necessarily a recorded impact. Link cut IDs to beat IDs and before/after states. Do not overwrite the app manifest with this planning artifact.

Then use the image-stage compilation in [image.md](../templates/image.md) before commissioning images. Save the shared project-look and design locks and set geography once, then resolve the relevant locks into each standalone provider prompt. For every cut record action phase, visible/offscreen cast, contact/support and ownership, useful opening instant and intended later motion. Save camera start/height/framing, attention, path and end view, with its dramatic reason. Keep opening inputs, optional design references, storyboard contact/end targets and actual verified timed controls distinct. A keyframe is not automatically a new cut or a supported MiniMax control. Each cut must contribute information, action, perspective or reaction; assess the sequence's dramatic development as well as individual continuity.

Carry state forward across cuts and mark ellipses or callbacks explicitly. Record why an action is omitted when omission could make the operation or handoff unclear. Before video resolve the prompt against the actual selected still, not merely the intended image description. Keep following-cut events in the editorial continuity record outside this shot's generation prompt. A template revision must not silently rewrite submitted requests, approved audio, selected assets or a running production plan.

Use the existing direction/receipt artifacts to retain these compact additions, without adding production stages or requiring new manifest fields:

| Evidence | Record |
| --- | --- |
| Reference inputs | Actual path/version/hash, role (appearance, layout, mechanism/pose, current state), relevant feature and whether that feature was checked. |
| Difficult action | Planned opening, decisive contact/change and edit-out target; physical connection/support and the condition that would make the shot unusable. |
| Neighboring cut | What passes forward, what the next cut receives, matching action/eyeline/direction/space/sound or deliberate time/place change. |
| Actual request | Exact expanded provider text, settings and actual attached inputs, saved with the job ID; preserve shorter planning text separately. |
| Selection | Exact image/version or retained footage range, each critical requirement's observed evidence, unresolved failures and decision with reason. A file's existence is not a visual pass. |

Keep review contact sheets separate from clean generation inputs. A planning target or generated storyboard is not a timed provider control unless the selected route actually supports it.

For story-critical mechanisms add a `completionTest` to the relevant beat/cut: moving component, fixed reference, start/end relation, path/extent, planned completion window, visible evidence and actual result (`not-checked`, `complete`, `partial`, `elided` or `unclear`). Save the reviewed source-frame range and the retained edit range; a complete native take can still become incomplete when trimmed. Keep planned numeric precision separate from visually verified precision. Add the payoff's observable evidence and any inference to the ending review. Record the isolated narration's pause audit and selected edit map before definitive visual timing; audio speed, gap removal and timeline padding are distinct operations.

For geometry-sensitive action attach the layout/camera evidence from [image-layout.md](../templates/image.md#layout-and-blockout): dimensions and positions, actual mechanism aim, source/path/target, camera attachment/offset, look-at, optical focus, framing and roll. Mark each relation as planned, computed in a guide, verified in a selected still or checked in video; do not collapse those stages into an approval. Record emitted guide files and their hashes when used as image references. Preserve the distinction between rendering style and physical miniature scale, and between intentional time-emphasis inserts and real-time action.

In VibeCut use the current ProjectStore/schema instead of copying this portable JSON over project.json. Map spokenText to scene.narration, one scene.audioAssetId, and nested shots to scene.shots. Preserve stable IDs and creator edits. Persist expanded prompts and receipts. Place images for review after registration and replace only authorized previews when completed video arrives. Do not label planned shots as completed renders or unreviewed assets as approved.

Camera fields in the production record store the image and animation roles' outputs. Their detailed guidance stays in the respective guides; these are not camera choices requested from the writer or director.

After the image and animation stages enrich the direction record, its combined cut fields retain the full existing information:

| Record | Required meaning |
| --- | --- |
| `cuts` | Beat IDs, audio scene/phrase, interval/status, dramatic job, event phase, viewpoint intent, attachment/look-at/focus/framing/path, action geometry, incoming/outgoing state, keyframe roles and image/video lineage. For load-bearing changes, retain the planned visible before/change/result cues and actual selected-range findings in the direction/review artifact. |

## Timing and prompt-writer packet

The director owns provisional scene/cut membership before recording and final frame intervals after measured audio. Each audio scene contains at least three useful cuts. Durations follow motion, readability and dramatic purpose; a meaningful brief insert is valid, including below a second when readable, without a fixed one-second target. Image/animation writers can return a coverage concern, not silently add, combine or retime cuts.

Supply `previous` (selected outgoing state/reference or explicitly planned state), `current` (cut/beat IDs, exact narration/window, visual intent, required change and incoming/outgoing state) and `next` (required incoming state and join/time relationship). Add the image writer's chosen opening composition and actual selected image/version before animation. Neighboring events are LLM context, not extra events to send to the provider.

Keep `nativeDuration`, `usefulSourceInterval`, `editDuration`, `playbackRate`, `timeTreatment` and the reason for any retiming separate. Record preparation/contact/result windows with their time base and status. Effects follow actual selected contact after retiming; narration remains continuous at its accepted pace. A timing table or placeholder animatic is provisional evidence until selected footage and permitted playback establish the result.

For director-first v3 projects, plan.directorBasis is application evidence tied to the treated story, words, performance and cut events. Timing and provider prompt changes do not alter it; changed treatment content invalidates it. The writer cannot certify this stage. Preserve raw director results and recorded speech. A later timing pass may adjust frame intervals and directionBasis without silently changing the treatment.

Custom production helpers must use the same treatment validation/stamping and saved-skill resource handling as the managed path; never invent a treatment marker to bypass that check. At new-project creation preserve the resolved skill resources through the existing snapshot mechanism, not just a name or entrypoint. Existing frozen copies remain historical. If a validation path is unavailable, preserve the treatment and identify the missing evidence rather than claiming application certification. This is an execution requirement within the same workflow, not a new approval step.
