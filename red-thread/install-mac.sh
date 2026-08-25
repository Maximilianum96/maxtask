#!/bin/sh
# Install Red Thread on a Mac and keep it running via launchd.
#
# One command on the Mac Studio (or any Mac on the tailnet):
#   curl -fsSL https://raw.githubusercontent.com/Maximilianum96/maxtask/claude/red-thread-atrium-app-y8a3p9/red-thread/install-mac.sh | sh
#
# Re-running it updates the app (git pull) and restarts the service.
# Data in red-thread/data/ is untouched by updates.
#
#   RED_THREAD_SRC   where to clone (default: ~/RedThread)
#   PORT             port to serve on (default: 7788)
set -e

SRC="${RED_THREAD_SRC:-$HOME/RedThread}"
PORT="${PORT:-7788}"
REPO="https://github.com/Maximilianum96/maxtask.git"
BRANCH="claude/red-thread-atrium-app-y8a3p9"
LABEL="ch.atrium.red-thread"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

command -v git >/dev/null 2>&1 || { echo "git is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required (brew install node)"; exit 1; }
NODE_BIN="$(command -v node)"

if [ -d "$SRC/.git" ]; then
  echo "Updating $SRC ..."
  git -C "$SRC" fetch origin "$BRANCH"
  git -C "$SRC" checkout "$BRANCH"
  git -C "$SRC" pull --ff-only origin "$BRANCH"
else
  echo "Cloning into $SRC ..."
  git clone -b "$BRANCH" "$REPO" "$SRC"
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array>
    <string>$NODE_BIN</string>
    <string>$SRC/red-thread/server.js</string>
  </array>
  <key>EnvironmentVariables</key><dict>
    <key>PORT</key><string>$PORT</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/red-thread.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/red-thread.log</string>
</dict></plist>
EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

sleep 2
if curl -fsS "http://localhost:$PORT/red-thread/health" >/dev/null; then
  echo ""
  echo "Red Thread is running:"
  echo "  local:     http://localhost:$PORT/red-thread"
  echo "  tailscale: http://100.79.103.60:$PORT/red-thread"
  echo "Logs: ~/Library/Logs/red-thread.log"
else
  echo "Service did not respond yet — check ~/Library/Logs/red-thread.log"
  exit 1
fi
