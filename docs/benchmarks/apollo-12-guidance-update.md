# Guidance changes from the Apollo 12 review

The [review](apollo-12-review.md) identified a concrete export defect and creative acceptance gaps. The [export repair](apollo-12-export-fix.md) was completed first. These subsequent changes update the reusable storytelling skill for future projects; the benchmark's frozen instructions, script, media and placements remain unchanged.

## Workflow/director checkpoint

Commit `2daf333` updates `SKILL.md`, `references/director.md` and `contracts/production.md`:

- Important changes have a planned visible before/change/result target, a meaningful event phase and an actual selected-range finding. Related-looking subject matter alone does not establish the event.
- The director compares actual adjacent stills for useful new information before scaling animation and considers preparation/action/result across the sequence. Repetition is allowed when changed content earns it; no compulsory lens rotation or fixed timing recipe is added.
- Critical results must be legible at delivery viewing size. A caption, plan or successful provider receipt does not establish a missing operation. Contextual illustration and explicit ellipses remain valid.
- Final verification inspects the delivered export at boundaries, distinguishing unintended black flashes from intentional fades and black intervals. Manifest coverage and successful decoding remain necessary but insufficient checks.

## Prompt-writing checkpoint

The three existing templates retain their owners and locations:

| Resource | Revised decision |
| --- | --- |
| `templates/script.md` | Explain unfamiliar terms through the relationship/function needed now; preserve the scope of partial recovery; keep context connected to the hook and remove repeated conclusions. The writer still does not plan shots or camera angles. |
| `templates/image.md` | Turn the director's visible evidence target into one readable current action phase, critical detail and useful composition. Adjacent views must add information or changed behavior; design references must not force the same composition everywhere. Angle, perspective and appearance stay in this template. |
| `templates/animation.md` | Continue preparation already performed, describe the actual visible change and leave its result readable. Meaningful display/lighting changes need a directed cause. Avoid replacing the required event with a generic gesture when the still cannot support it. Camera movement and physical action stay in this template. |
| `SKILL.md` | Choose native quality for the required delivery detail and compare a bounded alternative when the representative sequence exposes a limitation. Upscaling, more steps and higher pixel counts are not guarantees or repairs for a wrong event. |

The templates remain instructions for the LLM writing each resolved provider prompt. They are not sent whole to media models. Verification stays with the director through the skill; no separate reviewer agent or final-review checklist is appended to provider requests. Short-cut duration remains action/readability dependent, with no one-second target.

## Validation and limits

The skill validator passes. All 38 local Markdown links resolve, fenced blocks are balanced and both fenced JSON examples parse. The benchmark's saved skill files match their original hashes; the new guidance was not silently copied into that project. See [verification](../../evaluations/apollo-12-parent-review/guidance-update-verification.json).

The exporter passed all 72 application tests and the application build. The corrected film has no detected near-black intervals, retains its 2235-frame duration and preserves all six selected narration tracks in the scene intermediates. Its original creative findings and pending listening/native-motion review are still valid.

These prompt revisions are grounded in actual failures; they are not a claim that a new controlled production comparison has already demonstrated better output. Keep the baseline and test the revised guidance on future work rather than accumulating Apollo-specific instructions or regenerating this film without a separate creative-edit request.
