import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, XCircle, CheckCircle, Package, Clock, ChevronDown, ChevronUp, Archive, Plus, Trash2 } from "lucide-react";
import { formatDate } from "../utils/formatDate";
import { toast } from "@/components/ui/use-toast";
import MaterialUsageDialog from "../components/MaterialUsageDialog";
import BookingMaterialList from "../components/BookingMaterialList";
import AdminBookingDialog from "../components/AdminBookingDialog";
import AdminMaterialDialog from "../components/AdminMaterialDialog";
import { useCurrentUser } from "../hooks/useCurrentUser";

const statusMap = {
  confirmed: { label: "Bestätigt", variant: "default", icon: Clock },
  cancelled: { label: "Storniert", variant: "destructive", icon: XCircle },
  completed: { label: "Abgeschlossen", variant: "secondary", icon: CheckCircle },
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [materialBooking, setMaterialBooking] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [adminBookingOpen, setAdminBookingOpen] = useState(false);
  const [adminMaterialOpen, setAdminMaterialOpen] = useState(false);
  const { isAdmin, user: currentUser } = useCurrentUser();

  const loadData = async () => {
    const allBookings = await base44.entities.Booking.list("-created_date", 100);
    const myBookings = isAdmin ? allBookings : allBookings.filter(b => b.created_by === currentUser?.email);
    setBookings(myBookings);
    if (isAdmin) {
      const u = await base44.entities.User.list().catch(() => []);
      setUsers(u);
    }
    setLoading(false);
  };

  useEffect(() => { if (currentUser !== undefined) loadData(); }, [currentUser, isAdmin]);

  const today = new Date().toISOString().split("T")[0];

  const isArchived = (b) => b.status === "cancelled" || (b.status !== "confirmed" && b.date < today);

  const activeBookings = bookings.filter(b => !isArchived(b));
  const archivedBookings = bookings.filter(isArchived);

  const filtered = filter === "all" ? activeBookings : activeBookings.filter(b => b.status === filter);

  const deleteBooking = async (id) => {
    try {
      await base44.entities.Booking.delete(id);
      toast({ title: "Buchung gelöscht" });
      loadData();
    } catch (error) {
      toast({ title: "Fehler beim Löschen", description: error.message, variant: "destructive" });
    }
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Booking.update(id, { status });
    toast({ title: `Status auf "${statusMap[status]?.label}" geändert` });
    const booking = bookings.find(b => b.id === id);
    if (booking?.created_by) {
      const label = statusMap[status]?.label || status;
      base44.integrations.Core.SendEmail({
        to: booking.created_by,
        subject: `Buchungsstatus geändert: ${booking.workspace_name}`,
        body: `Hallo,\n\nder Status deiner Buchung wurde geändert:\n\nArbeitsplatz: ${booking.workspace_name}\nDatum: ${booking.date}\nZeitraum: ${booking.start_time} – ${booking.end_time} Uhr\nNeuer Status: ${label}\n\nFolkwang Fotolabor`,
      }).catch(() => {});
    }
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buchungen</h1>
          <p className="text-muted-foreground mt-1">{bookings.length} Buchungen insgesamt</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button onClick={() => setAdminBookingOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Für Nutzer buchen
              </Button>
              <Button onClick={() => setAdminMaterialOpen(true)} size="sm" variant="outline">
                <Package className="h-4 w-4 mr-1" /> Material hinzufügen
              </Button>
            </>
          )}
          <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Buchungen</SelectItem>
            <SelectItem value="confirmed">Bestätigt</SelectItem>
            <SelectItem value="completed">Abgeschlossen</SelectItem>
            <SelectItem value="cancelled">Storniert</SelectItem>
          </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Keine aktiven Buchungen gefunden</p>
          </div>
        )}
        {filtered.map(b => {
          const st = statusMap[b.status] || statusMap.confirmed;
          const StIcon = st.icon;
          return (
            <div key={b.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <StIcon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{b.workspace_name}</h3>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(b.date)} · {b.start_time} – {b.end_time}
                  </p>
                  {(() => {
                    const u = users.find(u => u.email === b.created_by);
                    const name = u ? (u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email) : b.created_by;
                    return name ? <p className="text-xs text-muted-foreground mt-0.5">👤 {name}</p> : null;
                  })()}
                  {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">{b.notes}</p>}
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <p className="text-lg font-bold">{(b.total_cost || 0).toFixed(2)} €</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Platz: {(b.total_workspace_cost || 0).toFixed(2)} €</p>
                    <p>Material: {(b.total_material_cost || 0).toFixed(2)} €</p>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {b.status === "confirmed" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setMaterialBooking(b)}>
                        <Package className="h-3 w-3 mr-1" /> Material
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "completed")}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Abschließen
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(b.id, "cancelled")}>
                        <XCircle className="h-3 w-3 mr-1" /> Stornieren
                      </Button>
                    </>
                  )}
                  {(isAdmin || b.status === "cancelled") && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBooking(b.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Löschen
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}>
                    Details
                  </Button>
                </div>
              </div>
              {expandedBooking === b.id && (
                <div className="border-t border-border px-5 py-4 bg-muted/30">
                  <BookingMaterialList bookingId={b.id} booking={b} isAdmin={isAdmin} onChanged={loadData} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Archive */}
      {archivedBookings.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setArchiveOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2"
          >
            <Archive className="h-4 w-4" />
            <span className="font-medium">Archiv ({archivedBookings.length} Buchungen)</span>
            {archiveOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>

          {archiveOpen && (
            <div className="space-y-2 mt-2">
              {archivedBookings.map(b => {
                const st = statusMap[b.status] || statusMap.confirmed;
                const StIcon = st.icon;
                return (
                  <div key={b.id} className="bg-muted/40 rounded-xl border border-border overflow-hidden opacity-70">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <StIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">{b.workspace_name}</h3>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(b.date)} · {b.start_time} – {b.end_time}</p>
                        {(() => {
                          const u = users.find(u => u.email === b.created_by);
                          const name = u ? (u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email) : b.created_by;
                          return name ? <p className="text-xs text-muted-foreground mt-0.5">👤 {name}</p> : null;
                        })()}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{(b.total_cost || 0).toFixed(2)} €</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => deleteBooking(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <>
          <AdminBookingDialog
            open={adminBookingOpen}
            onOpenChange={setAdminBookingOpen}
            onBooked={loadData}
          />
          <AdminMaterialDialog
            open={adminMaterialOpen}
            onOpenChange={setAdminMaterialOpen}
            onAdded={loadData}
          />
        </>
      )}
      {materialBooking && (
        <MaterialUsageDialog
          open={!!materialBooking}
          onOpenChange={() => setMaterialBooking(null)}
          booking={materialBooking}
          onAdded={loadData}
        />
      )}
    </div>
  );
}