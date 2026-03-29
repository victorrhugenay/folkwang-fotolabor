import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, CalendarDays, Receipt, Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list("-created_date", 50),
      base44.entities.Workspace.list(),
      base44.entities.Material.list(),
    ]).then(([b, w, m]) => {
      setBookings(b);
      setWorkspaces(w);
      setMaterials(m);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status === "confirmed");
  const totalCosts = bookings.reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const totalMaterialCosts = bookings.reduce((sum, b) => sum + (b.total_material_cost || 0), 0);
  const recentBookings = bookings.slice(0, 5);

  const statusMap = {
    confirmed: { label: "Bestätigt", variant: "default" },
    cancelled: { label: "Storniert", variant: "destructive" },
    completed: { label: "Abgeschlossen", variant: "secondary" },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Übersicht über Ihre Buchungen und Kosten</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Arbeitsplätze" value={workspaces.length} subtitle="Insgesamt verfügbar" />
        <StatCard icon={CalendarDays} label="Aktive Buchungen" value={activeBookings.length} subtitle="Aktuell bestätigt" />
        <StatCard icon={Receipt} label="Gesamtkosten" value={`${totalCosts.toFixed(2)} €`} subtitle="Alle Buchungen" />
        <StatCard icon={Package} label="Materialkosten" value={`${totalMaterialCosts.toFixed(2)} €`} subtitle="Materialverbrauch" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Letzte Buchungen</h2>
            <Link to="/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentBookings.length === 0 && (
              <p className="px-5 py-8 text-center text-muted-foreground text-sm">Keine Buchungen vorhanden</p>
            )}
            {recentBookings.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{b.workspace_name}</p>
                  <p className="text-xs text-muted-foreground">{b.date} · {b.start_time}–{b.end_time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{(b.total_cost || 0).toFixed(2)} €</span>
                  <Badge variant={statusMap[b.status]?.variant || "secondary"}>
                    {statusMap[b.status]?.label || b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Schnellzugriff</h2>
          </div>
          <div className="p-5 space-y-3">
            <Link to="/workspaces" className="flex items-center gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Arbeitsplatz buchen</p>
                <p className="text-xs text-muted-foreground">Verfügbare Plätze ansehen & buchen</p>
              </div>
            </Link>
            <Link to="/materials" className="flex items-center gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Materialien verwalten</p>
                <p className="text-xs text-muted-foreground">Materialbestand & Preise bearbeiten</p>
              </div>
            </Link>
            <Link to="/costs" className="flex items-center gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Abrechnung ansehen</p>
                <p className="text-xs text-muted-foreground">Kostenübersicht & Auswertungen</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}