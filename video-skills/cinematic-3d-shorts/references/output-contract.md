# Draft and production contract

Use stable scene IDs and shot IDs. A scene is an audio unit; a shot is a camera cut. They are not synonyms. The image and video prompts come AFTER accepted measured audio, although the story draft already proposes the necessary coverage.

For a portable story draft save:
```json
{
  "title": "",
  "factualStatus": "factual | fiction | counterfactual | inspired",
  "premise": "",
  "viewerPromise": "",
  "attentionCarrier": "",
  "progression": [],
  "payoff": "",
  "targetSeconds": 90,
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

Audit proposed coverage for physical legibility: who holds what, whether a hand or support is available, and which action the viewer must actually see. Do not crowd establishing geography, a new task, its consequence and an explanatory mechanism into a tiny interval just because they share one narration sentence. Rebalance coverage before spending on media; retain provisional timing until audio exists. Schedule notes and overlays against their actual phrase, not a later shot merely because there is room there.

After audio acceptance attach one measured audio asset per scene. Map each shot to a meaningful phrase or event in that audio; do not divide the duration equally by the number of images. At 24 fps, planned shot intervals should cover the scene's exact measured frame interval without unintended gaps/overlaps. Several shots can share a sentence as long as the audio remains continuous.

At image planning add expanded imagePrompt, actual ordered input roles and references, selected image/version ID, camera calibration, persistent set/cast/prop state and review status. At video planning add expanded videoPrompt, one camera path, event timing, sound contract, native size/duration, input hashes, actual provider request/ID and review status. Keep native duration distinct from edit duration and never claim a scene audio duration was measured before a file exists.

In VibeCut use the current ProjectStore/schema instead of copying this portable JSON over project.json. Map spokenText to scene.narration, one scene.audioAssetId, and nested shots to scene.shots. Preserve stable IDs and creator edits. Persist expanded prompts and receipts. Place images for review after registration and replace only authorized previews when completed video arrives. Do not label planned shots as completed renders or unreviewed assets as approved.
