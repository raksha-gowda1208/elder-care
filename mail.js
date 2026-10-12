const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedConfigKey = '';
let cachedEtherealTransporter = null;

// Pre-warm test transporter in background so first call is instantaneous
(async function preWarmTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedEtherealTransporter = {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        pool: true,
        auth: { user: testAccount.user, pass: testAccount.pass },
        connectionTimeout: 4000,
        socketTimeout: 4000
      }),
      from: `"ElderCare Alert System (Test Simulator)" <${testAccount.user}>`,
      isTest: true
    };
    console.log('[MAIL] Pre-warmed background test transporter ready.');
  } catch (err) {
    // Will retry on demand if needed
  }
})();

function getTransporter(customConfig) {
  const host = (customConfig?.smtp_host || process.env.SMTP_HOST || '').trim();
  const user = (customConfig?.smtp_user || process.env.SMTP_USER || '').trim();
  let pass = (customConfig?.smtp_pass || process.env.SMTP_PASS || '').trim();
  let port = Number(customConfig?.smtp_port || process.env.SMTP_PORT || 465);

  if (pass) {
    pass = pass.replace(/\s+/g, '');
  }

  const isGmail = host.toLowerCase().includes('gmail') || user.toLowerCase().endsWith('@gmail.com');
  const configKey = `${isGmail ? 'gmail' : host}:${port}:${user}:${pass}`;

  if (user && pass) {
    if (cachedTransporter && cachedConfigKey === configKey) {
      return cachedTransporter;
    }

    let transporter;
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        pool: true,
        maxConnections: 3,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      });
    } else {
      transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port: port || 465,
        secure: port === 465,
        auth: { user, pass },
        pool: true,
        maxConnections: 3,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        tls: { rejectUnauthorized: false }
      });
    }

    cachedConfigKey = configKey;
    cachedTransporter = {
      transporter,
      from: customConfig?.smtp_from || process.env.SMTP_FROM || `"ElderCare Emergency Safety" <${user}>`,
      isTest: false,
      isGmail
    };
    return cachedTransporter;
  }

  return null;
}

async function getOrCreateTestTransporter() {
  if (cachedEtherealTransporter) return cachedEtherealTransporter;
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedEtherealTransporter = {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        pool: true,
        auth: { user: testAccount.user, pass: testAccount.pass },
        connectionTimeout: 4000,
        socketTimeout: 4000
      }),
      from: `"ElderCare Alert System (Test Simulator)" <${testAccount.user}>`,
      isTest: true
    };
    return cachedEtherealTransporter;
  } catch (err) {
    console.warn('Could not create Ethereal test account:', err.message);
    return null;
  }
}

function humanizeError(err) {
  const msg = String(err?.message || err || '');
  if (msg.includes('535') || msg.includes('Username and Password not accepted') || msg.includes('BadCredentials')) {
    return 'Gmail rejected credentials. Make sure you use a 16-character App Password (not standard account password) generated at myaccount.google.com/apppasswords';
  }
  if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
    return 'Could not reach SMTP server. Please check internet connection.';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
    return 'Connection timed out. Check SMTP Host and Port.';
  }
  return msg;
}

async function sendAlertEmail(to, subject, text, html, customConfig = null) {
  const startMs = Date.now();
  if (!to) return { sent: false, reason: 'missing_recipient' };

  let config = getTransporter(customConfig);
  let isSimulated = false;

  if (!config) {
    config = await getOrCreateTestTransporter();
    if (!config) {
      return {
        sent: false,
        reason: 'Gmail is not configured. Enter your Gmail & App Password in Caregiver Settings to send directly to Gmail.'
      };
    }
    isSimulated = true;
  }

  const payload = {
    from: config.from,
    to,
    subject,
    text,
    html: html || `<p>${text.replace(/</g, '&lt;')}</p>`,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      Importance: 'high'
    }
  };

  try {
    const info = await config.transporter.sendMail(payload);
    const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);
    let previewUrl = null;
    if (config.isTest) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[SIMULATED EMAIL in ${durationSec}s] Alert preview: ${previewUrl}`);
    } else {
      console.log(`[DIRECT GMAIL SENT in ${durationSec}s] Fall alert dispatched to ${to}`);
    }
    return {
      sent: true,
      isTest: config.isTest,
      isGmail: Boolean(config.isGmail),
      previewUrl,
      messageId: info.messageId,
      recipient: to,
      durationSec
    };
  } catch (err) {
    console.error('Fast email attempt failed:', err.message);
    return { sent: false, reason: humanizeError(err) };
  }
}

async function verifySmtp(config) {
  const t = getTransporter(config);
  if (!t) return { valid: false, error: 'Gmail Username and App Password are required' };
  try {
    await t.transporter.verify();
    return { valid: true };
  } catch (err) {
    return { valid: false, error: humanizeError(err) };
  }
}

module.exports = { sendAlertEmail, verifySmtp };
