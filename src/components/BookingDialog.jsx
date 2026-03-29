import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function BookingDialog({ open, onOpenChange, workspace, onBooked }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime) {
      toast({ title: "Fehler", description: "Bitte alle Pflichtfelder ausfüllen.", variant: "destructive" });
      return;
    }
    if (startTime >= endTime) {
      toast({ title: "Fehler", description: "Endzeit muss nach Startzeit liegen.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const hours = parseInt(endTime) - parseInt(startTime);
    const workspaceCost = (hours / 8) * (workspace.price_per_day || 0);

    await base44.entities.Booking.create({
      workspace_id: workspace.id,
      workspace_name: workspace.name,
      date,
      start_time: startTime,
      end_time: endTime,
      status: "confirmed",
      notes,
      total_workspace_cost: Math.round(workspaceCost * 100) / 100,
      total_material_cost: 0,
      total_cost: Math.round(workspaceCost * 100) / 100,
    });

    toast({ title: "Gebucht!", description: `${workspace.name} am ${date} von ${startTime} bis ${endTime}` });
    setDate("");
    setStartTime("");
    setEndTime("");
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
        <div className="space-y-4 py-2">
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="font-medium text-sm">{workspace?.name}</p>
            <p className="text-xs text-muted-foreground">{workspace?.location} · {workspace?.price_per_day?.toFixed(2)} €/Tag</p>
          </div>
          <div>
            <Label>Datum</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Von</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bis</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger><SelectValue placeholder="Ende" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notizen (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Besondere Anforderungen..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Wird gebucht..." : "Jetzt buchen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}