# PhotoPi

Minimal Node.js web app for Raspberry Pi that schedules camera shots for timelapses. Uses `libcamera-still` (Bullseye+), falls back to `raspistill` if legacy camera stack enabled.

## Prerequisites (on Raspberry Pi)
- Raspberry Pi OS with camera enabled (`sudo raspi-config` → Interface Options → Legacy Camera or enable libcamera).
- Camera module connected and tested (`libcamera-still -n -o test.jpg`).
- Node.js 18+ (use `n` or `asdf` or `sudo apt install nodejs npm`).

## Install
```bash
sudo apt update
sudo apt install -y git nodejs npm
# clone
git clone <your-fork-url> photoPi
cd photoPi
npm install
```

## Run
```bash
npm start
# server listens on 3000 by default
# open http://<pi-host>:3000 in your browser (same LAN)
```

## Schedule photos
- Add one or more HH:MM times in the UI, set timezone (e.g., `America/New_York`).
- Click **Save schedule**. Jobs are stored in `data/config.json` and reloaded automatically.
- Click **Capture now** to test.
- Images save to `data/photos/` (served at `/photos/<file>`).

## Autostart with systemd (optional)
Create `/etc/systemd/system/photopi.service`:
```
[Unit]
Description=PhotoPi timelapse server
After=network.target

[Service]
WorkingDirectory=/home/pi/photoPi
ExecStart=/usr/bin/node /home/pi/photoPi/server.js
Restart=always
User=pi
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```
Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now photopi.service
```

## Notes
- Captures use 1920x1080; adjust in `lib/camera.js` if you need higher resolution.
- If you see "No camera command found", install `libcamera-apps` (`sudo apt install -y libcamera-apps`) or enable legacy camera support.
- Timezone defaults to your browser's detected TZ on first run.
```
