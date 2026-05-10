import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const booking = payload.data;
    if (!booking) {
      return Response.json({ error: 'No booking data' }, { status: 400 });
    }

    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ message: 'No admins found' });
    }

    const dateStr = booking.date || '';
    const timeStr = `${booking.start_time} – ${booking.end_time} Uhr`;
    const bookedBy = booking.created_by || 'Unbekannt';

    // Send email to each admin
    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `Neue Buchungsanfrage: ${booking.workspace_name}`,
        body: `Hallo ${admin.full_name || 'Administrator'},\n\nes liegt eine neue Buchungsanfrage vor, die deine Bestätigung benötigt:\n\nArbeitsplatz: ${booking.workspace_name}\nDatum: ${dateStr}\nZeitraum: ${timeStr}\nGebucht von: ${bookedBy}\n${booking.notes ? `Notizen: ${booking.notes}\n` : ''}\nBitte melde dich im System an, um die Buchung zu bestätigen oder abzulehnen.\n\nFolkwang Fotolabor`,
      }).catch(() => {})
    ));

    return Response.json({ success: true, notified: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});