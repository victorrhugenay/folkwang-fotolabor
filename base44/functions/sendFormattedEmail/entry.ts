import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const EMAIL_TEMPLATES = {
  registration: (data) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #FFA100 0%, #ff9500 100%); padding: 40px 20px; text-align: center; color: #fff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { font-size: 20px; margin: 0 0 15px 0; color: #1a1a1a; }
    .content p { margin: 0 0 15px 0; color: #555; }
    .cta-button { display: inline-block; background: #FFA100; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #ff9500; }
    .footer { background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
    .divider { height: 1px; background: #eee; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Willkommen zum Folkwang Fotolabor</h1>
    </div>
    <div class="content">
      <h2>Hallo ${data.name || 'Nutzer'},</h2>
      <p>dein Konto wurde erfolgreich registriert. Du kannst dich jetzt anmelden und das Labor nutzen.</p>
      <div style="text-align: center;">
        <a href="${data.loginUrl || '#'}" class="cta-button">Zum Labor</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 13px; color: #888;">Bei Fragen wende dich an deine Administratoren.</p>
    </div>
    <div class="footer">
      <p>© 2026 Folkwang Universität der Künste · Fotolabor</p>
    </div>
  </div>
</body>
</html>
  `,

  bookingConfirmation: (data) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Buchungsbestätigung</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #34c759 0%, #30b050 100%); padding: 40px 20px; text-align: center; color: #fff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { font-size: 20px; margin: 0 0 15px 0; color: #1a1a1a; }
    .content p { margin: 0 0 15px 0; color: #555; }
    .info-box { background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #FFA100; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { font-weight: 600; color: #333; }
    .info-value { color: #666; }
    .divider { height: 1px; background: #eee; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Buchung bestätigt</h1>
    </div>
    <div class="content">
      <h2>Deine Buchung ist aktiv</h2>
      <p>Hallo ${data.name || 'Nutzer'},</p>
      <p>deine Buchung im Folkwang Fotolabor wurde bestätigt.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Arbeitsplatz</span>
          <span class="info-value">${data.workspace || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Datum</span>
          <span class="info-value">${data.date || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Uhrzeit</span>
          <span class="info-value">${data.time || '—'}</span>
        </div>
        ${data.cost ? `<div class="info-row">
          <span class="info-label">Kosten</span>
          <span class="info-value">${data.cost}</span>
        </div>` : ''}
      </div>
      <div class="divider"></div>
      <p style="font-size: 13px; color: #888;">Bei Stornierungen wende dich rechtzeitig an die Administratoren.</p>
    </div>
    <div class="footer">
      <p>© 2026 Folkwang Universität der Künste · Fotolabor</p>
    </div>
  </div>
</body>
</html>
  `,

  passwordReset: (data) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passwort zurücksetzen</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #007aff 0%, #0051d5 100%); padding: 40px 20px; text-align: center; color: #fff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { font-size: 20px; margin: 0 0 15px 0; color: #1a1a1a; }
    .content p { margin: 0 0 15px 0; color: #555; }
    .cta-button { display: inline-block; background: #FFA100; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #ff9500; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 12px 15px; border-radius: 6px; margin: 15px 0; font-size: 13px; color: #856404; }
    .divider { height: 1px; background: #eee; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Passwort zurücksetzen</h1>
    </div>
    <div class="content">
      <h2>Hallo ${data.name || 'Nutzer'},</h2>
      <p>du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
      <div style="text-align: center;">
        <a href="${data.resetUrl || '#'}" class="cta-button">Passwort zurücksetzen</a>
      </div>
      <div class="alert">
        <strong>Hinweis:</strong> Dieser Link ist 24 Stunden lang gültig. Teile ihn nicht mit anderen Personen.
      </div>
      <p>Wenn du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
      <div class="divider"></div>
    </div>
    <div class="footer">
      <p>© 2026 Folkwang Universität der Künste · Fotolabor</p>
    </div>
  </div>
</body>
</html>
  `,

  bookingRequest: (data) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Buchungsanfrage</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #FFA100 0%, #ff9500 100%); padding: 40px 20px; text-align: center; color: #fff; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { font-size: 20px; margin: 0 0 15px 0; color: #1a1a1a; }
    .content p { margin: 0 0 15px 0; color: #555; }
    .info-box { background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #FFA100; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .info-label { font-weight: 600; color: #333; }
    .info-value { color: #666; text-align: right; }
    .divider { height: 1px; background: #eee; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Neue Buchungsanfrage</h1>
    </div>
    <div class="content">
      <h2>Buchungsdetails</h2>
      <p>Es wurde eine neue Anfrage für eine Arbeitsplatzbuchung eingereicht:</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Nutzer</span>
          <span class="info-value">${data.userName || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-Mail</span>
          <span class="info-value">${data.userEmail || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Arbeitsplatz</span>
          <span class="info-value">${data.workspace || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Datum</span>
          <span class="info-value">${data.date || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Uhrzeit</span>
          <span class="info-value">${data.time || '—'}</span>
        </div>
      </div>
      ${data.notes ? `<p><strong>Notizen:</strong><br>${data.notes}</p>` : ''}
      <div class="divider"></div>
      <p style="font-size: 13px; color: #888;">Bestätige oder lehne die Anfrage im Admin-Panel ab.</p>
    </div>
    <div class="footer">
      <p>© 2026 Folkwang Universität der Künste · Fotolabor</p>
    </div>
  </div>
</body>
</html>
  `
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, templateType, data } = await req.json();

    if (!to || !subject || !templateType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = EMAIL_TEMPLATES[templateType];
    if (!template) {
      return Response.json({ error: 'Unknown template type' }, { status: 400 });
    }

    const htmlBody = template(data);

    // Send via SendEmail integration (plain text fallback included in HTML)
    await base44.integrations.Core.SendEmail({
      to,
      subject,
      body: htmlBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});