#!/usr/bin/env bash
# One-time setup for the projector Pi: boots straight into the /tv screen, no SSH needed afterward.
# Run ON the Pi (Raspberry Pi OS desktop, 64-bit):  bash pi-kiosk.sh "https://YOUR-SITE/tv?key=YOUR_TOKEN"
set -euo pipefail
URL="${1:?Usage: bash pi-kiosk.sh \"https://YOUR-SITE/tv?key=TOKEN\"}"

sudo apt-get update -y
sudo apt-get install -y chromium-browser unclutter 2>/dev/null || sudo apt-get install -y chromium unclutter
BROWSER=$(command -v chromium-browser || command -v chromium)

# Desktop login without a password prompt, and no screen blanking.
sudo raspi-config nonint do_boot_behaviour B4
sudo raspi-config nonint do_blanking 1

# Start the kiosk at login. Re-opens itself if Chromium crashes.
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/amahoro-tv.desktop <<EOF
[Desktop Entry]
Type=Application
Name=Amahoro TV
Exec=bash -c 'unclutter -idle 1 & while true; do $BROWSER --kiosk --noerrdialogs --disable-infobars --incognito --check-for-update-interval=31536000 "$URL"; sleep 5; done'
EOF
chmod 600 ~/.config/autostart/amahoro-tv.desktop  # the link holds the secret key
echo "Done. Reboot with: sudo reboot"
