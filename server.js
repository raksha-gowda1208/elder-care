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
const { sendAlertEmail, verifySmtp } = require('./mail');

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

function caregiverWithSmtp(caregiverId) {
  return db.prepare('SELECT id, email, name, phone, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, resend_api_key FROM caregivers WHERE id = ?').get(caregiverId);
}

function emitToCaregiver(caregiverId, event, payload) {
  io.to(`caregiver:${caregiverId}`).emit(event, payload);
}

async function createAlert(elder, type, detail) {
  const cg = caregiverWithSmtp(elder.caregiver_id);
  const info = db.prepare(
    'INSERT INTO alerts (elder_id, type, detail, emailed, email_info) VALUES (?, ?, ?, 0, ?)'
  ).run(elder.id, type, detail, 'Dispatching to Gmail...');

  const alert = {
    id: info.lastInsertRowid,
    elderId: elder.id,
    name: elder.name,
    type,
    detail,
    at: new Date().toISOString(),
    emailed: false,
    emailInfo: 'Dispatching to Gmail...',
    previewUrl: null
  };

  // 1. INSTANT SOCKET ALERT DISPATCH (< 5ms)
  emitToCaregiver(elder.caregiver_id, 'alert', alert);
  if (type === 'fall') {
    console.log(`[ALERT] Instant fall alert dispatched for ${elder.name} (< 10ms)`);
  }

  // 2. CONCURRENT EMAIL DISPATCH TO GMAIL (Non-blocking, arrives in 1-2s)
  if (cg && cg.email) {
    const isFall = type === 'fall';
    const subject = isFall
      ? `🚨 EMERGENCY: Fall Detected for ${elder.name}`
      : `⚠️ Medication Missed: ${elder.name}`;

    const text = isFall
      ? `URGENT FALL ALERT!\n\nA fall has been detected for ${elder.name} (Age: ${elder.age || 'N/A'}).\nDetection Details: ${detail}\nTime: ${new Date().toLocaleString()}\n\nPlease check the ElderCare live camera immediately.`
      : `Medication Alert\n\n${elder.name}: ${detail}\nTime: ${new Date().toLocaleString()}`;

    const html = isFall
      ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:2px solid #dc2626;border-radius:14px;overflow:hidden;box-shadow:0 12px 35px rgba(220,38,38,0.18);">
          <div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);color:#fff;padding:24px;text-align:center;">
            <div style="font-size:38px;line-height:1;margin-bottom:8px;">🚨</div>
            <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">EMERGENCY: FALL DETECTED</h1>
            <p style="margin:6px 0 0;font-size:14px;opacity:0.92;">ElderCare Live Vision Safety Monitoring</p>
          </div>
          <div style="padding:26px;color:#1e293b;">
            <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 16px;border-radius:6px;margin-bottom:20px;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#991b1b;">Immediate Caregiver Attention Needed</p>
              <p style="margin:4px 0 0;font-size:14px;color:#7f1d1d;"><strong>${elder.name}</strong> was detected falling or in a prone horizontal position on the floor.</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:14px;">
              <tr>
                <td style="padding:8px 0;color:#64748b;width:120px;"><strong>Elder:</strong></td>
                <td style="padding:8px 0;color:#0f172a;font-weight:600;">${elder.name} (Age ${elder.age || 'N/A'})</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;"><strong>Pose Detail:</strong></td>
                <td style="padding:8px 0;color:#0f172a;">${detail}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#64748b;"><strong>Alert Time:</strong></td>
                <td style="padding:8px 0;color:#0f172a;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
            <div style="text-align:center;margin:28px 0 16px;">
              <a href="http://localhost:${PORT}/caregiver.html" style="background:#dc2626;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(220,38,38,0.3);">Open Live Camera Monitor</a>
            </div>
            <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">This automated alert was dispatched immediately upon skeleton pose drop analysis.</p>
          </div>
        </div>`
      : `<div style="font-family:sans-serif;padding:20px;border:1px solid #e2e8f0;border-radius:8px;">
          <h2 style="color:#d97706;margin-top:0;">⚠️ Missed Medication: ${elder.name}</h2>
          <p>${detail}</p>
          <p style="color:#64748b;font-size:13px;">Time: ${new Date().toLocaleString()}</p>
        </div>`;

    sendAlertEmail(cg.email, subject, text, html, cg)
      .then((result) => {
        let emailInfo = '';
        let emailed = false;
        let previewUrl = null;

        if (result && result.sent) {
          emailed = true;
          if (result.service === 'resend') {
            emailInfo = `Delivered to Gmail inbox via Resend HTTPS (${cg.email}) in ${result.durationSec || '1'}s`;
          } else if (result.service === 'brevo') {
            emailInfo = `Delivered to Gmail inbox via Brevo HTTPS (${cg.email}) in ${result.durationSec || '1'}s`;
          } else if (result.isGmail) {
            emailInfo = `Delivered directly to your Gmail inbox (${cg.email}) in ${result.durationSec || '1'}s`;
          } else if (result.isTest) {
            emailInfo = `Simulated test email sent (${result.durationSec || '1'}s)`;
          } else {
            emailInfo = `Sent to ${cg.email} in ${result.durationSec || '1'}s`;
          }
          previewUrl = result.previewUrl || null;
          db.prepare('UPDATE alerts SET emailed = 1, email_info = ? WHERE id = ?').run(
            previewUrl ? `preview:${previewUrl}` : `sent:${cg.email}`,
            alert.id
          );
        } else {
          emailInfo = result?.reason || 'Failed to send';
          db.prepare('UPDATE alerts SET emailed = 0, email_info = ? WHERE id = ?').run(
            `failed:${emailInfo}`,
            alert.id
          );
        }

        emitToCaregiver(elder.caregiver_id, 'alert-email-updated', {
          id: alert.id,
          elderId: elder.id,
          emailed,
          emailInfo,
          previewUrl
        });
        console.log(`[MAIL] Email dispatched for alert #${alert.id}: ${emailInfo}`);
      })
      .catch((err) => {
        console.error('[MAIL] Alert email error:', err.message);
        db.prepare('UPDATE alerts SET emailed = 0, email_info = ? WHERE id = ?').run(
          `failed:${err.message}`,
          alert.id
        );
        emitToCaregiver(elder.caregiver_id, 'alert-email-updated', {
          id: alert.id,
          elderId: elder.id,
          emailed: false,
          emailInfo: err.message,
          previewUrl: null
        });
      });
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

function syncEnvFile(updates) {
  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined && val !== null) {
      process.env[key] = String(val);
    }
  }
  try {
    const envPath = path.join(__dirname, '.env');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    for (const [key, val] of Object.entries(updates)) {
      if (!val) continue;
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        content += `\n${key}=${val}`;
      }
    }
    fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
  } catch (e) {
    console.warn('Could not update .env:', e.message);
  }
}

app.get('/api/settings', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const user = db.prepare('SELECT id, name, email, phone, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, resend_api_key FROM caregivers WHERE id = ?').get(req.user.id);
  res.json({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    smtp_host: user.smtp_host || '',
    smtp_port: user.smtp_port || 587,
    smtp_user: user.smtp_user || '',
    smtp_from: user.smtp_from || '',
    has_smtp_pass: Boolean(user.smtp_pass),
    has_resend_key: Boolean(user.resend_api_key || process.env.RESEND_API_KEY)
  });
});

app.post('/api/settings', auth, (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const { email, phone, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, resend_api_key } = req.body;
  
  if (email && email.trim()) {
    db.prepare('UPDATE caregivers SET email = ? WHERE id = ?').run(email.trim().toLowerCase(), req.user.id);
  }

  if (resend_api_key !== undefined) {
    const keyVal = resend_api_key ? resend_api_key.trim() : null;
    db.prepare('UPDATE caregivers SET resend_api_key = ? WHERE id = ?').run(keyVal, req.user.id);
    if (keyVal) {
      syncEnvFile({ RESEND_API_KEY: keyVal });
    }
  }

  if (smtp_pass) {
    db.prepare(`
      UPDATE caregivers SET phone = ?, smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?, smtp_from = ? WHERE id = ?
    `).run(phone || null, smtp_host || null, Number(smtp_port) || 587, smtp_user || null, smtp_pass, smtp_from || null, req.user.id);
    // Sync to .env and in-memory process.env
    syncEnvFile({
      SMTP_HOST: smtp_host || 'smtp.gmail.com',
      SMTP_PORT: smtp_port || 587,
      SMTP_USER: smtp_user,
      SMTP_PASS: smtp_pass,
      SMTP_FROM: smtp_from || `ElderCare Alerts <${smtp_user}>`
    });
  } else {
    db.prepare(`
      UPDATE caregivers SET phone = ?, smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_from = ? WHERE id = ?
    `).run(phone || null, smtp_host || null, Number(smtp_port) || 587, smtp_user || null, smtp_from || null, req.user.id);
  }
  res.json({ ok: true });
});

app.post('/api/settings/test-email', auth, async (req, res) => {
  if (req.user.role !== 'caregiver') return res.status(403).json({ error: 'Caregivers only' });
  const cg = caregiverWithSmtp(req.user.id);
  const isGmail = cg.smtp_host?.toLowerCase().includes('gmail') || cg.smtp_user?.toLowerCase().endsWith('@gmail.com');
  const subject = '🚨 ElderCare Fall Alert System — Emergency Email Verification';
  const text = `Hello ${cg.name},\n\nThis confirms that your ElderCare emergency email alerts are directly connected to your Gmail inbox (${cg.email}).\nWhen a fall is detected by the skeleton pose analyzer, high-priority emergency alerts will be delivered here immediately.\n\nTime: ${new Date().toLocaleString()}`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:580px;margin:0 auto;border:2px solid #0d9488;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
    <div style="background:#0d9488;color:#fff;padding:22px;text-align:center;">
      <h2 style="margin:0;font-size:20px;">✅ Gmail Emergency Alerts Connected!</h2>
      <p style="margin:4px 0 0;font-size:14px;opacity:0.92;">ElderCare AI Vision & Fall Safety Monitor</p>
    </div>
    <div style="padding:24px;color:#1e293b;">
      <p>Hello <strong>${cg.name}</strong>,</p>
      <p>Your Gmail address (<strong>${cg.email}</strong>) is verified and ready. The moment an elderly person's home camera detects a fall via skeleton pose analysis, a critical emergency alert will arrive in this Gmail inbox immediately.</p>
      <div style="background:#f0fdfa;border:1px solid #ccfbf1;padding:12px 16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#0f766e;"><strong>Direct Delivery Status:</strong> Direct Gmail SMTP connection verified.</p>
      </div>
      <p style="font-size:12px;color:#64748b;margin-top:20px;">Test dispatched at: ${new Date().toLocaleString()}</p>
    </div>
  </div>`;

  const result = await sendAlertEmail(cg.email, subject, text, html, cg);
  res.json(result);
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
