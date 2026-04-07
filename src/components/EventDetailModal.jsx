import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { CalendarDays, Clock, MapPin, Users, GraduationCap, RefreshCw } from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "–";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
};

const recurrenceLabels = { daily: "Täglich", weekly: "Wöchentlich", biweekly: "Alle 2 Wochen", monthly: "Monatlich" };
const typeLabel = { course: "Kurs", event: "Veranstaltung" };
const statusColors = { upcoming: "default", cancelled: "destructive", completed: "secondary" };
const statusLabels = { upcoming: "Geplant", cancelled: "Abgesagt", completed: "Abgeschlossen" };

export default function EventDetailModal({ event, groups, onClose, onRegistrationChange }) {
  const { user, isAdmin } = useCurrentUser();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRegs = async () => {
    const regs = await base44.entities.EventRegistration.list();
    setRegistrations(regs.filter(r => r.event_id === event.id && r.status !== "cancelled"));
    setLoading(false);
  };

  useEffect(() => { loadRegs(); }, [event.id]);

  const handleRegister = async () => {
    const existing = registrations.find(r => r.user_email === user?.email);
    if (existing) { toast({ title: "Du bist bereits angemeldet.", variant: "destructive" }); return; }
    if (event.capacity && registrations.length >= event.capacity) {
      toast({ title: "Keine freien Plätze mehr.", variant: "destructive" }); return;
    }
    await base44.entities.EventRegistration.create({
      event_id: event.id, event_title: event.title,
      user_email: user.email, user_name: user.full_name || user.email, status: "registered",
    });
    toast({ title: "Anmeldung erfolgreich!" });
    await loadRegs();
    onRegistrationChange?.();
  };

  const handleCancel = async () => {
    const reg = registrations.find(r => r.user_email === user?.email);
    if (!reg) return;
    await base44.entities.EventRegistration.update(reg.id, { status: "cancelled" });
    toast({ title: "Anmeldung storniert" });
    await loadRegs();
    onRegistrationChange?.();
  };

  const myReg = registrations.find(r => r.user_email === user?.email);
  const spotsLeft = event.capacity ? event.capacity - registrations.length : null;
  const full = event.capacity && registrations.length >= event.capacity;
  const eventGroups = (event.group_ids || []).map(gid => groups.find(g => g.id === gid)?.name).filter(Boolean);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover rounded-t-xl" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center rounded-t-xl">
            <CalendarDays className="h-14 w-14 text-primary/30" />
          </div>
        )}

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <DialogTitle className="text-xl font-bold">{event.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  {event.type === "course" ? <GraduationCap className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                  {typeLabel[event.type] || event.type}
                </span>
                {eventGroups.length > 0 && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {eventGroups.join(", ")}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge variant={statusColors[event.status]}>{statusLabels[event.status]}</Badge>
          </div>

          {event.description && (
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
              {loading ? "…" : (
                <>
                  {registrations.length}{event.capacity ? ` / ${event.capacity} Plätze` : ""}
                  {spotsLeft !== null && !full && <span className="text-green-600 ml-1 text-xs">({spotsLeft} frei)</span>}
                  {full && <span className="text-destructive ml-1 text-xs">(ausgebucht)</span>}
                </>
              )}
            </InfoRow>
            {event.is_recurring && event.recurrence_type && (
              <InfoRow icon={<RefreshCw className="h-4 w-4" />} label="Wiederholung">
                {recurrenceLabels[event.recurrence_type] || event.recurrence_type}
                {event.recurrence_end_date ? ` bis ${formatDate(event.recurrence_end_date)}` : ""}
              </InfoRow>
            )}
          </div>

          {event.status === "upcoming" && (
            <div className="pt-2 border-t border-border">
              {!myReg ? (
                <Button onClick={handleRegister} disabled={!!full || loading}>
                  {full ? "Ausgebucht" : "Anmelden"}
                </Button>
              ) : (
                <Button variant="outline" className="text-destructive" onClick={handleCancel}>
                  Abmelden ({myReg.status === "invited" ? "Eingeladen" : "Angemeldet"})
                </Button>
              )}
            </div>
          )}

          {isAdmin && !loading && registrations.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold mb-3">Teilnehmer ({registrations.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
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