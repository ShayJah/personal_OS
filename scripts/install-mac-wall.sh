#!/usr/bin/env bash
# Opens the projector wall (/tv) full-screen in Chrome every time you log in to this Mac.
# Usage:  bash scripts/install-mac-wall.sh "https://YOUR-SITE/tv?key=TOKEN" [projector-left-edge-px]
#   2nd arg = x position of the projector display (e.g. 1920 if it sits to the right of a 1920px-wide main display). Default 0.
# Undo:   launchctl unload ~/Library/LaunchAgents/com.amahoro.wall.plist && rm ~/Library/LaunchAgents/com.amahoro.wall.plist
set -euo pipefail
URL="${1:?Usage: bash install-mac-wall.sh \"https://YOUR-SITE/tv?key=TOKEN\" [x-offset]}"
X="${2:-0}"
PLIST="$HOME/Library/LaunchAgents/com.amahoro.wall.plist"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/.amahoro-wall-profile"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.amahoro.wall</string>
  <key>ProgramArguments</key><array>
    <string>/Applications/Google Chrome.app/Contents/MacOS/Google Chrome</string>
    <string>--user-data-dir=$HOME/.amahoro-wall-profile</string>
    <string>--kiosk</string>
    <string>--window-position=$X,0</string>
    <string>--noerrdialogs</string>
    <string>--disable-infobars</string>
    <string>$URL</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict></plist>
EOF
chmod 600 "$PLIST"   # the link holds the secret key
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed. The wall opens now and at every login. Keep the Mac awake: System Settings > Displays > Advanced > prevent automatic sleeping."
