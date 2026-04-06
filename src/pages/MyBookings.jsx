import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CalendarDays, Package, XCircle, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

const statusMap = {
  confirmed: { label: "Bestätigt", variant: "default", icon: Clock },
  cancelled: { label: "Storniert", variant: "destructive", icon: XCircle },
  completed: { label: "Abgeschlossen", variant: "secondary", icon: CheckCircle },
};

export default function MyBookings() {
  const { user } = useCurrentUser();
  const [bookings, setBookings] = useState([]);
  const [materialUsages, setMaterialUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const loadData = async () => {
    if (!user?.email) return;
    const [allBookings, allUsages] = await Promise.all([
      base44.entities.Booking.list("-date", 200),
      base44.entities.MaterialUsage.list("-created_date", 500),
    ]);
    setBookings(allBookings.filter(b => b.created_by === user.email));
    setMaterialUsages(allUsages);
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleCancel = async (booking) => {
    await base44.entities.Booking.update(booking.id, { status: "cancelled" });
    toast({ title: "Buchung storniert" });
    loadData();
  };

  const today = new Date().toISOString().split("T")[0];
  const isArchived = (b) => b.status === "cancelled" || b.date < today;

  const active = bookings.filter(b => !isArchived(b));
  const archived = bookings.filter(isArchived);

  // Standalone material usages (no booking or booking not found)
  const standaloneUsages = materialUsages.filter(u =>
    (!u.booking_id || !bookings.find(b => b.id === u.booking_id)) &&
    u.created_by === user?.email
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Übersicht</p>
        <h1 className="text-3xl font-bold tracking-tight">Meine Buchungen</h1>
        <p className="text-muted-foreground mt-1">{bookings.length} Arbeitsplatzbuchungen · {standaloneUsages.length} Materialkosten</p>
      </div>

      {/* Arbeitsplatzbuchungen */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Arbeitsplatzbuchungen</h2>
        {active.length === 0 && (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Keine aktiven Buchungen</p>
          </div>
        )}
        <div className="space-y-3">
          {active.map(b => <BookingCard key={b.id} booking={b} materialUsages={materialUsages} expanded={expandedBooking === b.id} onToggle={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)} onCancel={() => handleCancel(b)} />)}
        </div>
      </section>

      {/* Materialkosten */}
      {standaloneUsages.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Materialkosten</h2>
          <div className="bg-card border border-border divide-y divide-border">
            {standaloneUsages.map(u => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 bg-accent flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.material_name}</p>
                  <p className="text-xs text-muted-foreground">{u.quantity} {u.unit} · {u.price_per_unit?.toFixed(2)} €/{u.unit}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{u.total_price?.toFixed(2)} €</p>
                  {u.paid
                    ? <span className="text-xs text-green-600 font-medium">Bezahlt</span>
                    : <span className="text-xs text-destructive font-medium">Offen</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Archive */}
      {archived.length > 0 && (
        <section>
          <button
            onClick={() => setArchiveOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2 border-t border-border"
          >
            <span className="font-medium">Archiv ({archived.length} Buchungen)</span>
            {archiveOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>
          {archiveOpen && (
            <div className="space-y-3 mt-3">
              {archived.map(b => <BookingCard key={b.id} booking={b} materialUsages={materialUsages} expanded={expandedBooking === b.id} onToggle={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)} archived />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function BookingCard({ booking: b, materialUsages, expanded, onToggle, onCancel, archived }) {
  const st = statusMap[b.status] || statusMap.confirmed;
  const StIcon = st.icon;
  const materials = materialUsages.filter(u => u.booking_id === b.id);

  return (
    <div className={`bg-card border border-border overflow-hidden ${archived ? "opacity-60" : ""}`}>
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-10 w-10 bg-accent flex items-center justify-center shrink-0">
          <StIcon className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{b.workspace_name}</h3>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{b.date} · {b.start_time} – {b.end_time}</p>
          {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">{b.notes}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold">{(b.total_cost || 0).toFixed(2)} €</p>
          <p className="text-xs text-muted-foreground">Platz: {(b.total_workspace_cost || 0).toFixed(2)} € · Material: {(b.total_material_cost || 0).toFixed(2)} €</p>
        </div>
        <div className="flex sm:flex-col gap-2 shrink-0">
          {b.status === "confirmed" && !archived && onCancel && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onCancel}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Stornieren
            </Button>
          )}
          {materials.length > 0 && (
            <Button size="sm" variant="ghost" onClick={onToggle}>
              <Package className="h-3.5 w-3.5 mr-1" /> Material {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
          )}
        </div>
      </div>
      {expanded && materials.length > 0 && (
        <div className="border-t border-border bg-muted/30 divide-y divide-border">
          {materials.map(u => (
            <div key={u.id} className="px-5 py-2 flex items-center gap-3 text-sm">
              <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1">{u.material_name}</span>
              <span className="text-muted-foreground">{u.quantity} {u.unit}</span>
              <span className="font-medium">{u.total_price?.toFixed(2)} €</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}