import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, CalendarDays, Receipt, Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(me => {
      setUserEmail(me.email);
      Promise.all([
        base44.entities.Booking.list("-created_date", 200),
        base44.entities.Workspace.list(),
      ]).then(([b, w]) => {
        setBookings(b.filter(bk => bk.created_by === me.email));
        setWorkspaces(w);
        setLoading(false);
      });
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
  const totalCosts = bookings.filter(b => b.status !== "cancelled").reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const totalMaterialCosts = bookings.filter(b => b.status !== "cancelled").reduce((sum, b) => sum + (b.total_material_cost || 0), 0);
  const availableWorkspaces = workspaces.filter(w => w.status === "available");
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
        <Link to="/workspaces" className="block hover:opacity-90 transition-opacity">
          <StatCard icon={Building2} label="Verfügbare Arbeitsplätze" value={availableWorkspaces.length} subtitle="Jetzt buchbar" />
        </Link>
        <Link to="/bookings" className="block hover:opacity-90 transition-opacity">
          <StatCard icon={CalendarDays} label="Meine aktiven Buchungen" value={activeBookings.length} subtitle="Aktuell bestätigt" />
        </Link>
        <Link to="/costs" className="block hover:opacity-90 transition-opacity">
          <StatCard icon={Receipt} label="Meine Gesamtkosten" value={`${totalCosts.toFixed(2)} €`} subtitle="Eigene Buchungen" />
        </Link>
        <Link to="/costs" className="block hover:opacity-90 transition-opacity">
          <StatCard icon={Package} label="Meine Materialkosten" value={`${totalMaterialCosts.toFixed(2)} €`} subtitle="Eigener Verbrauch" />
        </Link>
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

        {/* Available Workspaces */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Verfügbare Arbeitsplätze</h2>
            <Link to="/workspaces" className="text-sm text-primary hover:underline flex items-center gap-1">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {availableWorkspaces.length === 0 && (
              <p className="px-5 py-8 text-center text-muted-foreground text-sm">Keine Arbeitsplätze verfügbar</p>
            )}
            {availableWorkspaces.slice(0, 5).map(w => (
              <Link key={w.id} to="/workspaces" className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.location || "Kein Standort"}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{w.price_per_day ? `${w.price_per_day.toFixed(2)} €/Tag` : "Kostenlos"}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}