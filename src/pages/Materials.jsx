import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, Bell, BellOff, Minus, ShoppingCart } from "lucide-react";
import { ImagePreviewModal, PreviewTrigger } from "../components/ImagePreviewModal";
import AddMaterialToBookingDialog from "../components/AddMaterialToBookingDialog";
import AdminMaterialDialog from "../components/AdminMaterialDialog";
import ImageUpload from "../components/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useCurrentUser } from "../hooks/useCurrentUser";

const statusLabels = { available: "Verfügbar", low_stock: "Wenig Bestand", out_of_stock: "Nicht verfügbar" };
const statusColors = { available: "default", low_stock: "secondary", out_of_stock: "destructive" };

function computeStatus(m) {
  if (m.current_stock === undefined || m.current_stock === null || m.current_stock === "") return m.status || "available";
  if (m.current_stock <= 0) return "out_of_stock";
  return "available";
}

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [bookMaterial, setBookMaterial] = useState(null);
  const [adminMaterialOpen, setAdminMaterialOpen] = useState(false);
  const prevStatusRef = useRef({});
  const { isAdmin, user } = useCurrentUser();

  const loadData = () => {
    base44.entities.Material.list("-created_date", 100).then(data => {
      const enriched = data.map(m => ({ ...m, status: computeStatus(m) }));
      setMaterials(enriched);
      setLoading(false);
    });
  };

  // Real-time subscription
  useEffect(() => {
    loadData();
    const unsubscribe = base44.entities.Material.subscribe((event) => {
      setMaterials(prev => {
        let updated;
        if (event.type === "create") {
          updated = [...prev, { ...event.data, status: computeStatus(event.data) }];
        } else if (event.type === "update") {
          updated = prev.map(m => m.id === event.id ? { ...event.data, status: computeStatus(event.data) } : m);
        } else if (event.type === "delete") {
          updated = prev.filter(m => m.id !== event.id);
        } else {
          return prev;
        }
        return updated;
      });
    });
    return unsubscribe;
  }, []);

  // Watch for low stock changes and notify
  useEffect(() => {
    if (!notificationsEnabled || !isAdmin) return;
    materials.forEach(m => {
      const prevStatus = prevStatusRef.current[m.id];
      if (prevStatus && prevStatus !== m.status && (m.status === "low_stock" || m.status === "out_of_stock")) {
        const msg = m.status === "out_of_stock"
          ? `„${m.name}" ist nicht mehr vorrätig!`
          : `„${m.name}" hat niedrigen Bestand (${m.current_stock} ${m.unit} übrig).`;
        toast({ title: "⚠️ Bestandswarnung", description: msg, variant: "destructive" });
        if (user?.email) {
          base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `Bestandswarnung: ${m.name}`,
            body: `Hallo,\n\n${msg}\n\nBitte Bestand im Fotolabor-System auffüllen.\n\nFolkwang Fotolabor`,
          }).catch(() => {});
        }
      }
      prevStatusRef.current[m.id] = m.status;
    });
  }, [materials, notificationsEnabled, isAdmin, user]);

  const filtered = materials.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = materials.filter(m => m.status === "low_stock" || m.status === "out_of_stock").length;

  const handleSave = async (data) => {
    const withStatus = { ...data, status: computeStatus(data) };
    if (editItem?.id) {
      await base44.entities.Material.update(editItem.id, withStatus);
      toast({ title: "Material gespeichert" });
    } else {
      await base44.entities.Material.create(withStatus);
      toast({ title: "Material erstellt" });
    }
    setEditDialog(false);
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.Material.delete(id);
    toast({ title: "Material gelöscht" });
  };

  const handleStockChange = async (m, delta) => {
    const newStock = Math.max(0, (m.current_stock || 0) + delta);
    const newStatus = computeStatus({ ...m, current_stock: newStock });
    await base44.entities.Material.update(m.id, { current_stock: newStock, status: newStatus });
  };

  const handlePriceEdit = async (m, newPrice) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      await base44.entities.Material.update(m.id, { price_per_unit: price });
      toast({ title: "Preis aktualisiert" });
    }
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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotificationsEnabled(v => !v)}
              title={notificationsEnabled ? "Benachrichtigungen deaktivieren" : "Benachrichtigungen aktivieren"}
            >
              {notificationsEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              <span className="ml-1 hidden sm:inline">{notificationsEnabled ? "Benachr. aktiv" : "Benachr. aus"}</span>
            </Button>
          )}
          {isAdmin && (
            <>
              <Button onClick={() => setAdminMaterialOpen(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Für Nutzer buchen
              </Button>
              <Button onClick={() => { setEditItem({}); setEditDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Neues Material
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Low stock alert banner */}
      {isAdmin && lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {lowStockCount} Material{lowStockCount !== 1 ? "ien" : ""} {lowStockCount !== 1 ? "haben" : "hat"} niedrigen oder keinen Bestand.
          </p>
        </div>
      )}

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
                {isAdmin && <th className="text-center font-medium px-4 py-3 hidden sm:table-cell">Bestand</th>}
                <th className="text-right font-medium px-4 py-3">Preis</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-right font-medium px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(m => (
                <MaterialRow
                  key={m.id}
                  m={m}
                  isAdmin={isAdmin}
                  onEdit={() => { setEditItem(m); setEditDialog(true); }}
                  onDelete={() => handleDelete(m.id)}
                  onStockChange={(delta) => handleStockChange(m, delta)}
                  onPriceEdit={(p) => handlePriceEdit(m, p)}
                  onPreview={() => setPreviewImage({ src: m.image_url, alt: m.name })}
                  onBook={() => setBookMaterial(m)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Keine Materialien gefunden</div>
        )}
      </div>
      <ImagePreviewModal src={previewImage?.src} alt={previewImage?.alt} onClose={() => setPreviewImage(null)} />
      {bookMaterial && (
        <AddMaterialToBookingDialog
          open={!!bookMaterial}
          onOpenChange={(v) => { if (!v) setBookMaterial(null); }}
          material={bookMaterial}
          currentUser={user}
        />
      )}
      {isAdmin && (
        <AdminMaterialDialog
          open={adminMaterialOpen}
          onOpenChange={setAdminMaterialOpen}
          onAdded={loadData}
        />
      )}
      <MaterialFormDialog open={editDialog} onOpenChange={setEditDialog} item={editItem} onSave={handleSave} />
    </div>
  );
}

function MaterialRow({ m, isAdmin, onEdit, onDelete, onStockChange, onPriceEdit, onPreview, onBook }) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceVal, setPriceVal] = useState("");

  const startPriceEdit = () => {
    setPriceVal(m.price_per_unit?.toString() || "");
    setEditingPrice(true);
  };

  const commitPrice = () => {
    onPriceEdit(priceVal);
    setEditingPrice(false);
  };

  return (
    <tr className={`hover:bg-muted/30 transition-colors ${m.status === "low_stock" ? "bg-yellow-50/40" : m.status === "out_of_stock" ? "bg-red-50/40" : ""}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {m.image_url ? (
            <img
              src={m.image_url}
              alt={m.name}
              className="h-8 w-8 object-cover shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity"
              onClick={onPreview}
            />
          ) : (
            <div className="h-8 w-8 bg-accent flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-accent-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{m.name}</p>
            {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
            {m.category && <p className="text-xs text-muted-foreground">{m.category}</p>}
          </div>
        </div>
      </td>

      {/* Stock column - only for admins */}
      {isAdmin && (
        <td className="px-4 py-3 hidden sm:table-cell">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => onStockChange(-1)} className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Minus className="h-3 w-3" />
            </button>
            <span className={`w-10 text-center font-semibold ${m.status === "out_of_stock" ? "text-destructive" : m.status === "low_stock" ? "text-yellow-600" : ""}`}>
              {m.current_stock ?? "–"}
            </span>
            <button onClick={() => onStockChange(1)} className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Plus className="h-3 w-3" />
            </button>
            <span className="text-xs text-muted-foreground">{m.unit}</span>
          </div>

        </td>
      )}

      {/* Price column */}
      <td className="px-4 py-3 text-right font-medium">
        {isAdmin && editingPrice ? (
          <div className="flex items-center justify-end gap-1">
            <Input
              type="number"
              step="0.01"
              value={priceVal}
              onChange={e => setPriceVal(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={e => e.key === "Enter" && commitPrice()}
              className="w-20 h-7 text-xs text-right"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">€/{m.unit}</span>
          </div>
        ) : (
          <span
            onClick={isAdmin ? startPriceEdit : undefined}
            className={isAdmin ? "cursor-pointer hover:text-primary transition-colors" : ""}
            title={isAdmin ? "Klicken zum Bearbeiten" : ""}
          >
            {m.price_per_unit?.toFixed(2)} €/{m.unit}
          </span>
        )}
      </td>

      <td className="px-4 py-3 hidden md:table-cell">
        <Badge variant={statusColors[m.status] || "secondary"}>
          {statusLabels[m.status] || "–"}
        </Badge>
      </td>

      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          {!isAdmin && m.status === "available" && (
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBook}>
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function MaterialFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (item) setForm({
      name: "", description: "", unit: "Stück", price_per_unit: "",
      category: "Verbrauchsmaterial", status: "available",
      current_stock: "", min_stock: "",
      ...item
    });
  }, [item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item?.id ? "Material bearbeiten" : "Neues Material"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Bild</Label>
            <ImageUpload value={form.image_url || ""} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
          </div>
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
                  {["Stück", "kg", "Liter", "Meter", "m²", "Paket", "Stunde"].map(u => (
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
          <div>
            <Label>Aktueller Bestand</Label>
            <Input type="number" value={form.current_stock ?? ""} onChange={e => setForm({ ...form, current_stock: e.target.value === "" ? null : parseFloat(e.target.value) })} />
          </div>
          <div>
            <Label>Kategorie</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Verbrauchsmaterial", "Werkzeug", "Schutzausrüstung", "Reinigung", "Sonstiges"].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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