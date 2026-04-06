import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ChevronDown, ChevronUp, Shield, User, Mail, Loader2, FileDown, Trash2, Inbox } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Auswertung() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  // Early return for non-admins before any more hooks
  if (!userLoading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Shield className="h-10 w-10 opacity-40" />
        <p className="font-medium">Kein Zugriff – nur für Administratoren</p>
      </div>
    );
  }

  useEffect(() => {
    if (userLoading || !isAdmin) return;
    
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
  }, [userLoading]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
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



  const sendCostSummary = async (u) => {
    setSendingEmail(u.id);
    const name = u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email;
    const total = u.totalCost.toFixed(2);
    const workspace = u.workspaceCost.toFixed(2);
    const material = u.materialCost.toFixed(2);
    const body = `Hallo ${name},\n\nanbei deine Kostenaufstellung für das Fotolabor:\n\nArbeitsplatzkosten: ${workspace} €\nMaterialkosten: ${material} €\nGesamt: ${total} €\n\nBitte überweise den ausstehenden Betrag. Vielen Dank!\n\nFolkwang Fotolabor`;
    try {
      await base44.integrations.Core.SendEmail({
        to: u.email,
        subject: `Kostenaufstellung Fotolabor - ${total} €`,
        body,
      });
      toast({ title: "E-Mail versendet" });
    } catch {
      toast({ title: "Fehler beim Versand", variant: "destructive" });
    } finally {
      setSendingEmail(null);
    }
  };

  // CSV export helpers
  const downloadCSV = (filename, rows) => {
    const sep = ";";
    const escape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = rows.map(r => r.map(escape).join(sep)).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportUserCSV = (u) => {
    const name = u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email;
    const rows = [
      ["Typ", "Datum", "Bezeichnung", "Material €", "Gesamt €", "Status"],
      ...u.userBookings.map(b => ["Buchung", b.date, b.workspace_name, (b.total_material_cost||0).toFixed(2), (b.total_material_cost||0).toFixed(2), b.paid ? "Bezahlt" : "Offen"]),
      ...u.userStandaloneUsages.map(mu => ["Material", "", `${mu.material_name} (${mu.quantity} ${mu.unit})`, (mu.total_price||0).toFixed(2), (mu.total_price||0).toFixed(2), mu.paid ? "Bezahlt" : "Offen"]),
      ["", "", "GESAMT", u.materialCost.toFixed(2), u.materialCost.toFixed(2), ""],
    ];
    downloadCSV(`kosten_${name.replace(/\s+/g, "_")}.csv`, rows);
  };

  const exportAllCSV = () => {
    const rows = [
      ["Name", "E-Mail", "Matrikelnr.", "Buchungen", "Material €", "Gesamt €"],
      ...userStats.map(u => [
        u.vorname || u.nachname ? `${u.vorname||""} ${u.nachname||""}`.trim() : u.full_name || "",
        u.email, u.matrikelnummer || "", u.userBookings.length,
        u.materialCost.toFixed(2), u.materialCost.toFixed(2),
      ]),
      ["GESAMT", "", "", bookings.filter(b=>b.status!=="cancelled").length,
        userStats.reduce((s,u)=>s+u.materialCost,0).toFixed(2),
        grandTotal.toFixed(2)],
    ];
    downloadCSV("kostenaufstellung_alle.csv", rows);
  };

  // Aggregate costs per user (by created_by = email)
  const userStats = users.map(u => {
    const userBookings = bookings.filter(b => b.created_by === u.email && b.status !== "cancelled");
    const userStandaloneUsages = standaloneUsages.filter(s => s.created_by === u.email);
    const materialCost = userBookings.reduce((s, b) => s + (b.total_material_cost || 0), 0)
      + userStandaloneUsages.reduce((s, mu) => s + (mu.total_price || 0), 0);
    const totalCost = materialCost;
    return { ...u, userBookings, userStandaloneUsages, totalCost, materialCost };
  }).sort((a, b) => b.totalCost - a.totalCost);

  const grandTotal = userStats.reduce((s, u) => s + u.totalCost, 0);

  const togglePaid = async (booking) => {
    const newPaid = !booking.paid;
    await base44.entities.Booking.update(booking.id, { paid: newPaid });
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, paid: newPaid } : b));
    toast({ title: newPaid ? "Als bezahlt markiert" : "Als offen markiert" });
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auswertung</h1>
          <p className="text-muted-foreground mt-1">Kosten aller Nutzer im Überblick</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={exportAllCSV}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border hover:bg-muted transition-colors shrink-0"
            title="Alle Kosten als CSV exportieren"
          >
            <FileDown className="h-4 w-4" /> CSV Export
          </button>
        </div>
        </div>

        {/* User cost table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Nutzer</th>
                <th className="text-right font-medium px-4 py-3">Kosten</th>
                <th className="text-right font-medium px-4 py-3">Offene Kosten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userStats.map(u => {
                const paidBookings = u.userBookings.filter(b => b.paid).length;
                const unpaidAmount = u.userBookings.filter(b => !b.paid).reduce((s, b) => s + (b.total_cost || 0), 0)
                  + u.userStandaloneUsages.filter(mu => !mu.paid).reduce((s, mu) => s + (mu.total_price || 0), 0);
                return (
                <React.Fragment key={u.id}>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedUser === u.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                      <div>
                        <p className="font-medium">
                          {u.vorname || u.nachname
                            ? `${u.vorname || ""} ${u.nachname || ""}`.trim()
                            : u.full_name || "–"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {u.totalCost > 0 ? u.totalCost.toFixed(2) + " €" : "0,00 €"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: unpaidAmount > 0 ? "#ff3b30" : "#34c759" }}>
                    {unpaidAmount > 0 ? unpaidAmount.toFixed(2) + " €" : "0,00 €"}
                  </td>
                </tr>
                {expandedUser === u.id && (
                  <tr className="bg-muted/30">
                    <td colSpan={3} className="px-4 py-4">
                      <div className="space-y-2">
                        {u.userBookings.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2">BUCHUNGEN</h4>
                            <div className="space-y-1">
                              {u.userBookings.map(b => (
                                <div key={b.id} className="flex items-center gap-3 text-xs bg-background/50 px-3 py-2 rounded border border-border/50">
                                  <span className="flex-1">{b.date} · {b.start_time}–{b.end_time}</span>
                                  <span className="text-muted-foreground">{b.workspace_name}</span>
                                  <span className="font-semibold w-24 text-right">{(b.total_cost || 0).toFixed(2)} €</span>
                                  <button
                                    onClick={() => togglePaid(b)}
                                    className={`px-2.5 py-0.5 rounded-full font-medium shrink-0 transition-colors text-xs ${
                                      b.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                    }`}
                                  >
                                    {b.paid ? "Bezahlt" : "Offen"}
                                  </button>
                                  <button
                                    onClick={() => base44.entities.Booking.delete(b.id).then(() => window.location.reload())}
                                    className="p-1 rounded hover:bg-red-100 text-destructive hover:text-red-700 transition-colors"
                                    title="Buchung löschen"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {u.userStandaloneUsages.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 mt-3">EIGENSTÄNDIGE MATERIALIEN</h4>
                            <div className="space-y-1">
                              {u.userStandaloneUsages.map(mu => (
                                <div key={mu.id} className="flex items-center gap-3 text-xs bg-background/50 px-3 py-2 rounded border border-border/50">
                                  <span className="flex-1">{mu.material_name}</span>
                                  <span className="text-muted-foreground">{mu.quantity} {mu.unit}</span>
                                  <span className="font-semibold w-24 text-right">{(mu.total_price || 0).toFixed(2)} €</span>
                                  <button
                                    onClick={() => toggleUsagePaid(mu)}
                                    className={`px-2.5 py-0.5 rounded-full font-medium shrink-0 transition-colors text-xs ${
                                      mu.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                    }`}
                                  >
                                    {mu.paid ? "Bezahlt" : "Offen"}
                                  </button>
                                  <button
                                    onClick={() => base44.entities.MaterialUsage.delete(mu.id).then(() => window.location.reload())}
                                    className="p-1 rounded hover:bg-red-100 text-destructive hover:text-red-700 transition-colors"
                                    title="Material löschen"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
              })}
            </tbody>
            <tfoot>
             <tr className="border-t-2 border-border bg-muted/50">
               <td className="px-4 py-3 font-semibold">Gesamt</td>
               <td className="px-4 py-3 text-right font-bold text-primary">{grandTotal.toFixed(2)} €</td>
               <td className="px-4 py-3 text-right font-bold" style={{ color: "#ff3b30" }}>{grandTotal.toFixed(2)} €</td>
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