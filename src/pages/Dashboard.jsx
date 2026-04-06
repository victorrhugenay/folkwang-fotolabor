import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, CalendarDays, GraduationCap, Mail, ArrowRight, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "../hooks/useCurrentUser";

const statusMap = {
  confirmed: { label: "Bestätigt", variant: "default" },
  cancelled: { label: "Storniert", variant: "destructive" },
  completed: { label: "Abgeschlossen", variant: "secondary" },
};

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useCurrentUser();

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list("-created_date", 200),
      base44.entities.Workspace.list(),
      base44.entities.Event.list("-date", 20),
      base44.entities.ContactMessage.list("-created_date", 10),
      base44.entities.EventRegistration.list(),
    ]).then(([b, w, ev, c, reg]) => {
      setBookings(b);
      setWorkspaces(w);
      setEvents(ev);
      setContacts(c);
      setRegistrations(reg);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const myBookings = user ? bookings.filter(b => b.created_by === user.email) : bookings;
  const activeBookings = myBookings.filter(b => b.status === "confirmed");
  const upcomingEvents = events.filter(e => e.status === "upcoming");
  const unreadContacts = contacts.filter(c => !c.read);
  const availableWorkspaces = workspaces.filter(w => w.status === "available");
  const recentBookings = myBookings.slice(0, 5);
  const nextEvents = upcomingEvents.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Folkwang Fotolabor</p>
        <h1 className="text-3xl font-display font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1.5">Willkommen zurück{user?.full_name ? `, ${user.full_name}` : ""}.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/arbeitsplatzbuchung?view=bookings" className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktive Buchungen</p>
              <p className="text-3xl font-bold mt-1">{activeBookings.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{myBookings.length} gesamt</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Link>

        <Link to="/arbeitsplatzbuchung?view=grid" className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Arbeitsplätze</p>
              <p className="text-3xl font-bold mt-1">{availableWorkspaces.length}</p>
              <p className="text-xs text-muted-foreground mt-1">von {workspaces.length} verfügbar</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Link>

        <Link to="/events" className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Anstehende Events</p>
              <p className="text-3xl font-bold mt-1">{upcomingEvents.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{events.length} gesamt</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Link>

        {isAdmin ? (
          <Link to="/contact" className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kontaktanfragen</p>
                <p className="text-3xl font-bold mt-1">{contacts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{unreadContacts.length} ungelesen</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </Link>
        ) : (
          <Link to="/contact" className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kontakt</p>
                <p className="text-sm font-medium mt-2">Nachricht senden</p>
                <p className="text-xs text-muted-foreground mt-1">An das Team</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Mail className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Letzte Buchungen</h2>
            <Link to="/arbeitsplatzbuchung?view=bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
              Alle <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentBookings.length === 0 && (
              <p className="px-5 py-8 text-center text-muted-foreground text-sm">Keine Buchungen vorhanden</p>
            )}
            {recentBookings.map(b => {
              const st = statusMap[b.status] || statusMap.confirmed;
              const Icon = b.status === "cancelled" ? XCircle : b.status === "completed" ? CheckCircle : Clock;
              return (
                <div key={b.id} className="px-5 py-3 flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${b.status === "cancelled" ? "text-destructive" : b.status === "completed" ? "text-green-600" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.workspace_name}</p>
                    <p className="text-xs text-muted-foreground">{b.date} · {b.start_time}–{b.end_time}</p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Anstehende Veranstaltungen</h2>
            <Link to="/events" className="text-sm text-primary hover:underline flex items-center gap-1">
              Alle <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {nextEvents.length === 0 && (
              <p className="px-5 py-8 text-center text-muted-foreground text-sm">Keine anstehenden Veranstaltungen</p>
            )}
            {nextEvents.map(ev => {
              const evRegs = registrations.filter(r => r.event_id === ev.id && r.status !== "cancelled");
              const spotsLeft = ev.capacity ? ev.capacity - evRegs.length : null;
              return (
                <Link key={ev.id} to="/events" className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.date} · {ev.start_time}{ev.location ? ` · ${ev.location}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {evRegs.length}{ev.capacity ? `/${ev.capacity}` : ""}
                    </div>
                    {spotsLeft !== null && (
                      <p className={`text-xs ${spotsLeft === 0 ? "text-destructive" : "text-green-600"}`}>
                        {spotsLeft === 0 ? "Ausgebucht" : `${spotsLeft} frei`}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Latest Contact Messages (admin only) */}
        {isAdmin && (
          <div className="bg-card rounded-xl border border-border lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold">Neueste Kontaktanfragen</h2>
              <span className="text-xs text-muted-foreground">{unreadContacts.length} ungelesen</span>
            </div>
            <div className="divide-y divide-border">
              {contacts.length === 0 && (
                <p className="px-5 py-8 text-center text-muted-foreground text-sm">Keine Nachrichten vorhanden</p>
              )}
              {contacts.slice(0, 5).map(c => (
                <div key={c.id} className={`px-5 py-3 flex items-start gap-3 ${!c.read ? "bg-accent/30" : ""}`}>
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{c.name}</p>
                      {!c.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.email}{c.subject ? ` · ${c.subject}` : ""}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}