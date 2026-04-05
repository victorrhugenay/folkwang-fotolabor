import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Shield, Wrench, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const STATUS_CONFIG = {
  available: { label: "Verfügbar", variant: "default", icon: CheckCircle, color: "text-green-600" },
  maintenance: { label: "Wartung", variant: "secondary", icon: Wrench, color: "text-yellow-600" },
  inactive: { label: "Inaktiv", variant: "destructive", icon: XCircle, color: "text-red-500" },
};

export default function Wartung() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const loadData = async () => {
    const ws = await base44.entities.Workspace.list();
    setWorkspaces(ws);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

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
          <p className="text-muted-foreground mt-1">Statusverwaltung aller Arbeitsplätze</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1" /> Aktualisieren
        </Button>
      </div>

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
    </div>
  );
}