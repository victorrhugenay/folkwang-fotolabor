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
import { Plus, CalendarDays, MapPin, Users, Clock, Pencil, Trash2, UserPlus, X, Search } from "lucide-react";

const typeLabel = { course: "Kurs", event: "Veranstaltung" };
const statusColors = { upcoming: "default", cancelled: "destructive", completed: "secondary" };
const statusLabels = { upcoming: "Geplant", cancelled: "Abgesagt", completed: "Abgeschlossen" };
const reasonMap = { course: "Kurs", event: "Veranstaltung", closure: "Schließung" };

export default function Events() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [membershipMap, setMembershipMap] = useState({});
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [inviteDialog, setInviteDialog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin, user, isDozent } = useCurrentUser();
  const canCreate = isAdmin || isDozent;

  const loadData = async (adminFlag = isAdmin) => {
    const [ev, reg, users, gr, members, ws] = await Promise.all([
      base44.entities.Event.list("-date"),
      base44.entities.EventRegistration.list(),
      adminFlag ? base44.entities.User.list() : Promise.resolve([]),
      base44.entities.Group.list(),
      base44.entities.GroupMembership.list(),
      base44.entities.Workspace.list(),
    ]);
    setEvents(ev);
    setRegistrations(reg);
    setAllUsers(users);
    setGroups(gr);
    setWorkspaces(ws);
    const mMap = {};
    members.forEach(m => {
      if (!mMap[m.user_email]) mMap[m.user_email] = [];
      mMap[m.user_email].push(m.group_id);
    });
    setMembershipMap(mMap);
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
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Titel suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          {canCreate && (
            <Button onClick={() => { setEditItem({}); setEditDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Neue Veranstaltung
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.filter(ev => {
          const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase());
          if (!matchesSearch) return false;
          if (isAdmin) return true;
          if (!ev.group_ids || ev.group_ids.length === 0) return true;
          const userGroups = membershipMap[user?.email] || [];
          return ev.group_ids.some(gid => userGroups.includes(gid));
        }).map(ev => {
          const evRegs = registrations.filter(r => r.event_id === ev.id && r.status !== "cancelled");
          const myReg = registrations.find(r => r.event_id === ev.id && r.user_email === user?.email && r.status !== "cancelled");
          const spotsLeft = ev.capacity ? ev.capacity - evRegs.length : null;
          const full = ev.capacity && evRegs.length >= ev.capacity;

          return (
            <div key={ev.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailEvent(ev)}>
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
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">{typeLabel[ev.type] || ev.type}</Badge>
                      {ev.group_ids && ev.group_ids.length > 0 && (
                        <Badge variant="secondary" className="text-xs">Gruppen</Badge>
                      )}
                    </div>
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
                    <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleRegister(ev); }} disabled={!!full}>
                      {full ? "Ausgebucht" : "Anmelden"}
                    </Button>
                  )}
                  {myReg && (
                    <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={(e) => { e.stopPropagation(); handleCancelRegistration(ev); }}>
                      Abmelden ({myReg.status === "invited" ? "Eingeladen" : "Angemeldet"})
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetailEvent(ev); }}>
                    <Users className="h-3.5 w-3.5" />
                  </Button>
                  {canCreate && (
                    <>
                      {ev.status === "upcoming" && (
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setInviteDialog(ev); }}>
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditItem(ev); setEditDialog(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}>
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
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{detailEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {detailEvent.image_url && (
                <img src={detailEvent.image_url} alt={detailEvent.title} className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="space-y-2 text-sm">
                {detailEvent.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Beschreibung</p>
                    <p className="text-foreground">{detailEvent.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Typ</p>
                    <p className="text-foreground">{typeLabel[detailEvent.type] || detailEvent.type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
                    <Badge variant={statusColors[detailEvent.status]}>{statusLabels[detailEvent.status]}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Startdatum</p>
                    <p className="text-foreground">{detailEvent.start_date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Enddatum</p>
                    <p className="text-foreground">{detailEvent.end_date}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Startzeit</p>
                    <p className="text-foreground">{detailEvent.start_time}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Endzeit</p>
                    <p className="text-foreground">{detailEvent.end_time}</p>
                  </div>
                </div>
                {detailEvent.location && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Ort / Raum</p>
                    <p className="text-foreground">{detailEvent.location}</p>
                  </div>
                )}
                {detailEvent.capacity && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Kapazität</p>
                    <p className="text-foreground">{detailEvent.capacity} Plätze</p>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold mb-3">Teilnehmer</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
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
                    {canCreate && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveRegistration(r.id); }}>
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
              </div>
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
      <EventFormDialog open={editDialog} onOpenChange={setEditDialog} item={editItem} onSave={handleSave} workspaces={workspaces} />
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

function EventFormDialog({ open, onOpenChange, item, onSave, workspaces }) {
  const [form, setForm] = useState({});
  const [allGroups, setAllGroups] = useState([]);

  useEffect(() => {
    base44.entities.Group.list().then(setAllGroups);
  }, []);

  useEffect(() => {
    if (item) {
      setForm({
        title: "",
        description: "",
        type: "event",
        start_date: "",
        end_date: "",
        start_time: "09:00",
        end_time: "11:00",
        location: "",
        capacity: "",
        status: "upcoming",
        image_url: "",
        group_ids: [],
        is_recurring: false,
        recurrence_type: "weekly",
        recurrence_end_date: "",
        recurring_days: [],
        ...item
      });
    }
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
            <Label>Startdatum *</Label>
            <Input type="date" value={form.start_date || ""} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div>
            <Label>Enddatum *</Label>
            <Input type="date" value={form.end_date || ""} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              id="is_recurring"
              checked={form.is_recurring || false}
              onChange={(e) => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="is_recurring" className="cursor-pointer">Wiederkehrend</Label>
          </div>
          {form.is_recurring && (
            <>
              <div>
                <Label>Wiederholungsmuster</Label>
                <Select value={form.recurrence_type || "weekly"} onValueChange={(v) => setForm(f => ({ ...f, recurrence_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="biweekly">Alle 2 Wochen</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Wiederholung bis</Label>
                <Input
                  type="date"
                  value={form.recurrence_end_date || ""}
                  onChange={(e) => setForm(f => ({ ...f, recurrence_end_date: e.target.value }))}
                />
              </div>
              {form.recurrence_type === "weekly" && (
                <div className="col-span-2">
                  <Label>Wochentage</Label>
                  <div className="flex gap-2 mt-1">
                    {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const dayNum = i + 1;
                          setForm(f => ({
                            ...f,
                            recurring_days: (f.recurring_days || []).includes(dayNum)
                              ? (f.recurring_days || []).filter(d => d !== dayNum)
                              : [...(f.recurring_days || []), dayNum]
                          }));
                        }}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          (form.recurring_days || []).includes(i + 1)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
              <Input type="number" value={form.capacity || ""} onChange={e => setForm(f => ({ ...f, capacity: e.target.value ? parseInt(e.target.value, 10) : null }))} />
            </div>
          </div>
          <div>
            <Label>Arbeitsplätze zum Blocken (optional)</Label>
            <div className="space-y-2 p-3 border border-border rounded-md bg-muted/20 max-h-40 overflow-y-auto">
              {workspaces.length === 0 ? (
                <p className="text-xs text-muted-foreground">Keine Arbeitsplätze vorhanden</p>
              ) : (
                workspaces.map(w => (
                  <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.workspace_ids || []).includes(w.id)}
                      onChange={e => {
                        const updated = e.target.checked
                          ? [...(form.workspace_ids || []), w.id]
                          : (form.workspace_ids || []).filter(id => id !== w.id);
                        setForm(f => ({ ...f, workspace_ids: updated }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{w.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div>
            <Label>Freigeschaltete Gruppen (leer = für alle)</Label>
            <div className="space-y-2 p-3 border border-border rounded-md bg-muted/20 max-h-40 overflow-y-auto">
              {allGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground">Keine Gruppen vorhanden</p>
              ) : (
                allGroups.map(g => (
                  <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.group_ids || []).includes(g.id)}
                      onChange={e => {
                        const updated = e.target.checked
                          ? [...(form.group_ids || []), g.id]
                          : (form.group_ids || []).filter(id => id !== g.id);
                        setForm(f => ({ ...f, group_ids: updated }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{g.name}</span>
                  </label>
                ))
              )}
            </div>
            </div>
            </div>
            <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
           <Button onClick={() => {
             const data = { ...form, capacity: form.capacity ? parseInt(form.capacity, 10) : null };
             onSave(data);
           }} disabled={!form.title || !form.start_date || !form.end_date}>Speichern</Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}