# Draft and production contract

Use stable scene IDs and shot IDs. A scene is an audio unit; a shot is a camera cut. They are not synonyms. The image and video prompts come AFTER accepted measured audio, although the story draft already proposes the necessary coverage.

For a portable story draft save the fields below, resolving targetSeconds to the chosen duration (zero here is a schema placeholder, never a finished duration):
```json
{
  "title": "",
  "factualStatus": "factual | fiction | counterfactual | inspired",
  "premise": "",
  "viewerPromise": "",
  "attentionCarrier": "",
  "tellingAngle": {"entryMoment": "", "audienceRelationship": "", "reasonToContinue": ""},
  "progression": [],
  "payoff": "",
  "targetSeconds": 0,
  "fullSpokenText": "",
  "claimsNeedingVerification": [],
  "scenes": [{
    "id": "S01",
    "purpose": "",
    "spokenText": "",
    "deliveryIntention": "",
    "estimatedSeconds": 0,
    "audio": {"status": "not-generated"},
    "shots": [{
      "id": "S01-A",
      "phraseAnchor": "",
      "newInformation": "",
      "viewpoint": "",
      "event": "",
      "incomingState": "",
      "outgoingState": "",
      "timingStatus": "provisional"
    }]
  }]
}
```

The concatenation of scene spokenText must equal fullSpokenText without missing or repeated words. A phraseAnchor must actually occur in its scene. Keep a dialogue utterance's speaker and words distinct from delivery instructions. Read every shot record as a continuous take: any internal edit, inserted view or return to another camera needs another shot ID. A physically continuous push from a wide view into a detail can remain one shot; an unspecified jump of viewpoint cannot.

Keep narration fields free of production commentary. `factualStatus`, assumptions, evidence limits and safety/realism notes are production context; for this creator's story channel they do not become speech, subtitles or added disclaimers. Do not introduce an imagined exercise or announce that the story is invented. Later agents preserve the selected story words instead of appending qualifications that interrupt the event. This separation does not permit presenting invented events as verified reporting.

Add a writer-to-director `visualHandoff` recording promised experience, objectives/inquiry, opposition/obstacles, essential visible developments, required states, outcome and factual/fictional limits. Writer shots remain provisional until the director has interpreted the accepted audio. A dramatic sequence can cross audio-scene boundaries, while each scene retains its one continuous audio asset.

Audit proposed coverage for physical legibility: who holds what, whether a hand or support is available, and which action the viewer must actually see. Do not crowd establishing geography, a new task, its consequence and an explanatory mechanism into a tiny interval just because they share one narration sentence. Rebalance coverage before spending on media; retain provisional timing until audio exists. Schedule notes and overlays against their actual phrase, not a later shot merely because there is room there.

After audio acceptance attach one measured audio asset per scene. Map each shot to a meaningful phrase or event in that audio; do not divide the duration equally by the number of images. At 24 fps, planned shot intervals should cover the scene's exact measured frame interval without unintended gaps/overlaps. Several shots can share a sentence as long as the audio remains continuous.

At image planning add expanded imagePrompt, actual ordered input roles and references, selected image/version ID, camera calibration, persistent set/cast/prop state and review status. At video planning add expanded videoPrompt, one camera path, event timing, sound contract, native size/duration, input hashes, actual provider request/ID and review status. Keep native duration distinct from edit duration and never claim a scene audio duration was measured before a file exists.

After audio acceptance save the versioned direction artifact specified in [action-direction.md](action-direction.md): sources/hashes, sequence, world, audio evidence, causal beats, directed cuts and actual review status. Keep observed events, hypotheses and planned effects distinct. Include explicit time bases and unknown timing states; a phrase timestamp is not necessarily a recorded impact. Link cut IDs to beat IDs and before/after states. Do not overwrite the app manifest with this planning artifact.

Then use the visual coverage planner in [visual-prompts.md](visual-prompts.md) before commissioning images. Save the shared low-poly Blender-style design locks and set geography once, then resolve the relevant locks into each standalone provider prompt. For every cut record action phase, visible/offscreen cast, contact/support and ownership, useful opening instant and intended later motion. Save camera start/height/framing, attention, path and end view, with its dramatic reason. Keep opening inputs, optional design references, storyboard contact/end targets and actual verified timed controls distinct. A keyframe is not automatically a new cut or a supported MiniMax control. Each cut must contribute information, action, perspective or reaction; assess the sequence's dramatic development as well as individual continuity.

Carry state forward across cuts and mark ellipses or callbacks explicitly. Record why an action is omitted when omission could make the operation or handoff unclear. Before video resolve the prompt against the actual selected still, not merely the intended image description. Keep following-cut events in the editorial continuity record outside this shot's generation prompt. A template revision must not silently rewrite submitted requests, approved audio, selected assets or a running production plan.

For story-critical mechanisms add a `completionTest` to the relevant beat/cut: moving component, fixed reference, start/end relation, path/extent, planned completion window, visible evidence and actual result (`not-checked`, `complete`, `partial`, `elided` or `unclear`). Save the reviewed source-frame range and the retained edit range; a complete native take can still become incomplete when trimmed. Keep planned numeric precision separate from visually verified precision. Add the payoff's observable evidence and any inference to the ending review. Record the isolated narration's pause audit and selected edit map before definitive visual timing; audio speed, gap removal and timeline padding are distinct operations.

For geometry-sensitive action attach the layout/camera evidence from [camera-and-layout.md](camera-and-layout.md): dimensions and positions, actual mechanism aim, source/path/target, camera attachment/offset, look-at, optical focus, framing and roll. Mark each relation as planned, computed in a guide, verified in a selected still or checked in video; do not collapse those stages into an approval. Record emitted guide files and their hashes when used as image references. Preserve the distinction between low-poly style and physical miniature scale, and between intentional time-emphasis inserts and real-time action.

In VibeCut use the current ProjectStore/schema instead of copying this portable JSON over project.json. Map spokenText to scene.narration, one scene.audioAssetId, and nested shots to scene.shots. Preserve stable IDs and creator edits. Persist expanded prompts and receipts. Place images for review after registration and replace only authorized previews when completed video arrives. Do not label planned shots as completed renders or unreviewed assets as approved.
