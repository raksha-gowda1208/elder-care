const nodemailer = require('nodemailer');

let cachedEtherealTransporter = null;

// Pre-warm test transporter in background only if simulator mode is explicitly enabled
if (process.env.ENABLE_ETHEREAL_SIMULATOR === 'true') {
  (async function preWarmTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedEtherealTransporter = {
        transporter: nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
          connectionTimeout: 10000,
          socketTimeout: 10000
        }),
        from: `"ElderCare Alert System (Test Simulator)" <${testAccount.user}>`,
        isTest: true
      };
      console.log('[MAIL] Pre-warmed background test transporter ready.');
    } catch (err) {
      // Ignored
    }
  })();
}

function getCredentials(customConfig) {
  // Support caregiver DB fields and all common cloud environment variable aliases
  const user = (
    customConfig?.smtp_user ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    ''
  ).trim();

  let pass = (
    customConfig?.smtp_pass ||
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_PASS ||
    ''
  ).trim();

  if (pass) {
    // Remove all whitespace (Google App Passwords are 16 chars usually shown as "xxxx xxxx xxxx xxxx")
    pass = pass.replace(/\s+/g, '');
  }

  const host = (
    customConfig?.smtp_host ||
    process.env.SMTP_HOST ||
    process.env.EMAIL_HOST ||
    'smtp.gmail.com'
  ).trim();

  const port = Number(
    customConfig?.smtp_port ||
    process.env.SMTP_PORT ||
    process.env.EMAIL_PORT ||
    587
  );

  const from = (
    customConfig?.smtp_from ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    (user ? `"ElderCare Emergency Safety" <${user}>` : '')
  ).trim();

  return { user, pass, host, port, from };
}

function humanizeError(err) {
  const msg = String(err?.message || err || '');
  if (msg.includes('535') || msg.includes('Username and Password not accepted') || msg.includes('BadCredentials') || msg.includes('Invalid login')) {
    return 'Gmail rejected credentials (535). Ensure 2-Step Verification is ON and you generated a 16-character App Password at https://myaccount.google.com/apppasswords.';
  }
  if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
    return 'Could not resolve SMTP server. Check internet connection or host address.';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timeout') || msg.includes('ESOCKETTIMEDOUT')) {
    return 'SMTP connection timed out after 20s. Render or host network may be throttling SMTP connections.';
  }
  if (msg.includes('ECONNREFUSED')) {
    return 'Connection refused by SMTP server on specified port.';
  }
  return msg;
}

function createTransportForPort(creds, port) {
  const isGmail = creds.host.toLowerCase().includes('gmail') || creds.user.toLowerCase().endsWith('@gmail.com');
  const host = isGmail ? 'smtp.gmail.com' : creds.host;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: {
      user: creds.user,
      pass: creds.pass
    },
    // Increased timeouts for cloud hosting (Render, Heroku, AWS containers)
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false
    }
  });
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
        auth: { user: testAccount.user, pass: testAccount.pass },
        connectionTimeout: 10000,
        socketTimeout: 10000
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

async function sendAlertEmail(to, subject, text, html, customConfig = null) {
  const startMs = Date.now();
  if (!to) return { sent: false, reason: 'Recipient email address is missing' };

  const creds = getCredentials(customConfig);

  // If credentials are missing, check if test simulator is enabled
  if (!creds.user || !creds.pass) {
    if (process.env.ENABLE_ETHEREAL_SIMULATOR === 'true') {
      const sim = await getOrCreateTestTransporter();
      if (sim) {
        try {
          const info = await sim.transporter.sendMail({
            from: sim.from,
            to,
            subject,
            text,
            html: html || `<p>${text.replace(/</g, '&lt;')}</p>`,
            priority: 'high'
          });
          const previewUrl = nodemailer.getTestMessageUrl(info);
          return {
            sent: true,
            isTest: true,
            previewUrl,
            recipient: to,
            durationSec: ((Date.now() - startMs) / 1000).toFixed(1)
          };
        } catch (e) {
          // ignore
        }
      }
    }

    console.warn(`[MAIL NOT SENT] Cannot dispatch alert to ${to}: Gmail credentials are missing.`);
    return {
      sent: false,
      reason: 'Gmail alerts not configured: Please set SMTP_USER and SMTP_PASS in Render Environment Variables, or enter your Gmail and App Password in Caregiver Settings.'
    };
  }

  const isGmail = creds.host.toLowerCase().includes('gmail') || creds.user.toLowerCase().endsWith('@gmail.com');
  
  // Decide ports to attempt: for Gmail, port 587 (STARTTLS) is standard on cloud, with 465 (SSL) fallback
  const portsToTry = isGmail
    ? (creds.port === 465 ? [465, 587] : [587, 465])
    : [creds.port];

  const payload = {
    from: creds.from || `"ElderCare Emergency Safety" <${creds.user}>`,
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

  let lastErr = null;

  for (const port of portsToTry) {
    try {
      console.log(`[MAIL] Dispatching emergency alert to ${to} via ${isGmail ? 'smtp.gmail.com' : creds.host}:${port}...`);
      const transporter = createTransportForPort(creds, port);
      const info = await transporter.sendMail(payload);
      const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);

      console.log(`[DIRECT GMAIL SENT in ${durationSec}s via port ${port}] Alert dispatched to ${to}`);
      return {
        sent: true,
        isTest: false,
        isGmail,
        messageId: info.messageId,
        recipient: to,
        durationSec,
        portUsed: port
      };
    } catch (err) {
      lastErr = err;
      console.error(`[MAIL ERROR on port ${port}]:`, err.message);

      // If credentials failed authentication (535), don't retry another port; password is incorrect
      const msg = String(err?.message || '');
      if (msg.includes('535') || msg.includes('Username and Password not accepted') || msg.includes('BadCredentials') || msg.includes('Invalid login')) {
        break;
      }
    }
  }

  return { sent: false, reason: humanizeError(lastErr) };
}

async function verifySmtp(customConfig) {
  const creds = getCredentials(customConfig);
  if (!creds.user || !creds.pass) {
    return { valid: false, error: 'Gmail Address and 16-letter App Password are required' };
  }

  try {
    const transporter = createTransportForPort(creds, creds.port || 587);
    await transporter.verify();
    return { valid: true };
  } catch (err) {
    const isGmail = creds.host.includes('gmail') || creds.user.endsWith('@gmail.com');
    if (isGmail && creds.port !== 465) {
      try {
        const fallback = createTransportForPort(creds, 465);
        await fallback.verify();
        return { valid: true, port: 465 };
      } catch (fErr) {
        return { valid: false, error: humanizeError(fErr) };
      }
    }
    return { valid: false, error: humanizeError(err) };
  }
}

module.exports = { sendAlertEmail, verifySmtp };
