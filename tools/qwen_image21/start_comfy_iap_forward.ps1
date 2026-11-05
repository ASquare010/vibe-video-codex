$ErrorActionPreference = 'Stop'
$existing = Get-NetTCPConnection -LocalPort 8188 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Output 'Port 8188 already has a listener; verify and reuse it instead of launching another forward.'
    exit 0
}
& 'C:/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.ps1' compute ssh evrn-dev-usc1-vm-rnd-gpu --zone us-central1-c --project evrn-dev --tunnel-through-iap --quiet --command=true --ssh-flag=-N --ssh-flag=-L --ssh-flag=127.0.0.1:8188:127.0.0.1:8188
exit $LASTEXITCODE
