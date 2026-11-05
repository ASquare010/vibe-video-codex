#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
install -d -o awais -g awais /opt/minimax-h3
apt-get update
apt-get install -y --no-install-recommends git curl ca-certificates build-essential python3-venv python3-dev ffmpeg linux-headers-"$(uname -r)" pkg-config libgl1 libglib2.0-0
curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/debian13/x86_64/cuda-keyring_1.1-1_all.deb -o /tmp/minimax-cuda-keyring.deb
dpkg -i /tmp/minimax-cuda-keyring.deb
apt-get update
apt-get install -y nvidia-driver-pinning-595
apt-get install -y --no-install-recommends nvidia-driver-cuda nvidia-kernel-dkms
# Persist the HMM compatibility setting before the first CUDA context is created.
echo 'options nvidia_uvm uvm_disable_hmm=1' > /etc/modprobe.d/minimax-uvm.conf
update-initramfs -u
modprobe nvidia
nvidia-smi
sudo -u awais bash /opt/minimax-h3/install_runtime.sh
date -Is > /opt/minimax-h3/bootstrap.done
