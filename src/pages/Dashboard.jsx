import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, CalendarDays, GraduationCap, Mail, ArrowRight, Clock, CheckCircle, XCircle, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import StatCard from "../components/StatCard";

const statusMap = {
  confirmed: { label: "Bestätigt", color: "#34c759", bg: "rgba(52,199,89,0.10)" },
  cancelled: { label: "Storniert", color: "#ff3b30", bg: "rgba(255,59,48,0.09)" },
  completed: { label: "Abgeschlossen", color: "#888", bg: "rgba(0,0,0,0.06)" },
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
      base44.entities.Booking.list("-created_date", 20),
      base44.entities.Workspace.list(),
      base44.entities.Event.list("-date", 5),
      base44.entities.ContactMessage.list("-created_date", 5),
      base44.entities.EventRegistration.list("-created_date", 50),
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
        <div className="w-7 h-7 rounded-full border-[3px] border-gray-100 border-t-orange-400 animate-spin" />
      </div>
    );
  }

  const myBookings = user ? bookings.filter(b => b.created_by === user.email) : bookings;
  const activeBookings = myBookings.filter(b => b.status === "confirmed").slice(0, 20);
  const upcomingEvents = events.slice(0, 5);
  const unreadContacts = contacts.filter(c => !c.read).slice(0, 5);
  const availableWorkspaces = workspaces.filter(w => w.status === "available");
  const recentBookings = myBookings.slice(0, 5);
  const nextEvents = upcomingEvents.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Folkwang Fotolabor</p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm font-medium">
          Willkommen zurück{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ""} 👋
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/arbeitsplaetze?view=bookings" className="block">
          <StatCard
            icon={CalendarDays}
            label="Buchungen"
            value={activeBookings.length}
            subtitle={`${myBookings.length} gesamt`}
          />
        </Link>
        <Link to="/arbeitsplaetze?view=grid" className="block">
          <StatCard
            icon={Building2}
            label="Arbeitsplätze"
            value={availableWorkspaces.length}
            subtitle={`von ${workspaces.length} verfügbar`}
            color="#34c759"
          />
        </Link>
        <Link to="/events" className="block">
          <StatCard
            icon={GraduationCap}
            label="Events"
            value={upcomingEvents.length}
            subtitle={`${events.length} gesamt`}
            color="#af52de"
          />
        </Link>
        {isAdmin ? (
          <Link to="/contact" className="block">
            <StatCard
              icon={Mail}
              label="Kontaktanfragen"
              value={contacts.length}
              subtitle={`${unreadContacts.length} ungelesen`}
              color="#ff3b30"
            />
          </Link>
        ) : (
          <Link to="/contact" className="block">
            <StatCard
              icon={Mail}
              label="Kontakt"
              value="→"
              subtitle="Nachricht senden"
              color="#ff3b30"
            />
          </Link>
        )}
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Bookings */}
        <div className="apple-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/05">
            <div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">Letzte Buchungen</h2>
              <p className="text-xs text-gray-400 mt-0.5">{myBookings.length} Buchungen insgesamt</p>
            </div>
            <Link
              to="/arbeitsplaetze?view=bookings"
              className="text-xs font-semibold flex items-center gap-1 apple-transition hover:opacity-70"
              style={{ color: 'var(--apple-orange)' }}
            >
              Alle <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div>
            {recentBookings.length === 0 && (
              <div className="px-5 py-10 text-center">
                <CalendarDays className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Noch keine Buchungen</p>
              </div>
            )}
            {recentBookings.map((b, i) => {
              const st = statusMap[b.status] || statusMap.confirmed;
              const Icon = b.status === "cancelled" ? XCircle : b.status === "completed" ? CheckCircle : Clock;
              return (
                <div key={b.id} className={`px-5 py-3.5 flex items-center gap-3 apple-transition hover:bg-gray-50 ${i < recentBookings.length - 1 ? 'border-b border-black/04' : ''}`}>
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: st.bg }}
                  >
                    <Icon style={{ width: 14, height: 14, color: st.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{b.workspace_name}</p>
                    <p className="text-xs text-gray-400">{b.date} · {b.start_time}–{b.end_time}</p>
                  </div>
                  <span
                    className="apple-badge text-xs"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="apple-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/05">
            <div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">Anstehende Veranstaltungen</h2>
              <p className="text-xs text-gray-400 mt-0.5">{upcomingEvents.length} geplant</p>
            </div>
            <Link
              to="/events"
              className="text-xs font-semibold flex items-center gap-1 apple-transition hover:opacity-70"
              style={{ color: 'var(--apple-orange)' }}
            >
              Alle <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
          <div>
            {nextEvents.length === 0 && (
              <div className="px-5 py-10 text-center">
                <GraduationCap className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Keine anstehenden Veranstaltungen</p>
              </div>
            )}
            {nextEvents.map((ev, i) => {
              const evRegs = registrations.filter(r => r.event_id === ev.id && r.status !== "cancelled");
              const spotsLeft = ev.capacity ? ev.capacity - evRegs.length : null;
              return (
                <Link
                  key={ev.id}
                  to="/events"
                  className={`px-5 py-3.5 flex items-center gap-3 apple-transition hover:bg-gray-50 ${i < nextEvents.length - 1 ? 'border-b border-black/04' : ''}`}
                >
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(175,82,222,0.12)' }}>
                    <GraduationCap style={{ width: 14, height: 14, color: '#af52de' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-400">{ev.date} · {ev.start_time}{ev.location ? ` · ${ev.location}` : ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Users style={{ width: 11, height: 11 }} /> {evRegs.length}{ev.capacity ? `/${ev.capacity}` : ""}
                    </div>
                    {spotsLeft !== null && (
                      <p className="text-xs font-medium mt-0.5" style={{ color: spotsLeft === 0 ? '#ff3b30' : '#34c759' }}>
                        {spotsLeft === 0 ? "Ausgebucht" : `${spotsLeft} frei`}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Admin: Contact Messages */}
        {isAdmin && (
          <div className="apple-card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/05">
              <div>
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Kontaktanfragen</h2>
                <p className="text-xs text-gray-400 mt-0.5">{unreadContacts.length} ungelesen</p>
              </div>
              {unreadContacts.length > 0 && (
                <span className="apple-badge apple-badge-orange">{unreadContacts.length} neu</span>
              )}
            </div>
            <div>
              {contacts.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <Mail className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Keine Nachrichten vorhanden</p>
                </div>
              )}
              {contacts.slice(0, 5).map((c, i) => (
                <div
                  key={c.id}
                  className={`px-5 py-3.5 flex items-start gap-3 apple-transition hover:bg-gray-50 ${i < Math.min(contacts.length, 5) - 1 ? 'border-b border-black/04' : ''}`}
                  style={!c.read ? { background: 'rgba(255,161,0,0.03)' } : {}}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,161,0,0.12)' }}
                  >
                    <Mail style={{ width: 14, height: 14, color: 'var(--apple-orange)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                      {!c.read && (
                        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--apple-orange)' }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{c.email}{c.subject ? ` · ${c.subject}` : ""}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.message}</p>
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