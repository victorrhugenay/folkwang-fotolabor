import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

export default function AddMaterialToBookingDialog({ open, onOpenChange, material, currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && currentUser?.email) {
      base44.entities.Booking.filter({ status: "confirmed" }).then(all => {
        const mine = all.filter(b => b.created_by === currentUser.email);
        setBookings(mine);
        setSelectedBookingId(mine[0]?.id || "");
      });
    }
  }, [open, currentUser]);

  const handleSave = async () => {
    if (!selectedBookingId || quantity <= 0) return;
    setSaving(true);
    const booking = bookings.find(b => b.id === selectedBookingId);
    const totalPrice = (material.price_per_unit || 0) * quantity;

    await base44.entities.MaterialUsage.create({
      booking_id: selectedBookingId,
      material_id: material.id,
      material_name: material.name,
      quantity,
      unit: material.unit,
      price_per_unit: material.price_per_unit || 0,
      total_price: totalPrice,
    });

    const newMaterialCost = (booking.total_material_cost || 0) + totalPrice;
    const newTotal = (booking.total_workspace_cost || 0) + newMaterialCost;
    await base44.entities.Booking.update(selectedBookingId, {
      total_material_cost: newMaterialCost,
      total_cost: newTotal,
    });

    // Update material stock
    if (material.current_stock !== null && material.current_stock !== undefined) {
      const newStock = Math.max(0, material.current_stock - quantity);
      await base44.entities.Material.update(material.id, { current_stock: newStock });
    }

    toast({ title: "Material gebucht", description: `${quantity} ${material.unit} ${material.name} zur Buchung hinzugefügt.` });
    setSaving(false);
    onOpenChange(false);
    setQuantity(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Material buchen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted text-sm">
            <p className="font-medium">{material?.name}</p>
            <p className="text-muted-foreground">{material?.price_per_unit?.toFixed(2)} € / {material?.unit}</p>
          </div>

          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine aktiven Buchungen vorhanden. Bitte zuerst einen Arbeitsplatz buchen.</p>
          ) : (
            <>
              <div>
                <Label>Buchung auswählen</Label>
                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                  <SelectTrigger><SelectValue placeholder="Buchung wählen" /></SelectTrigger>
                  <SelectContent>
                    {bookings.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.workspace_name} – {b.date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Menge ({material?.unit})</Label>
                <Input
                  type="number"
                  min={1}
                  max={material?.current_stock ?? 9999}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="text-sm font-medium text-right">
                Gesamt: {((material?.price_per_unit || 0) * quantity).toFixed(2)} €
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          {bookings.length > 0 && (
            <Button onClick={handleSave} disabled={saving || !selectedBookingId}>
              {saving ? "Wird gebucht…" : "Buchen"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}