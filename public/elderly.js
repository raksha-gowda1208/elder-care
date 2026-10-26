// ElderCare Elderly Dashboard — Real-Time Pose Fall Detection & Multi-Lingual Voice Assistant

const token = localStorage.token;
const elder = JSON.parse(localStorage.elder || 'null');
if (!token || !elder) location.href = '/';

// DOM Elements
const hi = document.getElementById('hi');
const currentTimeEl = document.getElementById('currentTime');
const startBanner = document.getElementById('startBanner');
const monitorCard = document.getElementById('monitorCard');
const startBtn = document.getElementById('start');
const cam = document.getElementById('cam');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const stat = document.getElementById('stat');
const statText = document.getElementById('statText');
const postureBadge = document.getElementById('postureBadge');
const postureText = document.getElementById('postureText');
const angleVal = document.getElementById('angleVal');
const fpsVal = document.getElementById('fpsVal');
const poseHint = document.getElementById('poseHint');
const fallWarningOverlay = document.getElementById('fallWarningOverlay');
// Alarm Modal
const alarm = document.getElementById('alarm');
const modalBadgeText = document.getElementById('modalBadgeText');
const atext = document.getElementById('atext');
const adosage = document.getElementById('adosage');
const amsg = document.getElementById('amsg');
const medTimeBadge = document.getElementById('medTimeBadge');
const listenText = document.getElementById('listenText');
const speechBubble = document.getElementById('speechBubble');
const micWave = document.getElementById('micWave');
const takenBtn = document.getElementById('taken');
const modalSubhint = document.getElementById('modalSubhint');

// Emergency Fall Modal
const fallEl = document.getElementById('fall');
const okBtn = document.getElementById('ok');
const fallStatusText = document.getElementById('fallStatusText');
const sosBtn = document.getElementById('sosBtn');
const testFallBtn = document.getElementById('testFallBtn');
const testMedBtn = document.getElementById('testMedBtn');
const testKnMedBtn = document.getElementById('testKnMedBtn');
const testHiMedBtn = document.getElementById('testHiMedBtn');
const toggleSkeletonBtn = document.getElementById('toggleSkeletonBtn');
const logoutBtn = document.getElementById('logout');

hi.textContent = 'Hello, ' + (elder.name || 'Friend');

function updateClock() {
  const d = new Date();
  currentTimeEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Sync latest elder profile from server
async function syncElderProfile() {
  try {
    const res = await fetch('/api/me', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        elder.name = data.name;
        hi.textContent = 'Hello, ' + (elder.name || 'Friend');
      }
    }
  } catch (e) {
    console.warn('[PROFILE] Sync notice:', e.message);
  }
}
syncElderProfile();

// Multi-Language Localization
const I18N = {
  en: {
    code: 'en-IN',
    speechLang: 'en-US',
    pillDue: '💊 Medication Due',
    title: (med) => `Time for ${med.name}`,
    instruction: 'Say <span class="keyword">“Taken”</span> or <span class="keyword">“Done”</span>',
    listening: 'Listening… say “Taken” or “Done”',
    iTookItBtn: '✓ I Took It (Confirm)',
    subhint: 'This reminder repeats with voice every 11 seconds until confirmed.',
    spoken: (elderName, medName, dose) =>
      `Hello ${elderName}, it is time to take your ${medName}${dose ? ', ' + dose : ''}. Please take your medicine and say taken or done.`,
    spokenRepeat: (medName) =>
      `Reminder: Please take your ${medName} and say taken or done.`,
    acknowledged: (elderName) =>
      `Thank you ${elderName}, medicine marked as taken.`
  },
  kn: {
    code: 'kn-IN',
    speechLang: 'kn-IN',
    pillDue: '💊 ಔಷಧಿ ಸಮಯ',
    title: (med) => `${med.name} ಔಷಧಿ ಸಮಯ`,
    instruction: 'ಹೇಳಿ: <span class="keyword">“ತಗೊಂಡೆ”</span> ಅಥವಾ <span class="keyword">“ಆಯಿತು”</span>',
    listening: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ… “ತಗೊಂಡೆ” ಅಥವಾ “ಆಯಿತು” ಎಂದು ಹೇಳಿ',
    iTookItBtn: '✓ ತಗೊಂಡೆ (ಖಚಿತಪಡಿಸಿ)',
    subhint: 'ಧ್ವನಿ ಪ್ರತಿಕ್ರಿಯೆ ಬರುವವರೆಗೆ ಈ ಜ್ಞಾಪನೆ ಪುನರಾವರ್ತನೆಯಾಗುತ್ತದೆ.',
    spoken: (elderName, medName, dose) =>
      `ನಮಸ್ಕಾರ ${elderName}, ನಿಮ್ಮ ${medName} ${dose || ''} ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ. ದಯವಿಟ್ಟು ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಂಡು ತಗೊಂಡೆ ಅಥವಾ ಆಯಿತು ಎಂದು ಹೇಳಿ.`,
    spokenRepeat: (medName) =>
      `ನೆನಪಿಕೆ: ದಯವಿಟ್ಟು ನಿಮ್ಮ ${medName} ಔಷಧಿ ತೆಗೆದುಕೊಂಡು ತಗೊಂಡೆ ಅಥವಾ ಆಯಿತು ಎಂದು ಹೇಳಿ.`,
    acknowledged: (elderName) =>
      `ಧನ್ಯವಾದಗಳು ${elderName}, ಔಷಧಿಯನ್ನು ತಗೊಂಡಿದ್ದೀರಿ ಎಂದು ದಾಖಲಿಸಲಾಗಿದೆ.`
  },
  hi: {
    code: 'hi-IN',
    speechLang: 'hi-IN',
    pillDue: '💊 दवाई का समय',
    title: (med) => `${med.name} लेने का समय`,
    instruction: 'बोलें: <span class="keyword">“ले लिया”</span> या <span class="keyword">“हो गया”</span>',
    listening: 'सुन रहे हैं… “ले लिया” या “हो गया” बोलें',
    iTookItBtn: '✓ ले लिया (कंफर्म करें)',
    subhint: 'जब तक आप बोलकर पुष्टि नहीं करेंगे, यह याद दिलाता रहेगा।',
    spoken: (elderName, medName, dose) =>
      `नमस्ते ${elderName}, आपकी दवाई ${medName} ${dose || ''} लेने का समय हो गया है। कृपया दवाई लेकर ले लिया या हो गया बोलें।`,
    spokenRepeat: (medName) =>
      `याद दिलाना: कृपया अपनी दवाई ${medName} लें और ले लिया या हो गया बोलें।`,
    acknowledged: (elderName) =>
      `धन्यवाद ${elderName}, दवाई ले ली गई है।`
  }
};

let currentLang = localStorage.elderLang || elder.preferred_lang || 'en';

function setLanguage(lang) {
  if (!I18N[lang]) lang = 'en';
  currentLang = lang;
  localStorage.elderLang = lang;

  document.querySelectorAll('.lang-chip, .modal-lang-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  if (curMed) {
    applyModalLanguage(curMed);
  }
}

function applyModalLanguage(med) {
  modalBadgeText.textContent = '💊 Medication Due · ಔಷಧಿ ಸಮಯ';
  atext.textContent = med ? `Time for ${med.name}` : 'Time for your medicine';
  speechBubble.innerHTML = 'Reply in ANY language: Say <span class="keyword">“Taken”</span> · <span class="keyword">“ತಗೊಂಡೆ”</span> · <span class="keyword">“ಆಯಿತು”</span> · <span class="keyword">“ले लिया”</span>';
  listenText.textContent = '🎙️ Listening for reply in English, ಕನ್ನಡ, or हिन्दी…';
  takenBtn.textContent = '✓ I Took It · ತಗೊಂಡೆ · ले लिया (Confirm)';
  modalSubhint.textContent = 'Speak naturally in English, Kannada, or Hindi without touching any buttons.';
}

// Multi-Lingual Speech Recognition Engine (Accepts replies in all languages simultaneously)
const MULTI_LANG_CODES = ['kn-IN', 'en-IN', 'hi-IN'];
let multiLangIndex = 0;

// 1. Kannada Affirmation Matcher (Native script, Kanglish transliterations & speech-to-text phonetic mishearings)
const KANNADA_CONFIRM_REGEX = new RegExp([
  '(ತಗೊಂಡೆ|ತಗೊಂಡಿದ್ದೀನಿ|ತಗೊಂಡಿದೀನಿ|ತಗೊಂಡಾಯ್ತು|ತಗೊಂಡೆವು|ತಗೊಂಡ್ವಿ|ಆಯಿತು|ಆಯ್ತು|ಆಯಿತಪ್ಪ|ಆಯ್ತಪ್ಪ|ಮುಗೀತು|ಮುಗಿಯಿತು|ಹೌದು|ಕುಡಿದೆ|ಹಾಕೊಂಡೆ|ತೊಗೊಂಡೆ|ತಗೋಂಡೆ|ತಗೊಂಡು|ಔಷಧಿ ತಗೊಂಡೆ|ಟೇಕನ್)',
  '\\b(thagonde|tagonde|thagondeen|thagondeeni|tagondeen|tagondeeni|thogonde|togonde|thogondhe|togondhe|thogondideeni|togondideeni|tagond|thogond|tagonda|thagonda|tagondi|thagondi|aythu|aayithu|aithu|aaytu|aitho|aytu|aitu|aithappa|aaythappa|mugithu|mugitu|mugiyithu|mugiside|haudu|houdu|howdu|kudide|kudidhe|kudde|hakonde|haakonde|hakondhe|took on the|took onde|tag on the|the gande|the\\s*gunday|the\\s*gun\\s*day|the\\s*gunde|the\\s*gonde|the\\s*gandi|the\\s*gonday|the\\s*goonday|the\\s*konday|the\\s*konde|to\\s*gunday|to\\s*gonde|to\\s*goonday|tagunday|thagunday|took\\s*on\\s*day|gunday|gun\\s*day|gunde|eye\\s*to|i\\s*too|i2)\\b'
].join('|'), 'i');

// 2. Hindi Affirmation Matcher (Native script & Hinglish transliterations)
const HINDI_CONFIRM_REGEX = new RegExp([
  '(ले\\s*लिया|ले\\s*ली|खा\\s*लिया|खा\\s*ली|हो\\s*गया|हो\\s*गई|पी\\s*लिया|पी\\s*ली|दवाई\\s*ले\\s*ली|दवा\\s*खा\\s*ली|दवाई\\s*खा\\s*ली|हाँ|खत्म|हाँ\\s*ले\\s*लिया|ले\\s*चुके|खा\\s*चुके|दवा\\s*ली|दवाई\\s*ली)',
  '\\b(le\\s*liya|leliya|le\\s*li|leli|lay\\s*liya|le\\s*lia|lilia|kha\\s*liya|khaliya|kha\\s*li|khali|khalia|ho\\s*gaya|hogaya|ho\\s*gya|hogya|ho\\s*gayi|hogayi|pee\\s*liya|peeliya|pi\\s*liya|piliya|haan|khatam|dawa\\s*li|dawai\\s*li)\\b'
].join('|'), 'i');

// 3. English Affirmation Matcher
const ENGLISH_CONFIRM_REGEX = new RegExp([
  '\\b(taken|took\\s*it|i\\s*took|i\\s*took\\s*it|i\\s*have\\s*taken|already\\s*taken|already\\s*took|i\\s*already\\s*took|done|all\\s*done|finished|complete|completed|yes|yeah|yep|yup|okay|ok|alright|all\\s*right|had\\s*it|did\\s*it|i\\s*did|got\\s*it|swallowed|consumed|drank\\s*it|sure)\\b'
].join('|'), 'i');

// 4. Combined Master Matcher
const CONFIRM_REGEX_ALL = new RegExp([
  KANNADA_CONFIRM_REGEX.source,
  HINDI_CONFIRM_REGEX.source,
  ENGLISH_CONFIRM_REGEX.source
].join('|'), 'i');

function matchMultiLangConfirmation(text) {
  if (!text) return null;
  const clean = text.toLowerCase().trim();

  // Check Kannada (Native script, Kanglish, and English STT phonetic mishearings like "the gunday")
  if (KANNADA_CONFIRM_REGEX.test(clean)) {
    const isAythu = /(ಆಯಿತು|ಆಯ್ತು|aythu|aithu|aaytu|aitho|aitu|eye\s*to|i\s*too)/i.test(clean);
    return { langCode: 'kn', langName: 'Kannada / ಕನ್ನಡ', matched: isAythu ? 'ಆಯಿತು' : 'ತಗೊಂಡೆ' };
  }

  // Check Hindi
  if (HINDI_CONFIRM_REGEX.test(clean)) {
    const isHoGaya = /(हो\s*गया|हो\s*गई|hogaya|ho\\s*gaya|ho\\s*gya|hogya)/i.test(clean);
    return { langCode: 'hi', langName: 'Hindi / हिन्दी', matched: isHoGaya ? 'हो गया' : 'ले लिया' };
  }

  // Check English
  if (ENGLISH_CONFIRM_REGEX.test(clean)) {
    const isDone = /(done|finished|complete)/i.test(clean);
    const isYes = /(yes|yeah|yep|yup|okay|ok|sure)/i.test(clean);
    return { langCode: 'en', langName: 'English', matched: isDone ? 'Done' : isYes ? 'Yes' : 'Taken' };
  }

  // Fallback Check
  if (CONFIRM_REGEX_ALL.test(clean)) {
    return { langCode: 'multi', langName: 'Multi-Lingual', matched: 'Confirmed / ತಗೊಂಡೆ' };
  }

  return null;
}

// API Helper
const api = (p, m = 'GET', b) => fetch('/api' + p, {
  method: m,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  },
  body: b && JSON.stringify(b)
}).then((r) => r.json());

const socket = io({ auth: { token } });

// Audio Context for sirens and chimes
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

let sirenOscillator = null;
let sirenInterval = null;

function playSiren() {
  stopSiren();
  try {
    const c = getAudioContext();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    gain.gain.value = 0.25;
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    sirenOscillator = osc;
    let up = true;
    sirenInterval = setInterval(() => {
      if (!sirenOscillator) return;
      osc.frequency.setValueAtTime(up ? 850 : 500, c.currentTime);
      up = !up;
    }, 280);
  } catch (e) {
    console.warn('Audio siren failed:', e);
  }
}

function stopSiren() {
  if (sirenInterval) { clearInterval(sirenInterval); sirenInterval = null; }
  if (sirenOscillator) {
    try { sirenOscillator.stop(); sirenOscillator.disconnect(); } catch {}
    sirenOscillator = null;
  }
}

function playSuccessChime() {
  try {
    const c = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
    notes.forEach((freq, idx) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, c.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + idx * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + idx * 0.12);
      osc.stop(c.currentTime + idx * 0.12 + 0.4);
    });
  } catch {}
}

function playAlertChime() {
  try {
    const c = getAudioContext();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, c.currentTime);
    osc.frequency.setValueAtTime(660, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.55);
  } catch {}
}

// State
let stream;
let meds = [];
const fired = {};
let curMed = null;
let reminderAudio = null;
let recognition = null;
let listenWanted = false;
let speakBusy = false;
let showSkeleton = true;
const peers = {};

// Fall Detection State
let poseModel = null;
let isProcessingFrame = false;
let frameCount = 0;
let lastFpsTime = performance.now();
let lastRelayTime = 0;

// Biomechanical History
const historyBuffer = [];
let lastDropAt = 0;
let horizontalSince = 0;
let lastFallAt = 0;
let currentPosture = 'Standing';
let reminderLoop = 0;

function setStatus(text, kind = 'ok') {
  statText.textContent = text;
  stat.className = 'status-chip ' + kind;
}



function findBestVoice(langCode) {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Match exact prefix, e.g. "kn", "hi", "en"
  const prefix = langCode.slice(0, 2).toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ||
         voices.find((v) => v.lang.toLowerCase().includes('in')) ||
         voices[0];
}

function say(text, targetLang = currentLang) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    try { speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const dict = I18N[targetLang] || I18N.en;
    u.lang = dict.code;
    const voice = findBestVoice(dict.code);
    if (voice) u.voice = voice;
    u.rate = targetLang === 'en' ? 0.88 : 0.82;
    u.pitch = 1.0;
    u.onend = finish;
    u.onerror = finish;
    setTimeout(() => {
      try { speechSynthesis.speak(u); } catch { finish(); }
    }, 60);
    setTimeout(finish, Math.min(22000, 4000 + text.length * 90));
  });
}

// WebRTC video sharing with caregiver
socket.on('watch', async ({ from }) => {
  if (!stream) return;
  const pc = peers[from] = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  pc.onicecandidate = (e) => e.candidate && socket.emit('signal', { to: from, data: { ice: e.candidate } });
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('signal', { to: from, data: { sdp: pc.localDescription } });
});

socket.on('signal', async ({ from, data }) => {
  const pc = peers[from];
  if (!pc) return;
  if (data.sdp) await pc.setRemoteDescription(data.sdp);
  if (data.ice) pc.addIceCandidate(data.ice);
});

// Periodic frame relay to caregiver (ensures video always works without WebRTC NAT issues)
function maybeRelayFrame() {
  const now = performance.now();
  if (now - lastRelayTime < 1200) return; // ~1 FPS snapshot relay
  lastRelayTime = now;
  try {
    if (cam.videoWidth > 0 && overlay.width > 0) {
      const thumb = document.createElement('canvas');
      thumb.width = 360;
      thumb.height = Math.round(360 * (cam.videoHeight / cam.videoWidth || 0.75));
      const tctx = thumb.getContext('2d');
      tctx.drawImage(cam, 0, 0, thumb.width, thumb.height);
      tctx.drawImage(overlay, 0, 0, thumb.width, thumb.height);
      const dataUrl = thumb.toDataURL('image/jpeg', 0.55);
      socket.emit('elder-frame', { image: dataUrl });
    }
  } catch {}
}

// Meds Schedule
const loadMeds = async () => {
  try {
    const rows = await api(`/elders/${elder.id}/meds`);
    if (Array.isArray(rows)) meds = rows;
  } catch {}
};
setInterval(loadMeds, 25000);
socket.on('meds-updated', loadMeds);

// Language sync from caregiver
socket.on('lang-updated', ({ lang }) => setLanguage(lang));

// Check if meds due
setInterval(() => {
  const d = new Date();
  const date = d.toLocaleDateString('en-CA');
  const time = d.toTimeString().slice(0, 5);
  meds.forEach((m) => {
    const key = `${m.id}_${date}_${time}`;
    if (m.time === time && (m.daily || m.date === date) && !fired[key]) {
      fired[key] = true;
      ring(m);
    }
  });
}, 3000);

// Immediate trigger from caregiver dashboard
socket.on('ring-med', (m) => ring(m));

function SpeechRec() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function haltRecognition() {
  if (!recognition) return;
  const rec = recognition;
  recognition = null;
  rec.onresult = null;
  rec.onerror = null;
  rec.onend = null;
  try { rec.abort(); } catch {
    try { rec.stop(); } catch {}
  }
}

function startListening() {
  const Rec = SpeechRec();
  if (!Rec) {
    listenText.textContent = 'Voice input not supported in this browser. Tap button.';
    micWave.classList.remove('active');
    return;
  }
  if (!listenWanted || !curMed || speakBusy) return;
  if (recognition) return;

  try {
    const rec = new Rec();
    // Multi-lingual listener: seamlessly alternate across en-IN, kn-IN, hi-IN
    const activeListenLang = MULTI_LANG_CODES[multiLangIndex % MULTI_LANG_CODES.length];
    rec.lang = activeListenLang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 5;

    rec.onstart = () => {
      listenText.textContent = '🎙️ Listening for reply in English, ಕನ್ನಡ, or हिन्दी…';
      micWave.classList.add('active');
    };

    rec.onresult = (ev) => {
      let matched = null;
      let rawText = '';

      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        // Inspect all speech hypothesis alternatives
        for (let a = 0; a < ev.results[i].length; a++) {
          const candidate = (ev.results[i][a].transcript || '').trim();
          if (!rawText && candidate) rawText = candidate;

          const check = matchMultiLangConfirmation(candidate);
          if (check) {
            matched = check;
            matched.fullPhrase = candidate;
            break;
          }
        }
        if (matched) break;
      }

      if (rawText) {
        speechBubble.innerHTML = `Listening… Heard: <strong style="color:#38bdf8">“${rawText}”</strong>`;
      }

      if (matched) {
        speechBubble.innerHTML = `✅ <strong style="color:#10b981">Recognized [${matched.langName}]: “${matched.matched}”</strong>`;
        confirmTaken(`voice [${matched.langCode}]: ${matched.matched} (transcript: "${rawText}")`, matched.langCode);
      }
    };

    rec.onerror = (ev) => {
      const err = ev && ev.error;
      if (err === 'not-allowed') {
        listenWanted = false;
        listenText.textContent = 'Microphone blocked. Please tap confirmation button.';
        micWave.classList.remove('active');
        haltRecognition();
        return;
      }
      if (err === 'no-speech' || err === 'audio-capture' || err === 'network') {
        listenText.textContent = '🎙️ Listening for reply in English, ಕನ್ನಡ, or हिन्दी…';
      }
    };

    rec.onend = () => {
      if (recognition === rec) recognition = null;
      if (listenWanted && curMed && !speakBusy) {
        // Rotate recognition language so native scripts across en-IN, kn-IN, hi-IN are all captured
        multiLangIndex = (multiLangIndex + 1) % MULTI_LANG_CODES.length;
        setTimeout(() => {
          if (listenWanted && curMed && !speakBusy && !recognition) startListening();
        }, 200);
      }
    };

    recognition = rec;
    rec.start();
  } catch (err) {
    recognition = null;
    listenText.textContent = 'Could not start microphone. Tap confirmation button.';
    micWave.classList.remove('active');
  }
}

function stopMic() {
  listenWanted = false;
  micWave.classList.remove('active');
  haltRecognition();
}

async function playClip(url) {
  if (reminderAudio) {
    reminderAudio.pause();
    reminderAudio.src = '';
  }
  reminderAudio = new Audio(url);
  reminderAudio.preload = 'auto';
  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    reminderAudio.onended = finish;
    reminderAudio.onerror = finish;
    reminderAudio.play().catch(finish);
    setTimeout(finish, 18000);
  });
}

async function playReminder(m) {
  speakBusy = true;
  haltRecognition();
  listenText.textContent = 'Playing reminder…';
  micWave.classList.remove('active');
  playAlertChime();

  if (m.has_audio) {
    try {
      const res = await fetch('/api/meds/' + m.id + '/audio', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const blob = await res.blob();
      await playClip(URL.createObjectURL(blob));
      speakBusy = false;
      return;
    } catch {}
  }

  // Multi-lingual spoken reminder: prompts elder and explicitly welcomes replies in English, Kannada, or Hindi
  const spoken = m.message || (m.lang === 'kn'
    ? `ನಮಸ್ಕಾರ ${elder.name}, ನಿಮ್ಮ ${m.name} ${m.dosage || ''} ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ. ದಯವಿಟ್ಟು ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಂಡು ತಗೊಂಡೆ, Taken ಅಥವಾ ಆಯಿತು ಎಂದು ಹೇಳಿ.`
    : m.lang === 'hi'
    ? `नमस्ते ${elder.name}, आपकी दवाई ${m.name} ${m.dosage || ''} लेने का समय हो गया है। कृपया दवाई लेकर ले लिया, Taken या हो गया बोलें।`
    : `Hello ${elder.name}, it is time to take your ${m.name}${m.dosage ? ', ' + m.dosage : ''}. You can reply in any language: say Taken, ತಗೊಂಡೆ, or ले लिया.`);

  await say(spoken, m.lang || 'en');
  speakBusy = false;
}

async function ring(m) {
  curMed = m;
  const tokenId = ++reminderLoop;
  applyModalLanguage(m);
  adosage.textContent = m.dosage ? m.dosage : 'Standard dose';
  amsg.textContent = m.message || 'Please take your medication and confirm by voice in English, ಕನ್ನಡ, or हिन्दी.';
  medTimeBadge.textContent = m.time || 'Due Now';

  alarm.classList.remove('hidden');
  listenWanted = true;

  // Repeating Reminder Loop: speaks prompt, turns on microphone, repeats every 11s until confirmed
  while (curMed === m && reminderLoop === tokenId) {
    await playReminder(m);
    if (curMed !== m || reminderLoop !== tokenId) return;
    startListening();
    await new Promise((r) => setTimeout(r, 11000));
  }
}

async function confirmTaken(how, detectedLang = 'en') {
  if (!curMed) return;
  const med = curMed;
  curMed = null;
  reminderLoop += 1;
  speakBusy = false;
  if (reminderAudio) {
    reminderAudio.pause();
    reminderAudio = null;
  }
  stopMic();
  alarm.classList.add('hidden');
  try { speechSynthesis.cancel(); } catch {}
  
  playSuccessChime();

  // Acknowledge dynamically in the language the elder replied in!
  if (detectedLang === 'kn') {
    say(`ಧನ್ಯವಾದಗಳು ${elder.name}, ಔಷಧಿಯನ್ನು ತಗೊಂಡಿದ್ದೀರಿ ಎಂದು ದಾಖಲಿಸಲಾಗಿದೆ.`, 'kn');
  } else if (detectedLang === 'hi') {
    say(`धन्यवाद ${elder.name}, आपकी दवाई ले ली गई है।`, 'hi');
  } else {
    say(`Thank you ${elder.name}, medicine marked as taken.`, 'en');
  }

  await fetch('/api/meds/' + med.id + '/taken', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ how })
  });

  setStatus(`Medicine marked as taken (${(detectedLang || 'multi').toUpperCase()} voice)`, 'ok');
}

takenBtn.onclick = () => confirmTaken('button tap', 'manual');

// Biomechanical Landmarks Calculation
function getLandmark(lm, idx, minVis = 0.25) {
  const p = lm[idx];
  if (!p || (p.visibility !== undefined && p.visibility < minVis)) return null;
  return p;
}

function midpoint(p1, p2) {
  if (!p1 && !p2) return null;
  if (!p1) return p2;
  if (!p2) return p1;
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: ((p1.z || 0) + (p2.z || 0)) / 2
  };
}

function calculateTorsoAngle(sh, hp) {
  const dx = Math.abs(hp.x - sh.x);
  const dy = Math.max(0.001, hp.y - sh.y);
  return Math.atan2(dx, dy) * (180 / Math.PI);
}

function getBoundingBox(lm) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0, count = 0;
  for (let i = 0; i < lm.length; i++) {
    const p = lm[i];
    if (p && (p.visibility === undefined || p.visibility > 0.2)) {
      count++;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  const w = Math.max(0, maxX - minX);
  const h = Math.max(0, maxY - minY);
  return {
    count,
    minX, minY, maxX, maxY,
    w, h,
    aspectRatio: w / Math.max(0.05, h),
    centerY: (minY + maxY) / 2
  };
}

// Fall Analysis Engine
function analyzePose(landmarks, worldLandmarks) {
  const now = performance.now();

  const leftSh = getLandmark(landmarks, 11);
  const rightSh = getLandmark(landmarks, 12);
  const leftHp = getLandmark(landmarks, 23);
  const rightHp = getLandmark(landmarks, 24);
  const leftKn = getLandmark(landmarks, 25);
  const rightKn = getLandmark(landmarks, 26);
  const leftAn = getLandmark(landmarks, 27);
  const rightAn = getLandmark(landmarks, 28);

  const sh = midpoint(leftSh, rightSh);
  const hp = midpoint(leftHp, rightHp);

  if (!sh || !hp) {
    postureText.textContent = 'Searching…';
    postureBadge.className = 'telemetry-pill';
    return;
  }

  const kn = midpoint(leftKn, rightKn);
  const an = midpoint(leftAn, rightAn);
  const box = getBoundingBox(landmarks);

  let angle = calculateTorsoAngle(sh, hp);
  if (worldLandmarks && worldLandmarks.length > 24) {
    const wSh = midpoint(getLandmark(worldLandmarks, 11), getLandmark(worldLandmarks, 12));
    const wHp = midpoint(getLandmark(worldLandmarks, 23), getLandmark(worldLandmarks, 24));
    if (wSh && wHp) {
      const wdx = Math.hypot(wSh.x - wHp.x, (wSh.z || 0) - (wHp.z || 0));
      const wdy = Math.max(0.001, Math.abs(wSh.y - wHp.y));
      const wAngle = Math.atan2(wdx, wdy) * (180 / Math.PI);
      angle = angle * 0.6 + wAngle * 0.4;
    }
  }

  angleVal.textContent = Math.round(angle) + '°';

  // Record into sliding history window
  const torsoY = (sh.y + hp.y) / 2;
  historyBuffer.push({
    t: now,
    hipY: hp.y,
    torsoY,
    angle,
    boxH: box.h,
    aspectRatio: box.aspectRatio
  });
  while (historyBuffer.length && now - historyBuffer[0].t > 2200) {
    historyBuffer.shift();
  }

  // Velocity analysis: compare current elevation with highest elevation (lowest Y) in past 250ms - 1500ms
  const pastFrames = historyBuffer.filter((f) => now - f.t >= 250 && now - f.t <= 1600);
  let maxDrop = 0;
  let dropVelocity = 0;
  if (pastFrames.length > 0) {
    const highestPast = Math.min(...pastFrames.map((f) => f.torsoY));
    maxDrop = torsoY - highestPast;
    const oldestFrame = pastFrames[0];
    const dt = Math.max(0.2, (now - oldestFrame.t) / 1000);
    dropVelocity = maxDrop / dt;
  }

  // Posture Classification
  const isProneOrFloor =
    angle > 50 ||
    (hp.y > 0.65 && angle > 40) ||
    (box.aspectRatio > 1.25 && hp.y > 0.55) ||
    (sh.y > 0.65 && hp.y > 0.65 && Math.abs(sh.y - hp.y) < 0.12);

  const isSitting =
    !isProneOrFloor &&
    ((kn && hp.y > 0.48 && (kn.y - hp.y < 0.25) && angle < 35) ||
     (!kn && hp.y > 0.45 && angle < 30));

  const isBending =
    !isProneOrFloor && !isSitting && angle > 35 && hp.y < 0.65;

  const isStanding =
    !isProneOrFloor && !isSitting && !isBending && angle < 32 && hp.y < 0.70;

  if (isProneOrFloor) currentPosture = 'Lying / Floor';
  else if (isSitting) currentPosture = 'Sitting';
  else if (isBending) currentPosture = 'Bending';
  else currentPosture = 'Standing';

  postureText.textContent = currentPosture;
  postureBadge.className = 'telemetry-pill ' + (isProneOrFloor ? 'danger' : isBending ? 'warn' : 'ok');

  // Broadcast posture telemetry to caregiver
  socket.emit('elder-posture', {
    posture: currentPosture,
    angle: Math.round(angle),
    stability: isProneOrFloor ? 'Emergency' : isBending ? 'Tilting' : 'Stable'
  });

  // Sudden Drop Velocity threshold
  const suddenDrop = (dropVelocity > 0.24 && maxDrop > 0.13) ||
                     (maxDrop > 0.20 && angle > 45);

  if (suddenDrop) {
    lastDropAt = now;
    fallWarningOverlay.classList.remove('hidden');
    setTimeout(() => fallWarningOverlay.classList.add('hidden'), 1500);
  }

  // Case 1: Sudden Drop followed by Lying on floor (optimized to 400ms for < 10s alert!)
  const recentDrop = (now - lastDropAt < 6500);
  if (isProneOrFloor && recentDrop) {
    if (!horizontalSince) horizontalSince = now;
    setStatus('⚠️ Lying pose after drop — checking fall…', 'warn');
    if (now - horizontalSince > 400 && now - lastFallAt > 35000) {
      lastFallAt = now;
      triggerFall(`Skeleton pose detected a rapid drop into a lying position for ${elder.name}`);
    }
    return;
  }

  // Case 2: Prolonged floor collapse / immobility (optimized to 1500ms)
  if (isProneOrFloor && hp.y > 0.60) {
    if (!horizontalSince) horizontalSince = now;
    if (now - horizontalSince > 1500 && now - lastFallAt > 35000) {
      lastFallAt = now;
      triggerFall(`Prolonged floor lying position detected for ${elder.name}`);
    }
    return;
  }

  if (isStanding || isSitting) {
    horizontalSince = 0;
    setStatus('Vision safe · Monitoring posture', 'ok');
  }
}

// Trigger Emergency Fall Alert
function triggerFall(detail) {
  fallEl.classList.remove('hidden');
  fallStatusText.textContent = 'Caregiver alerted immediately via emergency siren and live dashboard!';
  playSiren();
  say('Fall detected! We are contacting your caregiver immediately.');

  socket.emit('fall', {
    detail: detail || 'Skeleton pose detected a sudden fall or lying posture on the floor'
  });
}

okBtn.onclick = () => {
  fallEl.classList.add('hidden');
  stopSiren();
  try { speechSynthesis.cancel(); } catch {}
  horizontalSince = 0;
  setStatus('Alert dismissed on this screen', 'ok');
};

sosBtn.onclick = () => {
  triggerFall('Manual emergency SOS button triggered by elderly person');
};

testFallBtn.onclick = () => {
  triggerFall('Demonstration / Simulation Fall Test');
};

testMedBtn.onclick = () => {
  ring({
    id: 9991,
    name: 'Daily Multivitamin & Aspirin',
    dosage: '1 tablet with water',
    message: '',
    time: 'Now',
    lang: 'en'
  });
};

testKnMedBtn.onclick = () => {
  ring({
    id: 9992,
    name: 'ಬಿಪಿ ಔಷಧಿ (Blood Pressure Tablet)',
    dosage: '1 ಮಾತ್ರೆ (1 tablet)',
    message: '',
    time: 'Now',
    lang: 'kn'
  });
};

testHiMedBtn.onclick = () => {
  ring({
    id: 9993,
    name: 'बीपी की गोली (Blood Pressure Tablet)',
    dosage: '1 गोली पानी के साथ',
    message: '',
    time: 'Now',
    lang: 'hi'
  });
};

toggleSkeletonBtn.onclick = () => {
  showSkeleton = !showSkeleton;
  toggleSkeletonBtn.textContent = showSkeleton ? '🦴 Hide Skeleton' : '🦴 Show Skeleton';
  if (!showSkeleton) ctx.clearRect(0, 0, overlay.width, overlay.height);
};

// Canvas Skeleton Rendering
function renderSkeleton(landmarks) {
  if (!landmarks || !showSkeleton) return;
  const w = overlay.width;
  const h = overlay.height;

  const color = currentPosture === 'Lying / Floor' ? '#ef4444' :
                currentPosture === 'Bending' ? '#f59e0b' : '#10b981';

  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  // Upper body connections
  const upperConnections = [
    [11, 12], // shoulders
    [11, 13], [13, 15], // left arm
    [12, 14], [14, 16], // right arm
    [11, 23], [12, 24], // torso sides
    [23, 24]  // waist/hips
  ];

  upperConnections.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    if (p1 && p2 && (p1.visibility ?? 1) > 0.30 && (p2.visibility ?? 1) > 0.30) {
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }
  });

  // Neck connection: midpoint of shoulders to nose 0
  const leftSh = landmarks[11];
  const rightSh = landmarks[12];
  const nose = landmarks[0];
  if (leftSh && rightSh && nose && (leftSh.visibility ?? 1) > 0.3 && (rightSh.visibility ?? 1) > 0.3 && (nose.visibility ?? 1) > 0.3) {
    const midX = (leftSh.x + rightSh.x) / 2;
    const midY = (leftSh.y + rightSh.y) / 2;
    ctx.beginPath();
    ctx.moveTo(midX * w, midY * h);
    ctx.lineTo(nose.x * w, nose.y * h);
    ctx.stroke();
  }

  // Lower body connections (only when clearly visible)
  const lowerConnections = [
    [23, 25], [25, 27], // left leg
    [24, 26], [26, 28]  // right leg
  ];

  lowerConnections.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    if (p1 && p2 && (p1.visibility ?? 1) > 0.40 && (p2.visibility ?? 1) > 0.40) {
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }
  });

  // Structural joint dots (neck, shoulders, elbows, wrists, hips, knees, ankles)
  const keyJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  ctx.shadowBlur = 12;
  keyJoints.forEach((idx) => {
    const p = landmarks[idx];
    if (p && (p.visibility ?? 1) > 0.35) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, idx === 0 ? 5 : 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 0 ? '#38bdf8' : '#f8fafc';
      ctx.fill();
    }
  });

  ctx.restore();
}

// MediaPipe Pose Callback
function onPoseResults(results) {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsVal.textContent = frameCount;
    frameCount = 0;
    lastFpsTime = now;
  }

  const vw = cam.videoWidth || 1280;
  const vh = cam.videoHeight || 720;
  if (overlay.width !== vw || overlay.height !== vh) {
    overlay.width = vw;
    overlay.height = vh;
  }

  // Clear canvas once per frame before drawing
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (results && results.poseLandmarks) {
    // 1. Draw Skeleton lines and joint dots
    renderSkeleton(results.poseLandmarks);
    // 2. Analyze Posture kinematics and check falls
    analyzePose(results.poseLandmarks, results.poseWorldLandmarks);
  } else {
    postureText.textContent = 'Searching…';
    postureBadge.className = 'telemetry-pill';
  }

  maybeRelayFrame();
}

// Start MediaPipe Pose
async function initPoseModel() {
  setStatus('Loading AI Pose Model…', 'ok');
  
  if (!window.Pose) {
    for (let i = 0; i < 8 && !window.Pose; i++) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  if (window.Pose) {
    poseModel = new window.Pose({
      locateFile: (file) => {
        return `/vendor/mediapipe/pose/${file}`;
      }
    });

    poseModel.setOptions({
      modelComplexity: 1, // Full neural network model with upper-body anchors
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    poseModel.onResults(onPoseResults);

    try {
      await poseModel.initialize();
      console.log('[POSE] MediaPipe Full Pose model initialized successfully');
    } catch (initErr) {
      console.warn('[POSE] Initialize notice:', initErr);
    }
    return;
  }

  throw new Error('MediaPipe Pose library is not available. Please check network connection.');
}

async function startCameraAndAI() {
  startBanner.classList.add('hidden');
  monitorCard.classList.remove('hidden');
  setStatus('Starting camera & AI…', 'ok');

  getAudioContext();

  try {
    await initPoseModel();

    // High performance webcam access: request ideal 1280x720 at 30fps
    let s;
    try {
      s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 }
        }
      });
    } catch (e1) {
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch (e2) {
        s = await navigator.mediaDevices.getUserMedia({ video: true });
      }
    }
    stream = s;
    cam.srcObject = s;
    await cam.play();

    // High performance RAF processing loop: runs at smooth 25-30 FPS without 1 FPS Windows Chromium throttle
    let loopActive = true;
    async function processLoop() {
      if (!loopActive) return;
      if (cam.readyState >= 2 && cam.videoWidth > 0 && poseModel && !isProcessingFrame) {
        isProcessingFrame = true;
        try {
          await poseModel.send({ image: cam });
        } catch (e) {
          console.warn('[POSE] Frame notice:', e);
        }
        isProcessingFrame = false;
      }
      requestAnimationFrame(processLoop);
    }
    requestAnimationFrame(processLoop);

    overlay.width = cam.videoWidth || 1280;
    overlay.height = cam.videoHeight || 720;

    setStatus('Vision safe · Monitoring posture', 'ok');
    poseHint.textContent = 'Stand, sit, or move freely. Fall detection is active.';

    await loadMeds();

    // Warm up speech synthesis
    try {
      const u = new SpeechSynthesisUtterance(' ');
      speechSynthesis.speak(u);
    } catch {}

    setLanguage(currentLang);

  } catch (err) {
    console.error('Initialization error:', err);
    startBanner.classList.remove('hidden');
    monitorCard.classList.add('hidden');
    setStatus('Camera or Pose error: ' + (err.message || err), 'danger');
    alert('Camera or Pose error: ' + (err.message || err));
  }
}

startBtn.onclick = startCameraAndAI;

// Automatically attempt camera start if permissions already available
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  setTimeout(() => {
    startCameraAndAI().catch(() => {
      startBanner.classList.remove('hidden');
      monitorCard.classList.add('hidden');
    });
  }, 400);
}

logoutBtn.onclick = () => {
  stopMic();
  stopSiren();
  if (stream) stream.getTracks().forEach((t) => t.stop());
  localStorage.clear();
  location.href = '/';
};
