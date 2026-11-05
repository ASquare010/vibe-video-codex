$ErrorActionPreference = 'Stop'
if (Get-NetTCPConnection -LocalPort 7861 -State Listen -ErrorAction SilentlyContinue) {
    Write-Output 'Port 7861 already has a listener; verify and reuse it.'
    exit 0
}
& 'C:/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.ps1' compute ssh evrn-dev-usc1-vm-rnd-gpu --zone us-central1-c --project evrn-dev --tunnel-through-iap --quiet --command=true --ssh-flag=-N --ssh-flag=-L --ssh-flag=127.0.0.1:7861:127.0.0.1:7861
exit $LASTEXITCODE
