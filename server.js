const express = require('express');
const cron = require('node-cron');
const path = require('path');
const { loadConfig, saveConfig } = require('./lib/store');
const { takePhoto, listPhotos, PHOTO_DIR } = require('./lib/camera');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/photos', express.static(PHOTO_DIR));

let cronTasks = [];

function clearJobs() {
  cronTasks.forEach((task) => task.stop());
  cronTasks = [];
}

function scheduleJobs() {
  clearJobs();
  const config = loadConfig();
  const { times, timezone } = config;
  times.forEach((time) => {
    const [hour, minute] = time.split(':');
    const expression = `${minute} ${hour} * * *`; // minute hour * * *
    const task = cron.schedule(
      expression,
      async () => {
        try {
          await takePhoto();
          console.log(`Captured photo at ${time}`);
        } catch (err) {
          console.error('Capture failed:', err.message);
        }
      },
      { timezone }
    );
    cronTasks.push(task);
  });
  console.log('Scheduled jobs for', times.join(', '), 'TZ:', config.timezone);
}

app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

app.post('/api/config', (req, res) => {
  const { times, timezone } = req.body;
  if (!Array.isArray(times) || times.some((t) => !/^\d{2}:\d{2}$/.test(t))) {
    return res.status(400).json({ error: 'times must be array of HH:MM strings' });
  }
  const config = { times, timezone: timezone || 'UTC' };
  saveConfig(config);
  scheduleJobs();
  res.json({ ok: true, config });
});

app.post('/api/capture', async (req, res) => {
  try {
    const result = await takePhoto();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/photos', (req, res) => {
  res.json({ photos: listPhotos() });
});

app.listen(PORT, () => {
  scheduleJobs();
  console.log(`PhotoPi server listening on port ${PORT}`);
});
