require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('./db');

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const AUDIO_DIR = path.join(__dirname, 'data', 'audio');
const PHOTOS_DIR = path.join(__dirname, 'data', 'photos');
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 5e6
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '10mb' }));

// Serve local MediaPipe assets with permissive CORS for WASM and assets
app.use('/vendor', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/vendor/mediapipe/pose', express.static(path.join(__dirname, 'node_modules', '@mediapipe', 'pose')));
app.use('/vendor/mediapipe/camera_utils', express.static(path.join(__dirname, 'node_modules', '@mediapipe', 'camera_utils')));
app.use('/vendor/mediapipe/drawing_utils', express.static(path.join(__dirname, 'node_modules', '@mediapipe', 'drawing_utils')));
app.use('/vendor/mediapipe/tasks-vision', express.static(path.join(__dirname, 'node_modules', '@mediapipe', 'tasks-vision')));

// Serve elderly reference photos with permissive CORS so canvas image sampling never gets tainted
app.use('/photos', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(PHOTOS_DIR));

app.use(express.static(path.join(__dirname, 'public')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

const socketsByUser = new Map();

function tokenFor(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired' });
  }
}

function pairingCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[crypto.randomInt(alphabet.length)];
  const exists = db.prepare('SELECT id FROM elders WHERE code = ?').get(code);
  return exists ? pairingCode() : code;
}

function elderForUser(user, elderId) {
  const elder = db.prepare('SELECT * FROM elders WHERE id = ?').get(elderId);
  if (!elder) return null;
  if (user.role === 'caregiver' && elder.caregiver_id === user.id) return elder;
  if (user.role === 'elder' && elder.id === user.id) return elder;
  return null;
}


function emitToCaregiver(caregiverId, event, payload) {
  io.to(`caregiver:${caregiverId}`).emit(event, payload);
}

async function createAlert(elder, type, detail) {
  const info = db.prepare(
    'INSERT INTO alerts (elder_id, type, detail, emailed, email_info) VALUES (?, ?, ?, 1, ?)'
  ).run(elder.id, type, detail, 'System desktop & siren notification dispatched');

  const alert = {
    id: info.lastInsertRowid,
    elderId: elder.id,
    name: elder.name,
    type,
    detail,
    at: new Date().toISOString()
  };

  // INSTANT SOCKET ALERT DISPATCH (< 5ms)
  emitToCaregiver(elder.caregiver_id, 'alert', alert);
  if (type === 'fall') {
    console.log(`[ALERT] Instant fall alert dispatched for ${elder.name} (< 10ms)`);
  }

  return alert;
}

app.post('/api/register', authLimiter, (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required' });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare(
      'INSERT INTO caregivers (name, email, password_hash) VALUES (?, ?, ?)'
    ).run(name, email, hash);
    const token = tokenFor({ role: 'caregiver', id: info.lastInsertRowid, email });
    res.json({ token, name });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(400).json({ error: 'That email is already registered' });
    }
    throw err;
  }
});

app.post('/api/login', authLimiter, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM caregivers WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({
    token: tokenFor({ role: 'caregiver', id: user.id, email: user.email }),
    name: user.name
  });
});

app.post('/api/elder-login', authLimiter, (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const elder = db.prepare('SELECT * FROM elders WHERE code = ?').get(code);
  if (!elder) return res.status(401).json({ error: 'Unknown pairing code' });
  res.json({
    token: tokenFor({ role: 'elder', id: elder.id, caregiverId: elder.caregiver_id }),
    elder: {
      id: elder.id,
      name: elder.name,
      age: elder.age,
      code: elder.code,
      photo: elder.photo || null,
      preferred_lang: elder.preferred_lang || 'en'
    }
  });
});

app.get('/api/me', auth, (req, res) => {
  if (req.user.role === 'caregiver') {
    const user = db.prepare('SELECT id, name, email, phone, smtp_host, smtp_port, smtp_user, smtp_from FROM caregivers WHERE id = ?').get(req.user.id);
    return res.json({ role: 'caregiver', ...user });
  }
  const elder = db.prepare('SELECT id, name, age, code, photo, preferred_lang FROM elders WHERE id = ?').get(req.user.id);
  res.json({ role: 'elder', ...elder });
});

app.get('/api/settings', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const user = db.prepare('SELECT id, name, email, phone FROM caregivers WHERE id = ?').get(req.user.id);
  res.json({
    name: user.name,
    email: user.email,
    phone: user.phone || ''
  });
});

app.post('/api/settings', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const { email, phone } = req.body;
  
  if (email && email.trim()) {
    db.prepare('UPDATE caregivers SET email = ? WHERE id = ?').run(email.trim().toLowerCase(), req.user.id);
  }
  if (phone !== undefined) {
    db.prepare('UPDATE caregivers SET phone = ? WHERE id = ?').run(phone || null, req.user.id);
  }
  res.json({ ok: true });
});

app.post('/api/settings/test-alert', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  emitToCaregiver(req.user.id, 'alert', {
    id: Date.now(),
    elderId: 0,
    name: 'Caregiver Device Test',
    type: 'fall',
    detail: 'TEST ALERT: Triggered desktop notification and audible siren to verify background alerts.',
    at: new Date().toISOString()
  });
  res.json({ ok: true, message: 'Test background notification dispatched' });
});

app.get('/api/elders', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const rows = db.prepare(
    'SELECT id, name, age, code, notes, photo, preferred_lang, created_at FROM elders WHERE caregiver_id = ? ORDER BY name'
  ).all(req.user.id);
  res.json(rows.map((e) => ({
    ...e,
    online: socketsByUser.has(`elder:${e.id}`)
  })));
});

app.post('/api/elders', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const name = String(req.body.name || '').trim();
  const age = Number(req.body.age);
  const notes = String(req.body.notes || '').trim();
  const preferred_lang = String(req.body.preferred_lang || 'en').trim().toLowerCase();
  const photoData = req.body.photo;
  if (!name || !age) return res.status(400).json({ error: 'Name and age are required' });
  const code = pairingCode();
  const info = db.prepare(
    'INSERT INTO elders (caregiver_id, name, age, code, notes, preferred_lang, photo) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, name, age, code, notes || null, preferred_lang, null);

  const elderId = info.lastInsertRowid;
  let photoUrl = null;

  if (photoData && typeof photoData === 'string' && photoData.startsWith('data:image')) {
    try {
      const comma = photoData.indexOf(',');
      const buf = Buffer.from(photoData.slice(comma + 1), 'base64');
      const filename = `${elderId}.jpg`;
      fs.writeFileSync(path.join(PHOTOS_DIR, filename), buf);
      photoUrl = `/photos/${filename}`;
      db.prepare('UPDATE elders SET photo = ? WHERE id = ?').run(photoUrl, elderId);
    } catch (e) {
      console.warn('Failed to save elder photo:', e.message);
    }
  }

  res.json({ id: elderId, name, age, code, notes, preferred_lang, photo: photoUrl });
});

app.post('/api/elders/:id/photo', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const elder = elderForUser(req.user, Number(req.params.id));
  if (!elder) return res.status(404).json({ error: 'Elderly person not found' });
  const photoData = req.body.photo;
  if (!photoData || typeof photoData !== 'string' || !photoData.startsWith('data:image')) {
    return res.status(400).json({ error: 'Valid image data is required' });
  }

  try {
    const comma = photoData.indexOf(',');
    const buf = Buffer.from(photoData.slice(comma + 1), 'base64');
    const filename = `${elder.id}.jpg`;
    fs.writeFileSync(path.join(PHOTOS_DIR, filename), buf);
    const photoUrl = `/photos/${filename}?v=${Date.now()}`;
    db.prepare('UPDATE elders SET photo = ? WHERE id = ?').run(photoUrl, elder.id);
    io.to(`elder:${elder.id}`).emit('photo-updated', { photo: photoUrl });
    io.to(`caregiver:${req.user.id}`).emit('elder-photo-updated', { elderId: elder.id, photo: photoUrl });
    res.json({ ok: true, photo: photoUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/elders/:id/lang', auth, (req, res) => {
  const elder = elderForUser(req.user, Number(req.params.id));
  if (!elder) return res.status(404).json({ error: 'Elderly person not found' });
  const lang = String(req.body.lang || 'en').trim().toLowerCase();
  db.prepare('UPDATE elders SET preferred_lang = ? WHERE id = ?').run(lang, elder.id);
  io.to(`elder:${elder.id}`).emit('lang-updated', { lang });
  res.json({ ok: true, lang });
});

app.get('/api/elders/:id/meds', auth, (req, res) => {
  const elder = elderForUser(req.user, Number(req.params.id));
  if (!elder) return res.status(404).json({ error: 'Elderly person not found' });
  const today = localDate();
  const rows = db.prepare(`
    SELECT m.id, m.name, m.dosage, m.message, m.lang, m.date, m.time, m.daily, m.has_audio,
           l.status as today_status, l.taken_at
    FROM medications m
    LEFT JOIN medication_logs l ON l.med_id = m.id AND l.for_date = ?
    WHERE m.elder_id = ?
    ORDER BY m.time, m.name
  `).all(today, elder.id);
  res.json(rows);
});

app.post('/api/elders/:id/meds', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const elder = elderForUser(req.user, Number(req.params.id));
  if (!elder) return res.status(404).json({ error: 'Elderly person not found' });
  const name = String(req.body.name || '').trim();
  const time = String(req.body.time || '').trim();
  const daily = req.body.daily ? 1 : 0;
  const date = daily ? null : String(req.body.date || '').trim();
  const lang = String(req.body.lang || elder.preferred_lang || 'en').trim().toLowerCase();
  if (!name || !time) return res.status(400).json({ error: 'Medicine name and time are required' });
  if (!daily && !date) return res.status(400).json({ error: 'Pick a date, or enable daily repeat' });

  let hasAudio = 0;
  const info = db.prepare(`
    INSERT INTO medications (elder_id, name, dosage, message, lang, date, time, daily, has_audio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    elder.id,
    name,
    String(req.body.dosage || '').trim(),
    String(req.body.message || '').trim(),
    lang,
    date,
    time,
    daily
  );

  const audio = req.body.audio;
  if (audio && typeof audio === 'string' && audio.startsWith('data:audio')) {
    const comma = audio.indexOf(',');
    const buf = Buffer.from(audio.slice(comma + 1), 'base64');
    if (buf.length > 3 * 1024 * 1024) {
      db.prepare('DELETE FROM medications WHERE id = ?').run(info.lastInsertRowid);
      return res.status(400).json({ error: 'Voice clip must be under 3 MB' });
    }
    fs.writeFileSync(path.join(AUDIO_DIR, `${info.lastInsertRowid}.webm`), buf);
    db.prepare('UPDATE medications SET has_audio = 1 WHERE id = ?').run(info.lastInsertRowid);
    hasAudio = 1;
  }

  // Notify elder client to refresh meds
  io.to(`elder:${elder.id}`).emit('meds-updated');

  res.json({ id: info.lastInsertRowid, has_audio: hasAudio });
});

app.delete('/api/meds/:id', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const med = db.prepare(`
    SELECT m.id, m.elder_id, e.caregiver_id FROM medications m
    JOIN elders e ON e.id = m.elder_id WHERE m.id = ?
  `).get(Number(req.params.id));
  if (!med || med.caregiver_id !== req.user.id) {
    return res.status(404).json({ error: 'Reminder not found' });
  }
  db.prepare('DELETE FROM medications WHERE id = ?').run(med.id);
  const audioPath = path.join(AUDIO_DIR, `${med.id}.webm`);
  if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  io.to(`elder:${med.elder_id}`).emit('meds-updated');
  res.json({ ok: true });
});

app.get('/api/meds/:id/audio', auth, (req, res) => {
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(Number(req.params.id));
  if (!med) return res.status(404).json({ error: 'Not found' });
  if (!elderForUser(req.user, med.elder_id)) return res.status(404).json({ error: 'Not found' });
  const audioPath = path.join(AUDIO_DIR, `${med.id}.webm`);
  if (!fs.existsSync(audioPath)) return res.status(404).json({ error: 'No voice clip' });
  res.setHeader('Content-Type', 'audio/webm');
  res.sendFile(audioPath);
});

// Trigger medication reminder immediately for live demonstration/testing
app.post('/api/meds/:id/trigger', auth, (req, res) => {
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(Number(req.params.id));
  if (!med) return res.status(404).json({ error: 'Reminder not found' });
  if (!elderForUser(req.user, med.elder_id)) return res.status(403).json({ error: 'Forbidden' });
  io.to(`elder:${med.elder_id}`).emit('ring-med', med);
  res.json({ ok: true, message: 'Voice reminder dispatched to elderly device' });
});

app.post('/api/meds/:id/taken', auth, (req, res) => {
  if (req.user.role !== 'elder') return res.status(403).json({ error: 'Elderly device only' });
  const med = db.prepare('SELECT * FROM medications WHERE id = ? AND elder_id = ?')
    .get(Number(req.params.id), req.user.id);
  if (!med) return res.status(404).json({ error: 'Reminder not found' });
  const today = localDate();
  db.prepare(`
    INSERT INTO medication_logs (med_id, elder_id, status, for_date, for_time, taken_at)
    VALUES (?, ?, 'taken', ?, ?, datetime('now'))
    ON CONFLICT(med_id, for_date, for_time) DO UPDATE SET
      status = 'taken', taken_at = datetime('now')
  `).run(med.id, med.elder_id, today, med.time);

  const elder = db.prepare('SELECT * FROM elders WHERE id = ?').get(med.elder_id);
  emitToCaregiver(elder.caregiver_id, 'med-taken', {
    elderId: elder.id,
    name: med.name,
    how: String(req.body && req.body.how || 'Spoken confirmation'),
    at: new Date().toISOString()
  });
  res.json({ ok: true });
});

app.get('/api/elders/:id/alerts', auth, (req, res) => {
  const elder = elderForUser(req.user, Number(req.params.id));
  if (!elder) return res.status(404).json({ error: 'Elderly person not found' });
  const rows = db.prepare(
    'SELECT id, type, detail, emailed, email_info, created_at FROM alerts WHERE elder_id = ? ORDER BY id DESC LIMIT 50'
  ).all(elder.id);
  res.json(rows);
});

// Trigger simulated fall alert for testing & demonstration
app.post('/api/elders/:id/test-fall', auth, async (req, res) => {
  const elder = elderForUser(req.user, Number(req.params.id));
  if (!elder) return res.status(404).json({ error: 'Elderly person not found' });
  try {
    const alert = await createAlert(elder, 'fall', 'SIMULATION / TEST: Skeleton pose detected a rapid drop into a prone floor position');
    res.json({ ok: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path.startsWith('/vendor')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function localDate() {
  return new Date().toLocaleDateString('en-CA');
}

function localTime() {
  return new Date().toTimeString().slice(0, 5);
}

function minutesNow() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function checkMissedMeds() {
  const date = localDate();
  const nowMin = minutesNow();
  const meds = db.prepare('SELECT * FROM medications').all();
  for (const m of meds) {
    if (!m.daily && m.date !== date) continue;
    const [h, mi] = m.time.split(':').map(Number);
    const due = h * 60 + mi;
    if (nowMin < due + 10) continue;
    const existing = db.prepare(
      'SELECT id FROM medication_logs WHERE med_id = ? AND for_date = ? AND for_time = ?'
    ).get(m.id, date, m.time);
    if (existing) continue;
    db.prepare(`
      INSERT INTO medication_logs (med_id, elder_id, status, for_date, for_time)
      VALUES (?, ?, 'missed', ?, ?)
    `).run(m.id, m.elder_id, date, m.time);
    const elder = db.prepare('SELECT * FROM elders WHERE id = ?').get(m.elder_id);
    if (elder) {
      createAlert(elder, 'missed_med', `${m.name}${m.dosage ? ` (${m.dosage})` : ''} was not taken at ${m.time}`).catch((err) => {
        console.error('Missed-med alert failed:', err.message);
      });
    }
  }
}

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    socket.user = jwt.verify(token, SECRET);
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  if (user.role === 'caregiver') {
    socket.join(`caregiver:${user.id}`);
    socketsByUser.set(`caregiver:${user.id}`, socket.id);
  } else if (user.role === 'elder') {
    socket.join(`elder:${user.id}`);
    socketsByUser.set(`elder:${user.id}`, socket.id);
    const elder = db.prepare('SELECT caregiver_id FROM elders WHERE id = ?').get(user.id);
    if (elder) emitToCaregiver(elder.caregiver_id, 'elder-status', { elderId: user.id, online: true });
  }

  // Caregiver wants to watch elderly video
  socket.on('watch', ({ elderId }) => {
    if (user.role !== 'caregiver') return;
    const elder = elderForUser(user, Number(elderId));
    if (!elder) return;
    io.to(`elder:${elder.id}`).emit('watch', { from: socket.id });
  });

  // WebRTC signaling
  socket.on('signal', ({ to, data }) => {
    if (!to || !data) return;
    io.to(to).emit('signal', { from: socket.id, data });
  });

  // High-reliability canvas video frame relay fallback
  socket.on('elder-frame', ({ image }) => {
    if (user.role !== 'elder') return;
    const elder = db.prepare('SELECT caregiver_id FROM elders WHERE id = ?').get(user.id);
    if (elder) {
      emitToCaregiver(elder.caregiver_id, 'elder-frame', { elderId: user.id, image });
    }
  });

  // Telemetry relay (posture, angle, stability)
  socket.on('elder-posture', (data) => {
    if (user.role !== 'elder') return;
    const elder = db.prepare('SELECT caregiver_id FROM elders WHERE id = ?').get(user.id);
    if (elder) {
      emitToCaregiver(elder.caregiver_id, 'elder-posture', { elderId: user.id, ...data });
    }
  });

  // Skeleton Pose Fall detected
  socket.on('fall', async (data) => {
    if (user.role !== 'elder') return;
    const elder = db.prepare('SELECT * FROM elders WHERE id = ?').get(user.id);
    if (!elder) return;
    try {
      const detail = data?.detail || 'Skeleton pose detected a rapid downward drop into a prone floor position';
      await createAlert(elder, 'fall', detail);
    } catch (err) {
      console.error('Fall alert failed:', err.message);
    }
  });

  socket.on('disconnect', () => {
    if (user.role === 'caregiver') socketsByUser.delete(`caregiver:${user.id}`);
    if (user.role === 'elder') {
      socketsByUser.delete(`elder:${user.id}`);
      const elder = db.prepare('SELECT caregiver_id FROM elders WHERE id = ?').get(user.id);
      if (elder) emitToCaregiver(elder.caregiver_id, 'elder-status', { elderId: user.id, online: false });
    }
  });
});

setInterval(checkMissedMeds, 30 * 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ElderCare running at http://0.0.0.0:${PORT}`);
});
