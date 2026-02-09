const fs = require('fs');
const path = require('path');
const { execFile, execSync } = require('child_process');

const PHOTO_DIR = path.join(__dirname, '..', 'data', 'photos');

function ensurePhotoDir() {
  if (!fs.existsSync(PHOTO_DIR)) {
    fs.mkdirSync(PHOTO_DIR, { recursive: true });
  }
}

function detectCommand() {
  // Newer Raspberry Pi OS uses rpicam-still; keep legacy options for compatibility.
  const candidates = ['rpicam-still', 'libcamera-still', 'raspistill'];
  for (const cmd of candidates) {
    try {
      execSync(`which ${cmd}`);
      return cmd;
    } catch (err) {
      continue;
    }
  }
  return null;
}

function buildFilename() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}.jpg`;
}

function takePhoto(commandHint) {
  return new Promise((resolve, reject) => {
    ensurePhotoDir();
    const filename = buildFilename();
    const filepath = path.join(PHOTO_DIR, filename);
    const cmd = commandHint || detectCommand();
    if (!cmd) {
      return reject(new Error('No camera command found (install libcamera-still or enable legacy raspistill).'));
    }

    const args = (cmd === 'rpicam-still' || cmd === 'libcamera-still')
      ? ['-n', '--immediate', '-o', filepath, '--width', '1920', '--height', '1080']
      : ['-n', '-o', filepath, '-w', '1920', '-h', '1080'];

    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      resolve({ filename, filepath, command: cmd });
    });
  });
}

function listPhotos(limit = 30) {
  ensurePhotoDir();
  const files = fs.readdirSync(PHOTO_DIR)
    .filter((f) => f.toLowerCase().endsWith('.jpg'))
    .sort()
    .reverse();
  return files.slice(0, limit).map((name) => ({
    name,
    url: `/photos/${name}`
  }));
}

module.exports = {
  takePhoto,
  listPhotos,
  PHOTO_DIR,
  detectCommand
};
