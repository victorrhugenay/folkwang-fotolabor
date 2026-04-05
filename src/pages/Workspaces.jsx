import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin, Users, Euro, Search, Pencil, Trash2 } from "lucide-react";
import { ImagePreviewModal, PreviewTrigger } from "../components/ImagePreviewModal";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import BookingDialog from "../components/BookingDialog";
import { useCurrentUser } from "../hooks/useCurrentUser";
import WorkspaceCalendar from "../components/WorkspaceCalendar";
import ImageUpload from "../components/ImageUpload";
import { CalendarDays, LayoutGrid } from "lucide-react";

const statusLabels = { available: "Verfügbar", maintenance: "Wartung", inactive: "Inaktiv" };
const statusColors = { available: "default", maintenance: "secondary", inactive: "destructive" };

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [bookingWorkspace, setBookingWorkspace] = useState(null);
  const [view, setView] = useState("grid");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [previewImage, setPreviewImage] = useState(null);
  const { isAdmin } = useCurrentUser();

  const CATEGORIES = ["Dunkelkammer", "Digitalbearbeitung", "Studio", "Schnitt", "Sonstiges"];

  const loadData = () => {
    base44.entities.Workspace.list().then(data => {
      setWorkspaces(data);
      setLoading(false);
    });
  };

  useEffect(loadData, []);

  const filtered = workspaces.filter(w =>
    (categoryFilter === "all" || w.category === categoryFilter) &&
    (w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.location?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async (data) => {
    if (editItem?.id) {
      await base44.entities.Workspace.update(editItem.id, data);
      toast({ title: "Gespeichert" });
    } else {
      await base44.entities.Workspace.create(data);
      toast({ title: "Arbeitsplatz erstellt" });
    }
    setEditDialog(false);
    setEditItem(null);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Workspace.delete(id);
    toast({ title: "Gelöscht" });
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
          <h1 className="text-2xl font-bold tracking-tight">Arbeitsplätze</h1>
          <p className="text-muted-foreground mt-1">{workspaces.length} Arbeitsplätze verfügbar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === "grid" ? "default" : "outline"} size="sm" onClick={() => setView("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={view === "calendar" ? "default" : "outline"} size="sm" onClick={() => setView("calendar")}>
            <CalendarDays className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button onClick={() => { setEditItem({}); setEditDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Neuer Arbeitsplatz
            </Button>
          )}
        </div>
      </div>

      {view === "grid" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                categoryFilter === "all" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
              }`}
            >
              Alle
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                  categoryFilter === cat ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "calendar" && <WorkspaceCalendar workspaces={workspaces} />}

      {view !== "calendar" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(w => (
            <div key={w.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow duration-300">
              {w.image_url ? (
                <PreviewTrigger src={w.image_url} alt={w.name} onClick={() => setPreviewImage({ src: w.image_url, alt: w.name })}>
                  <img src={w.image_url} alt={w.name} className="h-36 w-full object-cover" onClick={() => setPreviewImage({ src: w.image_url, alt: w.name })} />
                </PreviewTrigger>
              ) : (
                <div className="h-36 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center">
                  <div className="h-16 w-16 bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{w.name?.[0]}</span>
                  </div>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{w.name}</h3>
                    {w.category && <p className="text-xs text-primary font-medium mt-0.5">{w.category}</p>}
                    {w.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {w.location}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusColors[w.status]}>{statusLabels[w.status]}</Badge>
                </div>
                {w.description && <p className="text-sm text-muted-foreground line-clamp-2">{w.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {w.capacity && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {w.capacity} Plätze</span>}
                  <span className="flex items-center gap-1"><Euro className="h-3 w-3" /> {w.price_per_day ? `${w.price_per_day.toFixed(2)} €/Tag` : "Kostenlos"}</span>
                </div>
                {w.equipment?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {w.equipment.map((e, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" size="sm" onClick={() => setBookingWorkspace(w)} disabled={w.status !== "available"}>
                    Buchen
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditItem(w); setEditDialog(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(w.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>Keine Arbeitsplätze gefunden</p>
            </div>
          )}
        </div>
      )}

      <WorkspaceFormDialog open={editDialog} onOpenChange={setEditDialog} item={editItem} onSave={handleSave} />
      <ImagePreviewModal src={previewImage?.src} alt={previewImage?.alt} onClose={() => setPreviewImage(null)} />

      {bookingWorkspace && (
        <BookingDialog
          open={!!bookingWorkspace}
          onOpenChange={() => setBookingWorkspace(null)}
          workspace={bookingWorkspace}
          onBooked={loadData}
        />
      )}
    </div>
  );
}

function WorkspaceFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (item) setForm({ name: "", description: "", location: "", capacity: "", price_per_day: 0, status: "available", equipment: [], ...item });
  }, [item]);

  const [equipInput, setEquipInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const addEquip = () => {
    if (equipInput.trim()) {
      setForm(prev => ({ ...prev, equipment: [...(prev.equipment || []), equipInput.trim()] }));
      setEquipInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item?.id ? "Arbeitsplatz bearbeiten" : "Neuer Arbeitsplatz"}</DialogTitle>
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
            <Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Standort</Label>
              <Input value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Kategorie</Label>
              <Select value={form.category || ""} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Kategorie wählen" /></SelectTrigger>
                <SelectContent>
                  {["Dunkelkammer", "Digitalbearbeitung", "Studio", "Schnitt", "Sonstiges"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kapazität</Label>
              <Input type="number" value={form.capacity || ""} onChange={e => setForm({ ...form, capacity: parseFloat(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preis/Tag (€) *</Label>
              <Input type="number" step="0.01" value={form.price_per_day || ""} onChange={e => setForm({ ...form, price_per_day: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Verfügbar</SelectItem>
                  <SelectItem value="maintenance">Wartung</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Ausstattung</Label>
            <div className="flex gap-2">
              <Input value={equipInput} onChange={e => setEquipInput(e.target.value)} placeholder="z.B. Monitor, Drucker" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addEquip())} />
              <Button variant="outline" onClick={addEquip} type="button">+</Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(form.equipment || []).map((e, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                  {e}
                  <button onClick={() => setForm(prev => ({ ...prev, equipment: prev.equipment.filter((_, j) => j !== i) }))} className="hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}