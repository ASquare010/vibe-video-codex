# MiniMax application resources and GCP access

Updated 2026-10-29 from the creator's replacement-VM instruction and a local code inspection. This is an access request/inventory, not an IAM grant or a successful connection test.

## Current target

- Project: `evrn-dev`.
- VM: `evrn-dev-usc1-vm-rnd-gpu`, zone `us-central1-c`.
- Transport: IAP SSH; regular public SSH is unavailable according to the creator.
- VM service account: reported to have no roles. Its email and effective bindings have not been verified; do not invent them.

```powershell
gcloud compute ssh evrn-dev-usc1-vm-rnd-gpu --zone us-central1-c --project evrn-dev --tunnel-through-iap
```

## What this application currently needs

The inspected `tools/minimax_h3` client/runner/tunnel and `server` code use private HTTP over SSH, local inference, files and model/output directories. No Cloud Storage, Secret Manager, Vertex AI, Firestore or Pub/Sub application API dependency was found in that inspected scope. This is a code-based inference, not a claim about every application on the replacement VM.

| Resource | Needed action | Access request |
| --- | --- | --- |
| The named VM in `evrn-dev` | Connect and inspect existing deployment | IAP/SSH access for the human or automation principal |
| Existing GPU, weights and local model/input/output/state files | Read models; upload references; write outputs and receipts | Appropriate Linux filesystem/service-user access; verify the historical `/opt/minimax-h3` installation exists |
| Existing API on VM loopback port7860 | Submit/status/collect only when authorized | Private SSH forward; keep the API off the public internet |
| Existing ComfyUI loopback port8188 | Optional editor inspection | Forward only when needed |
| Cloud resource APIs from inside the VM | None identified for this local inference path | No runtime GCP IAM role is currently justified by the inspected application code |

## Connecting principal: IAP and SSH

Request `roles/iap.tunnelResourceAccessor` scoped to this VM and the Compute read permissions required by `gcloud` (`compute.instances.get`, `compute.instances.list`, `compute.projects.get`). With OS Login, use `roles/compute.osLogin`, or `roles/compute.osAdminLogin` only for required administration. An attached service account can additionally require `roles/iam.serviceAccountUser` on that account. For metadata-based SSH, have the administrator provide the necessary key-management permissions instead of assuming OS Login. The administrator should verify the SSH configuration and IAP ingress to TCP22 from `35.235.240.0/20`. No firewall/IAM changes were performed here. [IAP documentation](https://docs.cloud.google.com/iap/docs/using-tcp-forwarding), [OS Login roles](https://docs.cloud.google.com/compute/docs/oslogin/set-up-oslogin).

## VM service account: only add roles for named application resources

Do not grant Owner/Editor to make inference work. If another application or a changed deployment uses GCP APIs, first record the exact resource, read/write operations and service-account email. For example, a named input/model bucket may require `roles/storage.objectViewer`; a named output bucket accepting new objects may require `roles/storage.objectCreator`. Reading, overwriting or deleting outputs needs separately justified permissions. Logs/metrics/secrets/container registries likewise need their actual resource and operation identified before a role is requested. No bucket, secret, repository or database name was found or invented for this deployment. IAM roles and VM access scopes jointly constrain API access. [VM service accounts](https://docs.cloud.google.com/compute/docs/access/service-accounts), [Cloud Storage roles](https://docs.cloud.google.com/storage/docs/access-control/iam-roles).

## Administrator handoff

Please provide IAP/SSH access to the named VM and confirm its attached service-account email, OS Login mode, installed inference services, model/state/output locations and any actual GCP API resources used by the applications. For the inspected local MiniMax path, no additional VM runtime API role has been identified. Old local completed media and request receipts must be retained during migration; verify remote job-state migration before attempting to resume IDs. This document does not authorize role grants, VM starts, service changes or generation.
