import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function AdminMaterialDialog({ open, onOpenChange, onAdded }) {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    base44.entities.Material.list().then(setMaterials);
  }, [open]);

  const selectedMat = materials.find(m => m.id === selectedMaterial);
  const totalCost = selectedMat && quantity ? (parseFloat(quantity) * selectedMat.price_per_unit).toFixed(2) : "0.00";

  const handleSubmit = async () => {
    if (!selectedMaterial || !quantity) {
      toast({ title: "Fehler", description: "Bitte Material und Menge ausfüllen.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const material = materials.find(m => m.id === selectedMaterial);

    // Create material usage without booking
    await base44.entities.MaterialUsage.create({
      material_id: selectedMaterial,
      material_name: material.name,
      quantity: parseFloat(quantity),
      unit: material.unit,
      price_per_unit: material.price_per_unit,
      total_price: parseFloat(totalCost),
    });

    toast({ title: "Material hinzugefügt", description: `${material.name} erfasst` });
    setSelectedMaterial("");
    setQuantity("1");
    setLoading(false);
    onOpenChange(false);
    onAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Material erfassen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">

          <div>
            <Label>Material *</Label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Material auswählen" />
              </SelectTrigger>
              <SelectContent>
                {materials.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.price_per_unit}€/{m.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Menge *</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="1"
            />
          </div>

          {selectedMat && (
            <div className="bg-accent/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>{quantity} × {selectedMat.unit}</span>
                <span className="font-semibold">{totalCost}€</span>
              </div>
            </div>
          )}
          </div>
          <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedMaterial}>
            {loading ? "Wird erfasst..." : "Erfassen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}