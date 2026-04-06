import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useCurrentUser } from "../hooks/useCurrentUser";
import ImageUpload from "../components/ImageUpload";
import { Plus, CalendarDays, MapPin, Users, Clock, Pencil, Trash2, UserPlus, X } from "lucide-react";

const typeLabel = { course: "Kurs", event: "Veranstaltung" };
const statusColors = { upcoming: "default", cancelled: "destructive", completed: "secondary" };
const statusLabels = { upcoming: "Geplant", cancelled: "Abgesagt", completed: "Abgeschlossen" };

export default function Events() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [inviteDialog, setInviteDialog] = useState(null);
  const { isAdmin, user } = useCurrentUser();

  const loadData = async (adminFlag = isAdmin) => {
    const [ev, reg, users] = await Promise.all([
      base44.entities.Event.list("-date"),
      base44.entities.EventRegistration.list(),
      adminFlag ? base44.entities.User.list() : Promise.resolve([]),
    ]);
    setEvents(ev);
    setRegistrations(reg);
    setAllUsers(users);
    setLoading(false);
  };

  useEffect(() => { if (user !== undefined) loadData(isAdmin); }, [isAdmin, user !== undefined]);

  const handleSave = async (data) => {
    if (editItem?.id) {
      await base44.entities.Event.update(editItem.id, data);
      toast({ title: "Veranstaltung gespeichert" });
    } else {
      await base44.entities.Event.create(data);
      toast({ title: "Veranstaltung erstellt" });
    }
    setEditDialog(false);
    setEditItem(null);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Event.delete(id);
    toast({ title: "Veranstaltung gelöscht" });
    loadData();
  };

  const handleRegister = async (event) => {
    if (!user) return;
    const existing = registrations.find(r => r.event_id === event.id && r.user_email === user.email && r.status !== "cancelled");
    if (existing) {
      toast({ title: "Du bist bereits angemeldet.", variant: "destructive" });
      return;
    }
    const regs = registrations.filter(r => r.event_id === event.id && r.status !== "cancelled");
    if (event.capacity && regs.length >= event.capacity) {
      toast({ title: "Keine freien Plätze mehr.", variant: "destructive" });
      return;
    }
    await base44.entities.EventRegistration.create({
      event_id: event.id,
      event_title: event.title,
      user_email: user.email,
      user_name: user.full_name || user.email,
      status: "registered",
    });
    toast({ title: "Anmeldung erfolgreich!" });
    loadData();
  };

  const handleCancelRegistration = async (event) => {
    const reg = registrations.find(r => r.event_id === event.id && r.user_email === user?.email && r.status !== "cancelled");
    if (!reg) return;
    await base44.entities.EventRegistration.update(reg.id, { status: "cancelled" });
    toast({ title: "Anmeldung storniert" });
    loadData();
  };

  const handleInvite = async (event, userEmail) => {
    const u = allUsers.find(u => u.email === userEmail);
    const existing = registrations.find(r => r.event_id === event.id && r.user_email === userEmail && r.status !== "cancelled");
    if (existing) {
      toast({ title: "Nutzer ist bereits angemeldet.", variant: "destructive" });
      return;
    }
    await base44.entities.EventRegistration.create({
      event_id: event.id,
      event_title: event.title,
      user_email: userEmail,
      user_name: u ? (u.full_name || u.email) : userEmail,
      status: "invited",
    });
    toast({ title: "Einladung gesendet" });
    loadData();
  };

  const handleRemoveRegistration = async (regId) => {
    await base44.entities.EventRegistration.update(regId, { status: "cancelled" });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kurse & Veranstaltungen</h1>
          <p className="text-muted-foreground mt-1">{events.length} Veranstaltungen</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditItem({}); setEditDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Neue Veranstaltung
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(ev => {
          const evRegs = registrations.filter(r => r.event_id === ev.id && r.status !== "cancelled");
          const myReg = registrations.find(r => r.event_id === ev.id && r.user_email === user?.email && r.status !== "cancelled");
          const spotsLeft = ev.capacity ? ev.capacity - evRegs.length : null;
          const full = ev.capacity && evRegs.length >= ev.capacity;

          return (
            <div key={ev.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
              {ev.image_url ? (
                <img src={ev.image_url} alt={ev.title} className="h-36 w-full object-cover" />
              ) : (
                <div className="h-36 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center">
                  <CalendarDays className="h-12 w-12 text-primary/40" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{ev.title}</h3>
                    <Badge variant="outline" className="text-xs mt-0.5">{typeLabel[ev.type] || ev.type}</Badge>
                  </div>
                  <Badge variant={statusColors[ev.status]}>{statusLabels[ev.status]}</Badge>
                </div>
                {ev.description && <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {ev.date}</p>
                  <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ev.start_time} – {ev.end_time}</p>
                  {ev.location && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</p>}
                  <p className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {evRegs.length} Teilnehmer{ev.capacity ? ` / ${ev.capacity} Plätze` : ""}
                    {spotsLeft !== null && !full && <span className="text-green-600 ml-1">({spotsLeft} frei)</span>}
                    {full && <span className="text-destructive ml-1">(ausgebucht)</span>}
                  </p>
                </div>
                <div className="flex gap-2 pt-1 flex-wrap">
                  {ev.status === "upcoming" && !myReg && (
                    <Button size="sm" className="flex-1" onClick={() => handleRegister(ev)} disabled={!!full}>
                      {full ? "Ausgebucht" : "Anmelden"}
                    </Button>
                  )}
                  {myReg && (
                    <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => handleCancelRegistration(ev)}>
                      Abmelden ({myReg.status === "invited" ? "Eingeladen" : "Angemeldet"})
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setDetailEvent(ev)}>
                    <Users className="h-3.5 w-3.5" />
                  </Button>
                  {isAdmin && (
                    <>
                      {ev.status === "upcoming" && (
                        <Button size="sm" variant="ghost" onClick={() => setInviteDialog(ev)}>
                          <UserPlus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => { setEditItem(ev); setEditDialog(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(ev.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Keine Veranstaltungen vorhanden</p>
          </div>
        )}
      </div>

      {/* Detail / Participants */}
      {detailEvent && (
        <Dialog open={!!detailEvent} onOpenChange={() => setDetailEvent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Teilnehmer – {detailEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {registrations.filter(r => r.event_id === detailEvent.id && r.status !== "cancelled").map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.user_name}</p>
                    <p className="text-xs text-muted-foreground">{r.user_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "invited" ? "secondary" : "default"}>
                      {r.status === "invited" ? "Eingeladen" : "Angemeldet"}
                    </Badge>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveRegistration(r.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {registrations.filter(r => r.event_id === detailEvent.id && r.status !== "cancelled").length === 0 && (
                <p className="text-center text-muted-foreground py-6 text-sm">Keine Teilnehmer</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Dialog */}
      {inviteDialog && (
        <InviteDialog
          event={inviteDialog}
          users={allUsers}
          registrations={registrations}
          onInvite={handleInvite}
          onClose={() => setInviteDialog(null)}
        />
      )}

      {/* Edit Dialog */}
      <EventFormDialog open={editDialog} onOpenChange={setEditDialog} item={editItem} onSave={handleSave} />
    </div>
  );
}

function InviteDialog({ event, users, registrations, onInvite, onClose }) {
  const [selectedEmail, setSelectedEmail] = useState("");
  const alreadyIn = registrations.filter(r => r.event_id === event.id && r.status !== "cancelled").map(r => r.user_email);
  const available = users.filter(u => !alreadyIn.includes(u.email));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nutzer einladen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label>Nutzer auswählen</Label>
          <Select value={selectedEmail} onValueChange={setSelectedEmail}>
            <SelectTrigger><SelectValue placeholder="Nutzer wählen..." /></SelectTrigger>
            <SelectContent>
              {available.map(u => (
                <SelectItem key={u.id} value={u.email}>
                  {u.full_name || u.email} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => { if (selectedEmail) { onInvite(event, selectedEmail); onClose(); } }} disabled={!selectedEmail}>
            Einladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (item) setForm({ title: "", description: "", type: "event", date: "", start_time: "09:00", end_time: "11:00", location: "", capacity: "", status: "upcoming", image_url: "", ...item });
  }, [item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item?.id ? "Veranstaltung bearbeiten" : "Neue Veranstaltung"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Bild</Label>
            <ImageUpload value={form.image_url || ""} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Typ</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Kurs</SelectItem>
                  <SelectItem value="event">Veranstaltung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Geplant</SelectItem>
                  <SelectItem value="cancelled">Abgesagt</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Titel *</Label>
            <Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>Datum *</Label>
            <Input type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Startzeit *</Label>
              <Input type="time" value={form.start_time || ""} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <Label>Endzeit *</Label>
              <Input type="time" value={form.end_time || ""} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ort / Raum</Label>
              <Input value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <Label>Max. Plätze (leer = unbegrenzt)</Label>
              <Input type="number" value={form.capacity || ""} onChange={e => setForm(f => ({ ...f, capacity: e.target.value ? parseInt(e.target.value) : null }))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title || !form.date}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}