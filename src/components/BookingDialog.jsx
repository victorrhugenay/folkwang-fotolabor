import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
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

export default function BookingDialog({ open, onOpenChange, workspace, onBooked }) {
  const [date, setDate] = useState("");
  const [slotType, setSlotType] = useState("1h");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessAllowed, setAccessAllowed] = useState(null);

  useEffect(() => {
    if (!open || !workspace) return;
    setAccessAllowed(null);
    Promise.all([
      base44.auth.me(),
      base44.entities.GroupMembership.list(),
      base44.entities.Group.list(),
    ]).then(([me, memberships, groups]) => {
      const userMemberships = memberships.filter(m => m.user_email === me.email);
      const userGroupIds = userMemberships.map(m => m.group_id);
      const allowed = groups.some(g =>
        userGroupIds.includes(g.id) && (g.workspace_ids || []).includes(workspace.id)
      );
      setAccessAllowed(allowed);
    });
  }, [open, workspace]);

  const selectedSlot = SLOT_TYPES.find(s => s.value === slotType);
  const startOptions = getStartOptions(selectedSlot?.duration || 1);
  const endTime = startTime ? addHours(startTime, selectedSlot?.duration || 1) : "";

  const handleSlotChange = (val) => {
    setSlotType(val);
    setStartTime("");
  };

  const handleSubmit = async () => {
    if (!date || !startTime) {
      toast({ title: "Fehler", description: "Bitte Datum und Startzeit auswählen.", variant: "destructive" });
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
      toast({ title: "Fehler", description: "Buchungen sind nur von Montag bis Freitag möglich.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Check for double bookings
    const existing = await base44.entities.Booking.filter({
      workspace_id: workspace.id,
      date: date,
      status: "confirmed",
    });
    const hasOverlap = existing.some(b => b.start_time < endTime && b.end_time > startTime);
    if (hasOverlap) {
      toast({ title: "Doppelbuchung", description: "Dieser Arbeitsplatz ist im gewählten Zeitraum bereits gebucht.", variant: "destructive" });
      setLoading(false);
      return;
    }

    await base44.entities.Booking.create({
      workspace_id: workspace.id,
      workspace_name: workspace.name,
      date,
      start_time: startTime,
      end_time: endTime,
      status: "confirmed",
      notes,
      total_workspace_cost: 0,
      total_material_cost: 0,
      total_cost: 0,
    });

    toast({ title: "Gebucht!", description: `${workspace.name} am ${date} von ${startTime} bis ${endTime}` });
    // Send confirmation email
    const me = await base44.auth.me();
    base44.integrations.Core.SendEmail({
      to: me.email,
      subject: `Buchungsbestätigung: ${workspace.name}`,
      body: `Hallo,\n\ndeine Buchung wurde bestätigt:\n\nArbeitsplatz: ${workspace.name}\nDatum: ${date}\nZeitraum: ${startTime} – ${endTime} Uhr\n\nBei Fragen wende dich an deine Administratoren.\n\nFolkwang Fotolabor`,
    }).catch(() => {});
    setDate("");
    setSlotType("1h");
    setStartTime("");
    setNotes("");
    setLoading(false);
    onOpenChange(false);
    onBooked?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Arbeitsplatz buchen</DialogTitle>
        </DialogHeader>
        {accessAllowed === null && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {accessAllowed === false && (
          <div className="py-6 text-center space-y-2">
            <p className="font-semibold text-destructive">Kein Zugriff</p>
            <p className="text-sm text-muted-foreground">Du bist nicht für diesen Arbeitsplatz freigeschaltet. Bitte wende dich an einen Administrator.</p>
          </div>
        )}
        {accessAllowed === true && <div className="space-y-4 py-2">
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="font-medium text-sm">{workspace?.name}</p>
            <p className="text-xs text-muted-foreground">{workspace?.location} · Kostenlos · Mo–Fr 09:00–18:00</p>
          </div>
          <div>
            <Label>Buchungsart</Label>
            <Select value={slotType} onValueChange={handleSlotChange}>
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
              onChange={(e) => setDate(e.target.value)}
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
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Zeitraum:</span>
              <span className="font-semibold ml-2">{startTime} – {endTime} Uhr</span>
            </div>
          )}
          <div>
            <Label>Notizen (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Besondere Anforderungen..." />
          </div>
        </div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          {accessAllowed === true && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Wird gebucht..." : "Jetzt buchen"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}