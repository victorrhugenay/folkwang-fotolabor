import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

const SLOT_TYPES = [
  { value: "1h", label: "1 Stunde", duration: 1 },
  { value: "half", label: "Halber Tag (4 Std.)", duration: 4 },
  { value: "full", label: "Ganzer Tag (8 Std.)", duration: 8 },
];

function getStartOptions(duration) {
  const slots = [];
  for (let h = 9; h + duration <= 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

function addHours(time, hours) {
  const h = parseInt(time.split(":")[0]) + hours;
  return `${String(h).padStart(2, "0")}:00`;
}

function isWeekday(dateStr) {
  if (!dateStr) return true;
  const day = new Date(dateStr).getUTCDay();
  return day >= 1 && day <= 5;
}

export default function AdminBookingDialog({ open, onOpenChange, onBooked }) {
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [date, setDate] = useState("");
  const [slotType, setSlotType] = useState("1h");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Workspace.list(),
    ]).then(([u, w]) => {
      setUsers(u);
      setWorkspaces(w.filter(ws => ws.status === "available"));
    });
  }, [open]);

  const selectedSlot = SLOT_TYPES.find(s => s.value === slotType);
  const startOptions = getStartOptions(selectedSlot?.duration || 1);
  const endTime = startTime ? addHours(startTime, selectedSlot?.duration || 1) : "";
  const workspace = workspaces.find(w => w.id === selectedWorkspace);
  const user = users.find(u => u.id === selectedUser);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedWorkspace || !date || !startTime) {
      toast({ title: "Fehler", description: "Bitte alle Pflichtfelder ausfüllen.", variant: "destructive" });
      return;
    }
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      toast({ title: "Fehler", description: "Buchungen in der Vergangenheit sind nicht möglich.", variant: "destructive" });
      return;
    }
    if (!isWeekday(date)) {
      toast({ title: "Fehler", description: "Nur Werktage (Mo–Fr) buchbar.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Check for closures
    const closures = await base44.entities.Closure.list();
    const duringClosure = closures.some(c => {
      if (date < c.start_date || date > c.end_date) return false;
      if (c.is_all_day) return true;
      if (date === c.start_date && date === c.end_date) return c.start_time < endTime && c.end_time > startTime;
      return true;
    });
    if (duringClosure) {
      toast({ title: "Labor geschlossen", description: "Das Labor ist in diesem Zeitraum geschlossen.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check for blockages
    const blockages = await base44.entities.WorkspaceBlockage.filter({
      workspace_id: selectedWorkspace,
      date,
    });
    const blocked = blockages.some(b => b.start_time < endTime && b.end_time > startTime);
    if (blocked) {
      toast({ title: "Arbeitsplatz gesperrt", description: "Dieser Arbeitsplatz ist in diesem Zeitraum durch einen Kurs oder eine Veranstaltung gesperrt.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const existing = await base44.entities.Booking.filter({
      workspace_id: selectedWorkspace,
      date,
      status: "confirmed",
    });
    const hasOverlap = existing.some(b => b.start_time < endTime && b.end_time > startTime);
    if (hasOverlap) {
      toast({ title: "Doppelbuchung", description: "Dieser Arbeitsplatz ist im gewählten Zeitraum bereits gebucht.", variant: "destructive" });
      setLoading(false);
      return;
    }

    await base44.entities.Booking.create({
      workspace_id: selectedWorkspace,
      workspace_name: workspace.name,
      date,
      start_time: startTime,
      end_time: endTime,
      status: "confirmed",
      notes,
      total_workspace_cost: 0,
      total_material_cost: 0,
      total_cost: 0,
      booked_for_email: user.email,
    });

    // Notify the user
    base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Buchungsbestätigung: ${workspace.name}`,
      body: `Hallo ${user.full_name || user.email},\n\nein Administrator hat folgende Buchung für dich angelegt:\n\nArbeitsplatz: ${workspace.name}\nDatum: ${date}\nZeitraum: ${startTime} – ${endTime} Uhr\n\nFolkwang Fotolabor`,
    }).catch(() => {});

    toast({ title: "Buchung angelegt", description: `${workspace.name} für ${user.full_name || user.email}` });
    setSelectedUser(""); setSelectedWorkspace(""); setDate(""); setSlotType("1h"); setStartTime(""); setNotes("");
    setLoading(false);
    onOpenChange(false);
    onBooked?.();
  };

  const userName = (u) => u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buchung für Nutzer anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Nutzer *</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger><SelectValue placeholder="Nutzer auswählen" /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{userName(u)} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Arbeitsplatz *</Label>
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger><SelectValue placeholder="Arbeitsplatz auswählen" /></SelectTrigger>
              <SelectContent>
                {workspaces.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}{w.location ? ` – ${w.location}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Buchungsart</Label>
            <Select value={slotType} onValueChange={v => { setSlotType(v); setStartTime(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLOT_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Datum <span className="text-muted-foreground text-xs">(Mo–Fr)</span></Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {date && !isWeekday(date) && (
              <p className="text-xs text-destructive mt-1">Nur Werktage (Mo–Fr) buchbar.</p>
            )}
          </div>
          <div>
            <Label>Startzeit</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger><SelectValue placeholder="Startzeit wählen" /></SelectTrigger>
              <SelectContent>
                {startOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {startTime && (
            <div className="bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Zeitraum:</span>
              <span className="font-semibold ml-2">{startTime} – {endTime} Uhr</span>
            </div>
          )}
          <div>
            <Label>Notizen (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Besondere Anforderungen..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Wird gebucht…" : "Buchen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}