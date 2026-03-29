import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, XCircle, CheckCircle, Package, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import MaterialUsageDialog from "../components/MaterialUsageDialog";
import BookingMaterialList from "../components/BookingMaterialList";

const statusMap = {
  confirmed: { label: "Bestätigt", variant: "default", icon: Clock },
  cancelled: { label: "Storniert", variant: "destructive", icon: XCircle },
  completed: { label: "Abgeschlossen", variant: "secondary", icon: CheckCircle },
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [materialBooking, setMaterialBooking] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);

  const loadData = () => {
    base44.entities.Booking.list("-created_date", 100).then(data => {
      setBookings(data);
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const updateStatus = async (id, status) => {
    await base44.entities.Booking.update(id, { status });
    toast({ title: `Status auf "${statusMap[status]?.label}" geändert` });
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

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Keine Buchungen gefunden</p>
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
                    {b.date} · {b.start_time} – {b.end_time}
                  </p>
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
                  <Button size="sm" variant="ghost" onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}>
                    Details
                  </Button>
                </div>
              </div>
              {expandedBooking === b.id && (
                <div className="border-t border-border px-5 py-4 bg-muted/30">
                  <BookingMaterialList bookingId={b.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>

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