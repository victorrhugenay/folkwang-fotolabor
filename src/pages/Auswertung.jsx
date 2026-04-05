import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Shield, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Auswertung() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Booking.list("-created_date", 500),
      base44.entities.MaterialUsage.list("-created_date", 500),
    ]).then(([u, b, mu]) => {
      setUsers(u);
      setBookings(b);
      setUsages(mu);
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

  // Standalone usages = no booking_id or booking not found
  const bookingIds = new Set(bookings.map(b => b.id));
  const standaloneUsages = usages.filter(u => !u.booking_id || !bookingIds.has(u.booking_id));

  const toggleUsagePaid = async (usage) => {
    const newPaid = !usage.paid;
    await base44.entities.MaterialUsage.update(usage.id, { paid: newPaid });
    setUsages(prev => prev.map(u => u.id === usage.id ? { ...u, paid: newPaid } : u));
    toast({ title: newPaid ? "Als bezahlt markiert" : "Als offen markiert" });
    if (usage.created_by) {
      base44.integrations.Core.SendEmail({
        to: usage.created_by,
        subject: `Zahlungsstatus geändert: ${usage.material_name}`,
        body: `Hallo,\n\nder Zahlungsstatus deiner Materialbuchung wurde aktualisiert:\n\nMaterial: ${usage.material_name}\nMenge: ${usage.quantity} ${usage.unit}\nBetrag: ${usage.total_price?.toFixed(2)} €\nZahlungsstatus: ${newPaid ? "Bezahlt ✓" : "Offen"}\n\nFolkwang Fotolabor`,
      }).catch(() => {});
    }
  };

  // Aggregate costs per user (by created_by = email)
  const userStats = users.map(u => {
    const userBookings = bookings.filter(b => b.created_by === u.email && b.status !== "cancelled");
    const userStandaloneUsages = standaloneUsages.filter(s => s.created_by === u.email);
    const workspaceCost = userBookings.reduce((s, b) => s + (b.total_workspace_cost || 0), 0);
    const materialCost = userBookings.reduce((s, b) => s + (b.total_material_cost || 0), 0)
      + userStandaloneUsages.reduce((s, mu) => s + (mu.total_price || 0), 0);
    const totalCost = workspaceCost + materialCost;
    return { ...u, userBookings, userStandaloneUsages, totalCost, workspaceCost, materialCost };
  }).sort((a, b) => b.totalCost - a.totalCost);

  const grandTotal = userStats.reduce((s, u) => s + u.totalCost, 0);

  const togglePaid = async (booking) => {
    const newPaid = !booking.paid;
    await base44.entities.Booking.update(booking.id, { paid: newPaid });
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, paid: newPaid } : b));
    toast({ title: newPaid ? "Als bezahlt markiert" : "Als offen markiert" });
    // Notify user
    if (booking.created_by) {
      base44.integrations.Core.SendEmail({
        to: booking.created_by,
        subject: `Zahlungsstatus geändert: ${booking.workspace_name}`,
        body: `Hallo,\n\nder Zahlungsstatus deiner Buchung wurde aktualisiert:\n\nArbeitsplatz: ${booking.workspace_name}\nDatum: ${booking.date}\nZeitraum: ${booking.start_time} – ${booking.end_time} Uhr\nZahlungsstatus: ${newPaid ? "Bezahlt ✓" : "Offen"}\n\nFolkwang Fotolabor`,
      }).catch(() => {});
    }
  };

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
                <th className="text-left font-medium px-4 py-3">Buchungen & Zahlung</th>
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
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {u.userBookings.map(b => (
                        <div key={b.id} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground truncate max-w-[120px]">{b.date} {b.workspace_name}</span>
                          <button
                            onClick={() => togglePaid(b)}
                            className={`px-2 py-0.5 rounded-full font-medium shrink-0 transition-colors ${
                              b.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {b.paid ? "Bezahlt" : "Offen"}
                          </button>
                        </div>
                      ))}
                      {u.userStandaloneUsages.map(mu => (
                        <div key={mu.id} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground truncate max-w-[120px]">📦 {mu.material_name} ({mu.quantity} {mu.unit})</span>
                          <button
                            onClick={() => toggleUsagePaid(mu)}
                            className={`px-2 py-0.5 rounded-full font-medium shrink-0 transition-colors ${
                              mu.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {mu.paid ? "Bezahlt" : "Offen"}
                          </button>
                        </div>
                      ))}
                    </div>
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