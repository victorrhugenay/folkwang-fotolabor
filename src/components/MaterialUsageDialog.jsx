import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

export default function MaterialUsageDialog({ open, onOpenChange, booking, onAdded }) {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      base44.entities.Material.list().then(setMaterials);
    }
  }, [open]);

  const selected = materials.find(m => m.id === selectedMaterial);

  const handleSubmit = async () => {
    if (!selectedMaterial || !quantity || parseFloat(quantity) <= 0) {
      toast({ title: "Fehler", description: "Bitte Material und Menge angeben.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const totalPrice = Math.round(parseFloat(quantity) * (selected?.price_per_unit || 0) * 100) / 100;

    await base44.entities.MaterialUsage.create({
      booking_id: booking.id,
      material_id: selected.id,
      material_name: selected.name,
      quantity: parseFloat(quantity),
      unit: selected.unit,
      price_per_unit: selected.price_per_unit,
      total_price: totalPrice,
    });

    // Update booking costs
    const newMaterialCost = (booking.total_material_cost || 0) + totalPrice;
    const newTotalCost = (booking.total_workspace_cost || 0) + newMaterialCost;
    await base44.entities.Booking.update(booking.id, {
      total_material_cost: Math.round(newMaterialCost * 100) / 100,
      total_cost: Math.round(newTotalCost * 100) / 100,
    });

    toast({ title: "Material hinzugefügt", description: `${selected.name}: ${quantity} ${selected.unit} = ${totalPrice.toFixed(2)} €` });
    setSelectedMaterial("");
    setQuantity("");
    setLoading(false);
    onOpenChange(false);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Material hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-accent/50 rounded-lg p-3">
            <p className="font-medium text-sm">Buchung: {booking?.workspace_name}</p>
            <p className="text-xs text-muted-foreground">{booking?.date} · {booking?.start_time} - {booking?.end_time}</p>
          </div>
          <div>
            <Label>Material</Label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger><SelectValue placeholder="Material wählen" /></SelectTrigger>
              <SelectContent>
                {materials.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — {m.price_per_unit?.toFixed(2)} €/{m.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Menge {selected ? `(${selected.unit})` : ""}</Label>
            <Input type="number" min="0" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          {selected && quantity && parseFloat(quantity) > 0 && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Kosten:</span>
              <span className="font-semibold ml-2">
                {(parseFloat(quantity) * selected.price_per_unit).toFixed(2)} €
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Wird gespeichert..." : "Hinzufügen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}