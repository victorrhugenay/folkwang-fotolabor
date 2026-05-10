import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const booking = payload.data;
    if (!booking) {
      return Response.json({ error: 'No booking data' }, { status: 400 });
    }

    const recipientEmail = booking.booked_for_email || booking.created_by;
    if (!recipientEmail) {
      return Response.json({ message: 'No recipient email found' });
    }

    const dateStr = booking.date || '';
    const timeStr = `${booking.start_time} – ${booking.end_time} Uhr`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Buchung bestätigt: ${booking.workspace_name}`,
      body: `Hallo,\n\ndeine Buchungsanfrage wurde von einem Administrator bestätigt:\n\nArbeitsplatz: ${booking.workspace_name}\nDatum: ${dateStr}\nZeitraum: ${timeStr}\n${booking.notes ? `Notizen: ${booking.notes}\n` : ''}\nBei Fragen wende dich an deine Administratoren.\n\nFolkwang Fotolabor`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});