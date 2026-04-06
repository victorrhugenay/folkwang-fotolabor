import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Shield, Wrench, CheckCircle, XCircle, AlertTriangle, RefreshCw, Clock, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

const STATUS_CONFIG = {
  available: { label: "Verfügbar", variant: "default", icon: CheckCircle, color: "text-green-600" },
  maintenance: { label: "Wartung", variant: "secondary", icon: Wrench, color: "text-yellow-600" },
  inactive: { label: "Inaktiv", variant: "destructive", icon: XCircle, color: "text-red-500" },
};

export default function Wartung() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [workspaces, setWorkspaces] = useState([]);
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [closureDialog, setClosureDialog] = useState(false);
  const [closureForm, setClosureForm] = useState({});

  const loadData = async () => {
    const [ws, c] = await Promise.all([
      base44.entities.Workspace.list(),
      base44.entities.Closure.list(),
    ]);
    setWorkspaces(ws);
    setClosures(c);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const formatClosureDisplay = (c) => {
    if (c.start_date === c.end_date) {
      return c.is_all_day ? `${c.start_date} (Ganztag)` : `${c.start_date} ${c.start_time}–${c.end_time}`;
    }
    return `${c.start_date} bis ${c.end_date}${c.is_all_day ? " (Ganztag)" : ""}`;
  };

  const handleSaveClosure = async (data) => {
    if (closureForm.id) {
      await base44.entities.Closure.update(closureForm.id, data);
      toast({ title: "Schließung gespeichert" });
    } else {
      await base44.entities.Closure.create(data);
      toast({ title: "Schließung erstellt" });
    }
    setClosureDialog(false);
    setClosureForm({});
    loadData();
  };

  const handleDeleteClosure = async (id) => {
    await base44.entities.Closure.delete(id);
    toast({ title: "Schließung gelöscht" });
    loadData();
  };

  const setStatus = async (workspace, newStatus) => {
    setUpdating(workspace.id);

    await base44.entities.Workspace.update(workspace.id, { status: newStatus });

    // If switching to maintenance or inactive, cancel future confirmed bookings
    if (newStatus === "maintenance" || newStatus === "inactive") {
      const today = new Date().toISOString().split("T")[0];
      const futureBookings = await base44.entities.Booking.filter({
        workspace_id: workspace.id,
        status: "confirmed",
      });
      const toCancel = futureBookings.filter(b => b.date >= today);
      await Promise.all(
        toCancel.map(async (b) => {
          await base44.entities.Booking.update(b.id, { status: "cancelled" });
          if (b.created_by) {
            base44.integrations.Core.SendEmail({
              to: b.created_by,
              subject: `Buchung storniert: ${workspace.name}`,
              body: `Hallo,\n\ndeine Buchung wurde automatisch storniert, da der Arbeitsplatz in den ${newStatus === "maintenance" ? "Wartungsmodus" : "inaktiven Modus"} versetzt wurde:\n\nArbeitsplatz: ${workspace.name}\nDatum: ${b.date}\nZeitraum: ${b.start_time} – ${b.end_time} Uhr\n\nBei Fragen wende dich an deine Administratoren.\n\nFolkwang Fotolabor`,
            }).catch(() => {});
          }
        })
      );
      if (toCancel.length > 0) {
        toast({
          title: `Status geändert`,
          description: `${toCancel.length} zukünftige Buchung(en) wurden automatisch storniert.`,
        });
      } else {
        toast({ title: `Status auf "${STATUS_CONFIG[newStatus].label}" gesetzt` });
      }
    } else {
      toast({ title: `Status auf "${STATUS_CONFIG[newStatus].label}" gesetzt` });
    }

    await loadData();
    setUpdating(null);
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Shield className="h-10 w-10 opacity-40" />
        <p className="font-medium">Kein Zugriff – nur für Administratoren</p>
      </div>
    );
  }

  const counts = {
    available: workspaces.filter(w => w.status === "available").length,
    maintenance: workspaces.filter(w => w.status === "maintenance").length,
    inactive: workspaces.filter(w => w.status === "inactive").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wartung</h1>
          <p className="text-muted-foreground mt-1">Statusverwaltung & Laborschließungen</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setClosureForm({}); setClosureDialog(true); }} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-1" /> Schließung
          </Button>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aktualisieren
          </Button>
        </div>
      </div>

      {/* Closures section */}
      {closures.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="h-5 w-5" /> Laborschließungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {closures.map(c => (
              <div key={c.id} className="bg-card rounded-lg border border-border p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium">{formatClosureDisplay(c)}</p>
                  {c.reason && <p className="text-sm text-muted-foreground mt-1">{c.reason}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setClosureForm(c); setClosureDialog(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClosure(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(counts).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div key={status} className="bg-card border border-border p-4 flex items-center gap-3">
              <Icon className={`h-6 w-6 shrink-0 ${cfg.color}`} />
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workspace list */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Arbeitsplatz</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Standort</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-right font-medium px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workspaces.map(w => {
                const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.available;
                const Icon = cfg.icon;
                const isUpdating = updating === w.id;
                return (
                  <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-accent flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-accent-foreground">{w.name?.[0]}</span>
                        </div>
                        <p className="font-medium">{w.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {w.location || "–"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {w.status !== "available" && (
                          <Button
                            size="sm" variant="outline"
                            disabled={isUpdating}
                            onClick={() => setStatus(w, "available")}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verfügbar
                          </Button>
                        )}
                        {w.status !== "maintenance" && (
                          <Button
                            size="sm" variant="outline"
                            disabled={isUpdating}
                            onClick={() => setStatus(w, "maintenance")}
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                          >
                            <Wrench className="h-3.5 w-3.5 mr-1" /> Wartung
                          </Button>
                        )}
                        {w.status !== "inactive" && (
                          <Button
                            size="sm" variant="outline"
                            disabled={isUpdating}
                            onClick={() => setStatus(w, "inactive")}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Inaktiv
                          </Button>
                        )}
                        {isUpdating && (
                          <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {workspaces.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Keine Arbeitsplätze vorhanden</div>
        )}
      </div>

      {counts.maintenance > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 px-4 py-3 text-yellow-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {counts.maintenance} Arbeitsplatz/Arbeitsplätze im Wartungsmodus – zukünftige Buchungen sind gesperrt.
          </p>
        </div>
      )}

      {/* Closure Dialog */}
      <Dialog open={closureDialog} onOpenChange={setClosureDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{closureForm.id ? "Schließung bearbeiten" : "Neue Schließung"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Startdatum *</Label>
              <Input
                type="date"
                value={closureForm.start_date || ""}
                onChange={(e) => setClosureForm({ ...closureForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Enddatum *</Label>
              <Input
                type="date"
                value={closureForm.end_date || ""}
                onChange={(e) => setClosureForm({ ...closureForm, end_date: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_all_day"
                checked={closureForm.is_all_day || false}
                onChange={(e) => setClosureForm({ ...closureForm, is_all_day: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_all_day" className="cursor-pointer">Ganztägig (09:00–18:00)</Label>
            </div>
            {!closureForm.is_all_day && closureForm.start_date === closureForm.end_date && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Startzeit</Label>
                  <Input
                    type="time"
                    value={closureForm.start_time || "09:00"}
                    onChange={(e) => setClosureForm({ ...closureForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Endzeit</Label>
                  <Input
                    type="time"
                    value={closureForm.end_time || "18:00"}
                    onChange={(e) => setClosureForm({ ...closureForm, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Grund (optional)</Label>
              <Input
                value={closureForm.reason || ""}
                onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })}
                placeholder="z.B. Wartung, Feiertag"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosureDialog(false)}>Abbrechen</Button>
            <Button
              onClick={() => handleSaveClosure({ 
                start_date: closureForm.start_date, 
                end_date: closureForm.end_date,
                is_all_day: closureForm.is_all_day || false,
                start_time: closureForm.is_all_day ? "09:00" : closureForm.start_time,
                end_time: closureForm.is_all_day ? "18:00" : closureForm.end_time,
                reason: closureForm.reason 
              })}
              disabled={!closureForm.start_date || !closureForm.end_date || (!closureForm.is_all_day && closureForm.start_date === closureForm.end_date && (!closureForm.start_time || !closureForm.end_time))}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}