import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CalendarRange, LayoutGrid, BookOpen, Plus, ChevronLeft, ChevronRight,
  MapPin, Users, Euro, Search, Pencil, Trash2, Clock, XCircle, CheckCircle,
  Package, Archive, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import BookingDialog from "../components/BookingDialog";
import MaterialUsageDialog from "../components/MaterialUsageDialog";
import BookingMaterialList from "../components/BookingMaterialList";
import { ImagePreviewModal, PreviewTrigger } from "../components/ImagePreviewModal";
import ImageUpload from "../components/ImageUpload";
import { useCurrentUser } from "../hooks/useCurrentUser";
import AdminBookingDialog from "../components/AdminBookingDialog";

// ── Calendar constants ────────────────────────────────────────────────
const CAL_COLORS = [
  "bg-blue-200 text-blue-800", "bg-green-200 text-green-800",
  "bg-purple-200 text-purple-800", "bg-orange-200 text-orange-800",
  "bg-pink-200 text-pink-800", "bg-teal-200 text-teal-800",
  "bg-yellow-200 text-yellow-800", "bg-red-200 text-red-800",
];
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const CATEGORIES = ["Dunkelkammer", "Digitaldruck", "Bildbearbeitung", "Digitalsierung"];

const statusMap = {
  confirmed: { label: "Bestätigt", variant: "default", icon: Clock },
  cancelled: { label: "Storniert", variant: "destructive", icon: XCircle },
  completed: { label: "Abgeschlossen", variant: "secondary", icon: CheckCircle },
};
const statusLabels = { available: "Verfügbar", maintenance: "Wartung", inactive: "Inaktiv" };
const statusColors = { available: "default", maintenance: "secondary", inactive: "destructive" };

// ── Quick Booking Dialog (pick workspace → book) ──────────────────────
function QuickBookingDialog({ open, onOpenChange, workspaces, onBooked }) {
  const [selectedWs, setSelectedWs] = useState("");
  const ws = workspaces.find(w => w.id === selectedWs);

  const handleClose = () => { setSelectedWs(""); onOpenChange(false); };

  return (
    <>
      <Dialog open={open && !ws} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Arbeitsplatz auswählen</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <Label>Arbeitsplatz</Label>
            <Select value={selectedWs} onValueChange={setSelectedWs}>
              <SelectTrigger><SelectValue placeholder="Arbeitsplatz wählen" /></SelectTrigger>
              <SelectContent>
                {workspaces.filter(w => w.status === "available").map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ws && (
        <BookingDialog
          open={true}
          onOpenChange={(v) => { if (!v) { setSelectedWs(""); onOpenChange(false); } }}
          workspace={ws}
          onBooked={() => { setSelectedWs(""); onOpenChange(false); onBooked?.(); }}
        />
      )}
    </>
  );
}

// ── Calendar View ────────────────────────────────────────────────────
function CalendarView({ bookings, workspaces }) {
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const wsColorMap = {};
  workspaces.forEach((w, i) => { wsColorMap[w.id] = CAL_COLORS[i % CAL_COLORS.length]; });

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const bookingsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter(b => b.date === dateStr && b.status !== "cancelled");
  };

  const today = new Date();
  const isToday = (day) => day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  const selectedBookings = selectedDay ? bookingsForDay(selectedDay) : [];
  const selectedDateStr = selectedDay
    ? `${String(selectedDay).padStart(2, "0")}.${String(month + 1).padStart(2, "0")}.${year}`
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setCurrent(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold w-36 text-center">{MONTHS[month]} {year}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrent(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setCurrent(new Date()); setSelectedDay(null); }}>Heute</Button>
        </div>
      </div>

      {workspaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workspaces.map((w, i) => (
            <span key={w.id} className={`text-xs px-2 py-1 rounded-full font-medium ${CAL_COLORS[i % CAL_COLORS.length]}`}>{w.name}</span>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-3">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const dayBookings = bookingsForDay(day);
            const isSelected = day === selectedDay;
            return (
              <div
                key={idx}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-border transition-colors
                  ${day ? "cursor-pointer hover:bg-muted/40" : "bg-muted/10 opacity-0 pointer-events-none"}
                  ${isSelected ? "bg-accent/40" : ""}
                `}
              >
                {day && (
                  <>
                    <div className={`text-xs font-medium mb-1 h-5 w-5 flex items-center justify-center rounded-full
                      ${isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map(b => (
                        <div key={b.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${wsColorMap[b.workspace_id] || "bg-muted text-muted-foreground"}`}
                          title={`${b.workspace_name} · ${b.start_time}–${b.end_time}`}>
                          <span className="hidden sm:inline">{b.workspace_name} </span>{b.start_time}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayBookings.length - 3} weitere</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">{selectedDateStr} – {selectedBookings.length} Buchung{selectedBookings.length !== 1 ? "en" : ""}</h2>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Buchungen an diesem Tag.</p>
          ) : (
            <div className="space-y-2">
              {selectedBookings.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(b => (
                <div key={b.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${(wsColorMap[b.workspace_id] || "bg-muted").split(" ")[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{b.workspace_name}</p>
                    <p className="text-xs text-muted-foreground">{b.start_time} – {b.end_time} Uhr{b.created_by ? ` · ${b.created_by}` : ""}</p>
                    {b.notes && <p className="text-xs text-muted-foreground italic">{b.notes}</p>}
                  </div>
                  <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
                    {b.status === "confirmed" ? "Bestätigt" : b.status === "completed" ? "Abgeschlossen" : b.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Grid View ────────────────────────────────────────────────────────
function GridView({ workspaces, isAdmin, onReload }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [bookingWorkspace, setBookingWorkspace] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const sorted = [...workspaces].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const filtered = sorted.filter(w =>
    (categoryFilter === "all" || w.category === categoryFilter) &&
    (w.name?.toLowerCase().includes(search.toLowerCase()) || w.location?.toLowerCase().includes(search.toLowerCase()))
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
    onReload();
  };

  const handleDelete = async (id) => {
    await base44.entities.Workspace.delete(id);
    toast({ title: "Gelöscht" });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${categoryFilter === "all" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
            Alle
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors ${categoryFilter === cat ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

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
                  {w.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {w.location}</p>}
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
                  {w.equipment.map((e, i) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{e}</span>)}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" size="sm" onClick={() => setBookingWorkspace(w)} disabled={w.status !== "available"}>Buchen</Button>
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
          <div className="col-span-full text-center py-12 text-muted-foreground">Keine Arbeitsplätze gefunden</div>
        )}
      </div>

      <WorkspaceFormDialog open={editDialog} onOpenChange={setEditDialog} item={editItem} onSave={handleSave} />
      <ImagePreviewModal src={previewImage?.src} alt={previewImage?.alt} onClose={() => setPreviewImage(null)} />
      {bookingWorkspace && (
        <BookingDialog open={!!bookingWorkspace} onOpenChange={() => setBookingWorkspace(null)} workspace={bookingWorkspace} onBooked={onReload} />
      )}
    </div>
  );
}

// ── Bookings View ────────────────────────────────────────────────────
function BookingsView({ bookings, users, isAdmin, onReload }) {
  const [filter, setFilter] = useState("all");
  const [materialBooking, setMaterialBooking] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [adminBookingOpen, setAdminBookingOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const isArchived = (b) => b.status === "cancelled" || (b.status !== "confirmed" && b.date < today);
  const activeBookings = bookings.filter(b => !isArchived(b));
  const archivedBookings = bookings.filter(isArchived);
  const filtered = filter === "all" ? activeBookings : activeBookings.filter(b => b.status === filter);

  const deleteBooking = async (id) => {
    await base44.entities.Booking.delete(id);
    toast({ title: "Buchung gelöscht" });
    onReload();
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Booking.update(id, { status });
    toast({ title: `Status auf "${statusMap[status]?.label}" geändert` });
    const booking = bookings.find(b => b.id === id);
    if (booking?.created_by) {
      const label = statusMap[status]?.label || status;
      base44.integrations.Core.SendEmail({
        to: booking.created_by,
        subject: `Buchungsstatus geändert: ${booking.workspace_name}`,
        body: `Hallo,\n\nder Status deiner Buchung wurde geändert:\n\nArbeitsplatz: ${booking.workspace_name}\nDatum: ${booking.date}\nZeitraum: ${booking.start_time} – ${booking.end_time} Uhr\nNeuer Status: ${label}\n\nFolkwang Fotolabor`,
      }).catch(() => {});
    }
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {isAdmin && (
          <Button onClick={() => setAdminBookingOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Für Nutzer buchen
          </Button>
        )}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Alle" /></SelectTrigger>
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
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Keine aktiven Buchungen gefunden</p>
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
                  <p className="text-sm text-muted-foreground mt-0.5">{b.date} · {b.start_time} – {b.end_time}</p>
                  {(() => {
                    const u = users.find(u => u.email === b.created_by);
                    const name = u ? (u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email) : b.created_by;
                    return name ? <p className="text-xs text-muted-foreground mt-0.5">👤 {name}</p> : null;
                  })()}
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
                  {(isAdmin || b.status === "cancelled") && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBooking(b.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Löschen
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}>Details</Button>
                </div>
              </div>
              {expandedBooking === b.id && (
                <div className="border-t border-border px-5 py-4 bg-muted/30">
                  <BookingMaterialList bookingId={b.id} booking={b} isAdmin={isAdmin} onChanged={onReload} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {archivedBookings.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setArchiveOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
            <Archive className="h-4 w-4" />
            <span className="font-medium">Archiv ({archivedBookings.length} Buchungen)</span>
            {archiveOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </button>
          {archiveOpen && (
            <div className="space-y-2 mt-2">
              {archivedBookings.map(b => {
                const st = statusMap[b.status] || statusMap.confirmed;
                const StIcon = st.icon;
                return (
                  <div key={b.id} className="bg-muted/40 rounded-xl border border-border overflow-hidden opacity-70">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <StIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">{b.workspace_name}</h3>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.date} · {b.start_time} – {b.end_time}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{(b.total_cost || 0).toFixed(2)} €</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => deleteBooking(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <AdminBookingDialog open={adminBookingOpen} onOpenChange={setAdminBookingOpen} onBooked={onReload} />
      )}
      {materialBooking && (
        <MaterialUsageDialog open={!!materialBooking} onOpenChange={() => setMaterialBooking(null)} booking={materialBooking} onAdded={onReload} />
      )}
    </div>
  );
}

// ── Workspace Form Dialog ────────────────────────────────────────────
function WorkspaceFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState({});
  const [equipInput, setEquipInput] = useState("");

  useEffect(() => {
    if (item) setForm({ name: "", description: "", location: "", capacity: "", price_per_day: 0, status: "available", equipment: [], ...item });
  }, [item]);

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
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

// ── Main Page ────────────────────────────────────────────────────────
export default function Arbeitsplatzbuchung() {
  const [view, setView] = useState("calendar");
  const [workspaces, setWorkspaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { isAdmin, user: currentUser } = useCurrentUser();

  const loadData = async () => {
    const [ws, allBookings, u] = await Promise.all([
      base44.entities.Workspace.list(),
      base44.entities.Booking.list("-created_date", 500),
      isAdmin ? base44.entities.User.list().catch(() => []) : Promise.resolve([]),
    ]);
    setWorkspaces(ws);
    const myBookings = isAdmin ? allBookings : allBookings.filter(b => b.created_by === currentUser?.email);
    setBookings(myBookings);
    setUsers(u);
    setLoading(false);
  };

  useEffect(() => { if (currentUser !== undefined) loadData(); }, [currentUser, isAdmin]);

  const handleSaveWorkspace = async (data) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const viewButtons = [
    { key: "calendar", label: "Kalender", icon: CalendarRange },
    { key: "grid", label: "Rasteransicht", icon: LayoutGrid },
    { key: "bookings", label: "Buchungen", icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Arbeitsplatzbuchung</h1>
          <p className="text-muted-foreground mt-1">{workspaces.length} Arbeitsplätze · {bookings.filter(b => b.status === "confirmed").length} aktive Buchungen</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {viewButtons.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={view === key ? "default" : "outline"}
              size="sm"
              onClick={() => setView(key)}
              className="gap-1.5"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => setQuickBookOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Neue Buchung</span>
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => { setEditItem({}); setEditDialog(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Neuer Arbeitsplatz</span>
            </Button>
          )}
        </div>
      </div>

      {view === "calendar" && <CalendarView bookings={bookings} workspaces={workspaces} />}
      {view === "grid" && <GridView workspaces={workspaces} isAdmin={isAdmin} onReload={loadData} />}
      {view === "bookings" && <BookingsView bookings={bookings} users={users} isAdmin={isAdmin} onReload={loadData} />}

      <QuickBookingDialog
        open={quickBookOpen}
        onOpenChange={setQuickBookOpen}
        workspaces={workspaces}
        onBooked={loadData}
      />
      <WorkspaceFormDialog
        open={editDialog}
        onOpenChange={setEditDialog}
        item={editItem}
        onSave={handleSaveWorkspace}
      />
    </div>
  );
}