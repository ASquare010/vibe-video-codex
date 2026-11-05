param([int]$Port = 7860, [switch]$ComfyUI)
$ErrorActionPreference = 'Stop'
$instanceIp = (& gcloud compute instances describe evrn-rnd-server --project=evrn-dev --zone=us-central1-c --format='value(networkInterfaces[0].accessConfigs[0].natIP)').Trim()
if ($LASTEXITCODE -ne 0 -or -not $instanceIp) { throw 'Could not find the VM address. Check gcloud sign-in and whether the VM is running.' }
$knownHosts = Join-Path $PSScriptRoot 'known_hosts'
$sshKey = Join-Path $env:USERPROFILE '.ssh\google_compute_engine'
$sshArgs = @('-N', '-i', $sshKey, '-L', "127.0.0.1:${Port}:127.0.0.1:7860", '-o', 'ExitOnForwardFailure=yes', '-o', 'ServerAliveInterval=30', '-o', 'ServerAliveCountMax=3', '-o', 'HostKeyAlias=evrn-dev.evrn-rnd-server', '-o', "UserKnownHostsFile=$knownHosts", '-o', 'StrictHostKeyChecking=yes', '-o', 'BatchMode=yes')
if ($ComfyUI) { $sshArgs += @('-L', '8188:127.0.0.1:8188') }
Write-Host "MiniMax H3 Studio: http://127.0.0.1:$Port/ui/"
Write-Host "API documentation: http://127.0.0.1:$Port/docs"
Write-Host 'Keep this window open. Press Ctrl+C to close the tunnel.'
ssh.exe @sshArgs "awais@$instanceIp"
if ($LASTEXITCODE -ne 0) { throw 'SSH tunnel exited with an error.' }
