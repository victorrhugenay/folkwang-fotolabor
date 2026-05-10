import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, userEmail } = await req.json();
    if (!userId || !userEmail) {
      return Response.json({ error: 'userId and userEmail required' }, { status: 400 });
    }

    const db = base44.asServiceRole;

    // Fetch all bookings for this user
    const allBookings = await db.entities.Booking.list();
    const userBookings = allBookings.filter(b =>
      b.created_by === userEmail || b.booked_for_email === userEmail
    );

    // Delete all MaterialUsage linked to user bookings
    const allUsages = await db.entities.MaterialUsage.list();
    const userBookingIds = new Set(userBookings.map(b => b.id));
    const userUsages = allUsages.filter(u => userBookingIds.has(u.booking_id));
    await Promise.all(userUsages.map(u => db.entities.MaterialUsage.delete(u.id)));

    // Delete all bookings
    await Promise.all(userBookings.map(b => db.entities.Booking.delete(b.id)));

    // Delete GroupMemberships
    const allMemberships = await db.entities.GroupMembership.list();
    const userMemberships = allMemberships.filter(m => m.user_email === userEmail);
    await Promise.all(userMemberships.map(m => db.entities.GroupMembership.delete(m.id)));

    // Delete EventRegistrations
    const allRegistrations = await db.entities.EventRegistration.list();
    const userRegistrations = allRegistrations.filter(r => r.user_email === userEmail);
    await Promise.all(userRegistrations.map(r => db.entities.EventRegistration.delete(r.id)));

    // Delete user-specific Documents
    const allDocs = await db.entities.Document.list();
    const userDocs = allDocs.filter(d => d.target === 'user' && d.user_email === userEmail);
    await Promise.all(userDocs.map(d => db.entities.Document.delete(d.id)));

    return Response.json({
      success: true,
      deleted: {
        bookings: userBookings.length,
        materialUsages: userUsages.length,
        memberships: userMemberships.length,
        registrations: userRegistrations.length,
        documents: userDocs.length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});