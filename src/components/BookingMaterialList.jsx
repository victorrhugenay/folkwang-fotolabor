import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package } from "lucide-react";

export default function BookingMaterialList({ bookingId }) {
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.MaterialUsage.filter({ booking_id: bookingId }).then(data => {
      setUsages(data);
      setLoading(false);
    });
  }, [bookingId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Lade Materialien...</p>;
  }

  if (usages.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" />
        <span>Keine Materialien verwendet</span>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Verwendete Materialien</h4>
      <div className="space-y-2">
        {usages.map(u => (
          <div key={u.id} className="flex items-center justify-between text-sm bg-card rounded-lg p-3 border border-border">
            <div>
              <span className="font-medium">{u.material_name}</span>
              <span className="text-muted-foreground ml-2">{u.quantity} {u.unit}</span>
            </div>
            <span className="font-medium">{u.total_price?.toFixed(2)} €</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
          <span>Summe Materialien</span>
          <span>{usages.reduce((s, u) => s + (u.total_price || 0), 0).toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
}