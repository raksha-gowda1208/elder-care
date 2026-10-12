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

  const resendApiKey = (
    customConfig?.resend_api_key ||
    process.env.RESEND_API_KEY ||
    ''
  ).trim();

  const brevoApiKey = (
    customConfig?.brevo_api_key ||
    process.env.BREVO_API_KEY ||
    ''
  ).trim();

  return { user, pass, host, port, from, resendApiKey, brevoApiKey };
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
    return 'Render Free Tier blocks raw SMTP ports (465 & 587). Add a free RESEND_API_KEY (from resend.com) in Settings or Environment to deliver via HTTPS Port 443.';
  }
  if (msg.includes('ECONNREFUSED')) {
    return 'Connection refused by SMTP server on specified port.';
  }
  return msg;
}

// ---------------------------------------------------------
// HTTPS Email API Providers (Bypass Render Free Tier Port Restrictions)
// ---------------------------------------------------------

async function sendViaResend(apiKey, to, subject, text, html, customFrom) {
  const startMs = Date.now();
  // On Resend free accounts without domain verification, sender is onboarding@resend.dev
  // and delivers to the account owner's email address.
  const from = customFrom && !customFrom.toLowerCase().includes('gmail.com')
    ? customFrom
    : 'ElderCare Emergency Alert <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: html || `<p>${text.replace(/</g, '&lt;')}</p>`,
        text
      })
    });

    const data = await res.json().catch(() => ({}));
    const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);

    if (res.ok && data.id) {
      console.log(`[RESEND HTTPS DELIVERED in ${durationSec}s] Alert dispatched to ${to} via Port 443`);
      return {
        sent: true,
        service: 'resend',
        messageId: data.id,
        recipient: to,
        durationSec,
        isHttpsApi: true
      };
    }

    const errMsg = data.message || `HTTP ${res.status}: ${JSON.stringify(data)}`;
    console.error('[RESEND API ERROR]', errMsg);
    return {
      sent: false,
      reason: `Resend API rejected delivery: ${errMsg}`
    };
  } catch (e) {
    console.error('[RESEND FETCH FAILED]', e.message);
    return { sent: false, reason: `Resend connection failed: ${e.message}` };
  }
}

async function sendViaBrevo(apiKey, to, subject, text, html, senderEmail, senderName) {
  const startMs = Date.now();
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: senderName || 'ElderCare Safety',
          email: senderEmail || 'alerts@eldercare.internal'
        },
        to: [{ email: to }],
        subject,
        htmlContent: html || `<p>${text.replace(/</g, '&lt;')}</p>`,
        textContent: text
      })
    });

    const data = await res.json().catch(() => ({}));
    const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);

    if (res.ok && (data.messageId || data.id)) {
      console.log(`[BREVO HTTPS DELIVERED in ${durationSec}s] Alert dispatched to ${to} via Port 443`);
      return {
        sent: true,
        service: 'brevo',
        messageId: data.messageId || data.id,
        recipient: to,
        durationSec,
        isHttpsApi: true
      };
    }

    const errMsg = data.message || `HTTP ${res.status}`;
    console.error('[BREVO API ERROR]', errMsg);
    return {
      sent: false,
      reason: `Brevo API rejected: ${errMsg}`
    };
  } catch (e) {
    console.error('[BREVO FETCH FAILED]', e.message);
    return { sent: false, reason: `Brevo connection failed: ${e.message}` };
  }
}

// ---------------------------------------------------------
// Raw SMTP Transporter (for local dev, paid Render, or SMTP-enabled hosts)
// ---------------------------------------------------------

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

  // 1. Check for HTTPS Email APIs first (Port 443 is NEVER blocked by Render Free Tier)
  if (creds.resendApiKey) {
    return await sendViaResend(creds.resendApiKey, to, subject, text, html, creds.from);
  }

  if (creds.brevoApiKey) {
    return await sendViaBrevo(creds.brevoApiKey, to, subject, text, html, creds.user, 'ElderCare Alerts');
  }

  // 2. Direct SMTP delivery
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
      reason: 'Email alerts not configured: Add a free RESEND_API_KEY (from resend.com) or enter your Gmail & App Password in Caregiver Settings.'
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

  // If using Resend API
  if (creds.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/api-keys', {
        headers: { 'Authorization': `Bearer ${creds.resendApiKey}` }
      });
      if (res.ok) return { valid: true, service: 'resend' };
      return { valid: false, error: 'Invalid Resend API Key' };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  if (!creds.user || !creds.pass) {
    return { valid: false, error: 'Gmail Address and 16-letter App Password (or Resend API Key) are required' };
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
