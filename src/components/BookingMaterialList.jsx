import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function BookingMaterialList({ bookingId, booking, isAdmin, onChanged }) {
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editQty, setEditQty] = useState("");

  const load = () => {
    base44.entities.MaterialUsage.filter({ booking_id: bookingId }).then(data => {
      setUsages(data);
      setLoading(false);
    });
  };

  useEffect(load, [bookingId]);

  const recalcBookingCosts = async (updatedUsages) => {
    const totalMaterial = updatedUsages.reduce((s, u) => s + (u.total_price || 0), 0);
    const totalMaterialRounded = Math.round(totalMaterial * 100) / 100;
    const totalCost = Math.round(((booking?.total_workspace_cost || 0) + totalMaterialRounded) * 100) / 100;
    await base44.entities.Booking.update(bookingId, {
      total_material_cost: totalMaterialRounded,
      total_cost: totalCost,
    });
  };

  const handleDelete = async (usage) => {
    await base44.entities.MaterialUsage.delete(usage.id);
    const updated = usages.filter(u => u.id !== usage.id);
    await recalcBookingCosts(updated);
    toast({ title: "Material entfernt" });
    load();
    onChanged?.();
  };

  const handleEdit = async (usage) => {
    const qty = parseFloat(editQty);
    if (!qty || qty <= 0) return;
    const newTotal = Math.round(qty * (usage.price_per_unit || 0) * 100) / 100;
    await base44.entities.MaterialUsage.update(usage.id, { quantity: qty, total_price: newTotal });
    const updated = usages.map(u => u.id === usage.id ? { ...u, quantity: qty, total_price: newTotal } : u);
    await recalcBookingCosts(updated);
    toast({ title: "Material aktualisiert" });
    setEditId(null);
    load();
    onChanged?.();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Lade Materialien...</p>;

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
          <div key={u.id} className="flex items-center justify-between text-sm bg-card rounded-lg p-3 border border-border gap-3">
            <div className="flex-1 min-w-0">
              <span className="font-medium">{u.material_name}</span>
              {editId === u.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editQty}
                    onChange={e => setEditQty(e.target.value)}
                    className="h-7 w-24 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">{u.unit}</span>
                </div>
              ) : (
                <span className="text-muted-foreground ml-2">{u.quantity} {u.unit}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-medium">{u.total_price?.toFixed(2)} €</span>
              {isAdmin && (
                editId === u.id ? (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => handleEdit(u)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditId(u.id); setEditQty(String(u.quantity)); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(u)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )
              )}
            </div>
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