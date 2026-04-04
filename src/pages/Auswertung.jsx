import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Shield, User, TrendingUp } from "lucide-react";

export default function Auswertung() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Booking.list("-created_date", 500),
    ]).then(([u, b]) => {
      setUsers(u);
      setBookings(b);
      setLoading(false);
    });
  }, []);

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

  // Aggregate costs per user (by created_by = email)
  const userStats = users.map(u => {
    const userBookings = bookings.filter(b => b.created_by === u.email && b.status !== "cancelled");
    const totalCost = userBookings.reduce((s, b) => s + (b.total_cost || 0), 0);
    const workspaceCost = userBookings.reduce((s, b) => s + (b.total_workspace_cost || 0), 0);
    const materialCost = userBookings.reduce((s, b) => s + (b.total_material_cost || 0), 0);
    return { ...u, userBookings, totalCost, workspaceCost, materialCost };
  }).sort((a, b) => b.totalCost - a.totalCost);

  const grandTotal = userStats.reduce((s, u) => s + u.totalCost, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auswertung</h1>
        <p className="text-muted-foreground mt-1">Kosten aller Nutzer im Überblick</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Gesamtkosten</p>
          <p className="text-2xl font-bold mt-1">{grandTotal.toFixed(2)} €</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Buchungen gesamt</p>
          <p className="text-2xl font-bold mt-1">{bookings.filter(b => b.status !== "cancelled").length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">Aktive Nutzer</p>
          <p className="text-2xl font-bold mt-1">{userStats.filter(u => u.userBookings.length > 0).length}</p>
        </div>
      </div>

      {/* User cost table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Nutzer</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Matrikelnr.</th>
                <th className="text-right font-medium px-4 py-3 hidden md:table-cell">Buchungen</th>
                <th className="text-right font-medium px-4 py-3 hidden md:table-cell">Arbeitsplatz</th>
                <th className="text-right font-medium px-4 py-3 hidden md:table-cell">Material</th>
                <th className="text-right font-medium px-4 py-3">Gesamt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userStats.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {u.vorname || u.nachname
                            ? `${u.vorname || ""} ${u.nachname || ""}`.trim()
                            : u.full_name || "–"}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {u.matrikelnummer || "–"}
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">{u.userBookings.length}</td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">{u.workspaceCost.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">{u.materialCost.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {u.totalCost > 0
                      ? <span className="text-primary">{u.totalCost.toFixed(2)} €</span>
                      : <span className="text-muted-foreground">0,00 €</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50">
                <td colSpan={2} className="px-4 py-3 font-semibold">Gesamt</td>
                <td className="px-4 py-3 text-right hidden md:table-cell font-semibold">
                  {bookings.filter(b => b.status !== "cancelled").length}
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell font-semibold">
                  {userStats.reduce((s, u) => s + u.workspaceCost, 0).toFixed(2)} €
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell font-semibold">
                  {userStats.reduce((s, u) => s + u.materialCost, 0).toFixed(2)} €
                </td>
                <td className="px-4 py-3 text-right font-bold text-primary">{grandTotal.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {userStats.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Keine Daten vorhanden</div>
        )}
      </div>
    </div>
  );
}