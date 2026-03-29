import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useCurrentUser } from "../hooks/useCurrentUser";

const categoryLabels = {
  Verbrauchsmaterial: "Verbrauchsmaterial",
  Werkzeug: "Werkzeug",
  Schutzausrüstung: "Schutzausrüstung",
  Reinigung: "Reinigung",
  Sonstiges: "Sonstiges",
};

const statusLabels = { available: "Verfügbar", low_stock: "Wenig Bestand", out_of_stock: "Nicht verfügbar" };
const statusColors = { available: "default", low_stock: "secondary", out_of_stock: "destructive" };

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { isAdmin } = useCurrentUser();

  const loadData = () => {
    base44.entities.Material.list().then(data => {
      setMaterials(data);
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  const filtered = materials.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data) => {
    if (editItem?.id) {
      await base44.entities.Material.update(editItem.id, data);
      toast({ title: "Material gespeichert" });
    } else {
      await base44.entities.Material.create(data);
      toast({ title: "Material erstellt" });
    }
    setEditDialog(false);
    setEditItem(null);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Material.delete(id);
    toast({ title: "Material gelöscht" });
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
          <h1 className="text-2xl font-bold tracking-tight">Materialien</h1>
          <p className="text-muted-foreground mt-1">{materials.length} Materialien im Bestand</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditItem({}); setEditDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Neues Material
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Material</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Kategorie</th>
                <th className="text-right font-medium px-4 py-3">Preis</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-right font-medium px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                        <Package className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {categoryLabels[m.category] || m.category || "–"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {m.price_per_unit?.toFixed(2)} €/{m.unit}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={statusColors[m.status] || "secondary"}>
                      {statusLabels[m.status] || m.status || "–"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(m); setEditDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Keine Materialien gefunden</div>
        )}
      </div>

      <MaterialFormDialog open={editDialog} onOpenChange={setEditDialog} item={editItem} onSave={handleSave} />
    </div>
  );
}

function MaterialFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (item) setForm({ name: "", description: "", unit: "Stück", price_per_unit: "", category: "Verbrauchsmaterial", status: "available", ...item });
  }, [item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item?.id ? "Material bearbeiten" : "Neues Material"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Name *</Label>
            <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Einheit *</Label>
              <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Stück", "kg", "Liter", "Meter", "Paket", "Stunde"].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preis pro Einheit (€) *</Label>
              <Input type="number" step="0.01" value={form.price_per_unit || ""} onChange={e => setForm({ ...form, price_per_unit: parseFloat(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kategorie</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(categoryLabels).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Verfügbar</SelectItem>
                  <SelectItem value="low_stock">Wenig Bestand</SelectItem>
                  <SelectItem value="out_of_stock">Nicht verfügbar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name || !form.price_per_unit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}