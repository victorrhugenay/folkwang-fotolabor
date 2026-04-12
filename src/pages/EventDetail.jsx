import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, GraduationCap, RefreshCw } from "lucide-react";

import { formatDate } from "../utils/formatDate";

const recurrenceLabels = { daily: "Täglich", weekly: "Wöchentlich", biweekly: "Alle 2 Wochen", monthly: "Monatlich" };
const typeLabel = { course: "Kurs", event: "Veranstaltung" };
const statusColors = { upcoming: "default", cancelled: "destructive", completed: "secondary" };
const statusLabels = { upcoming: "Geplant", cancelled: "Abgesagt", completed: "Abgeschlossen" };

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useCurrentUser();
  const [event, setEvent] = useState(null);
  const [groups, setGroups] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [events, gr, regs] = await Promise.all([
        base44.entities.Event.list(),
        base44.entities.Group.list(),
        base44.entities.EventRegistration.list(),
      ]);
      const ev = events.find(e => e.id === id);
      setEvent(ev || null);
      setGroups(gr);
      setRegistrations(regs.filter(r => r.event_id === id && r.status !== "cancelled"));
      setLoading(false);
    };
    load();
  }, [id]);

  const handleRegister = async () => {
    if (!user) return;
    const existing = registrations.find(r => r.user_email === user.email);
    if (existing) { toast({ title: "Du bist bereits angemeldet.", variant: "destructive" }); return; }
    if (event.capacity && registrations.length >= event.capacity) {
      toast({ title: "Keine freien Plätze mehr.", variant: "destructive" }); return;
    }
    await base44.entities.EventRegistration.create({
      event_id: event.id, event_title: event.title,
      user_email: user.email, user_name: user.full_name || user.email, status: "registered",
    });
    toast({ title: "Anmeldung erfolgreich!" });
    const regs = await base44.entities.EventRegistration.list();
    setRegistrations(regs.filter(r => r.event_id === id && r.status !== "cancelled"));
  };

  const handleCancel = async () => {
    const reg = registrations.find(r => r.user_email === user?.email);
    if (!reg) return;
    await base44.entities.EventRegistration.update(reg.id, { status: "cancelled" });
    toast({ title: "Anmeldung storniert" });
    const regs = await base44.entities.EventRegistration.list();
    setRegistrations(regs.filter(r => r.event_id === id && r.status !== "cancelled"));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="text-center py-16 text-muted-foreground">
      <p>Veranstaltung nicht gefunden.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/events")}>Zurück</Button>
    </div>
  );

  const myReg = registrations.find(r => r.user_email === user?.email);
  const spotsLeft = event.capacity ? event.capacity - registrations.length : null;
  const full = event.capacity && registrations.length >= event.capacity;
  const eventGroups = (event.group_ids || []).map(gid => groups.find(g => g.id === gid)?.name).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" className="gap-2" onClick={() => navigate("/events")}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center">
            <CalendarDays className="h-16 w-16 text-primary/30" />
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  {event.type === "course" ? <GraduationCap className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                  {typeLabel[event.type] || event.type}
                </span>
                {eventGroups.length > 0 && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {eventGroups.join(", ")}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge variant={statusColors[event.status]}>{statusLabels[event.status]}</Badge>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Datum">
              {event.start_date === event.end_date
                ? formatDate(event.start_date)
                : `${formatDate(event.start_date)} – ${formatDate(event.end_date)}`}
            </InfoRow>
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Uhrzeit">
              {event.start_time} – {event.end_time}
            </InfoRow>
            {event.location && (
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Ort">
                {event.location}
              </InfoRow>
            )}
            <InfoRow icon={<Users className="h-4 w-4" />} label="Teilnehmer">
              {registrations.length}{event.capacity ? ` / ${event.capacity} Plätze` : ""}
              {spotsLeft !== null && !full && <span className="text-green-600 ml-1 text-xs">({spotsLeft} frei)</span>}
              {full && <span className="text-destructive ml-1 text-xs">(ausgebucht)</span>}
            </InfoRow>
            {event.is_recurring && event.recurrence_type && (
              <InfoRow icon={<RefreshCw className="h-4 w-4" />} label="Wiederholung">
                {recurrenceLabels[event.recurrence_type] || event.recurrence_type}
                {event.recurrence_end_date ? ` bis ${formatDate(event.recurrence_end_date)}` : ""}
              </InfoRow>
            )}
          </div>

          {/* Actions */}
          {event.status === "upcoming" && (
            <div className="pt-2 border-t border-border flex gap-3">
              {!myReg ? (
                <Button onClick={handleRegister} disabled={!!full}>
                  {full ? "Ausgebucht" : "Anmelden"}
                </Button>
              ) : (
                <Button variant="outline" className="text-destructive" onClick={handleCancel}>
                  Abmelden ({myReg.status === "invited" ? "Eingeladen" : "Angemeldet"})
                </Button>
              )}
            </div>
          )}

          {/* Participants (admin only) */}
          {isAdmin && registrations.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold mb-3">Teilnehmer ({registrations.length})</p>
              <div className="space-y-2">
                {registrations.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.user_name}</p>
                      <p className="text-xs text-muted-foreground">{r.user_email}</p>
                    </div>
                    <Badge variant={r.status === "invited" ? "secondary" : "default"}>
                      {r.status === "invited" ? "Eingeladen" : "Angemeldet"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">{label}</p>
        <p className="text-sm mt-0.5">{children}</p>
      </div>
    </div>
  );
}