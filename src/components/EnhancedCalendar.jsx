import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WEEKDAYS_SHORT = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const WEEKDAYS_FULL = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i); // 9–18

const CAL_COLORS = [
  "bg-blue-200 text-blue-800 border-blue-300",
  "bg-green-200 text-green-800 border-green-300",
  "bg-purple-200 text-purple-800 border-purple-300",
  "bg-orange-200 text-orange-800 border-orange-300",
  "bg-pink-200 text-pink-800 border-pink-300",
  "bg-teal-200 text-teal-800 border-teal-300",
  "bg-yellow-200 text-yellow-800 border-yellow-300",
  "bg-red-200 text-red-800 border-red-300",
];

const SLOT_TYPES = [
  { value: "1h", label: "1 Stunde", duration: 1 },
  { value: "half", label: "Halber Tag (4 Std.)", duration: 4 },
  { value: "full", label: "Ganzer Tag (8 Std.)", duration: 8 },
];

function pad(n) { return String(n).padStart(2, "0"); }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function isWeekday(dateStr) {
  const day = new Date(dateStr).getUTCDay();
  return day >= 1 && day <= 5;
}
function addHoursStr(timeStr, hours) {
  const h = parseInt(timeStr.split(":")[0]) + hours;
  return `${pad(h)}:00`;
}
function getStartOptions(duration) {
  const slots = [];
  for (let h = 9; h + duration <= 18; h++) slots.push(`${pad(h)}:00`);
  return slots;
}

// ── Booking popup ─────────────────────────────────────────────────────
function BookingPopup({ open, onOpenChange, prefillDate, prefillHour, workspaces, bookings, onBooked }) {
  const [selectedWs, setSelectedWs] = useState("");
  const [date, setDate] = useState(prefillDate || "");
  const [slotType, setSlotType] = useState("1h");
  const [startTime, setStartTime] = useState(prefillHour != null ? `${pad(prefillHour)}:00` : "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessMap, setAccessMap] = useState({});

  useEffect(() => {
    if (!open) return;
    setDate(prefillDate || "");
    setStartTime(prefillHour != null ? `${pad(prefillHour)}:00` : "");
    setSelectedWs("");
    setNotes("");
    setSlotType("1h");
    // Check group access for all workspaces
    Promise.all([
      base44.auth.me(),
      base44.entities.GroupMembership.list(),
      base44.entities.Group.list(),
    ]).then(([me, memberships, groups]) => {
      const userGroupIds = memberships.filter(m => m.user_email === me.email).map(m => m.group_id);
      const map = {};
      workspaces.forEach(ws => {
        map[ws.id] = groups.some(g => userGroupIds.includes(g.id) && (g.workspace_ids || []).includes(ws.id));
      });
      setAccessMap(map);
    });
  }, [open, prefillDate, prefillHour]);

  const selectedSlot = SLOT_TYPES.find(s => s.value === slotType);
  const startOptions = getStartOptions(selectedSlot?.duration || 1);
  const endTime = startTime ? addHoursStr(startTime, selectedSlot?.duration || 1) : "";

  // Which workspaces are already booked on this date+time?
  const bookedWsIds = new Set(
    bookings.filter(b => {
      if (b.date !== date || b.status === "cancelled") return false;
      if (!startTime || !endTime) return false;
      return b.start_time < endTime && b.end_time > startTime;
    }).map(b => b.workspace_id)
  );

  const handleSubmit = async () => {
    if (!selectedWs || !date || !startTime) {
      toast({ title: "Fehler", description: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }
    if (!isWeekday(date)) {
      toast({ title: "Fehler", description: "Nur Werktage (Mo–Fr) buchbar.", variant: "destructive" });
      return;
    }
    const ws = workspaces.find(w => w.id === selectedWs);
    setLoading(true);
    const existing = await base44.entities.Booking.filter({ workspace_id: selectedWs, date, status: "confirmed" });
    const hasOverlap = existing.some(b => b.start_time < endTime && b.end_time > startTime);
    if (hasOverlap) {
      toast({ title: "Doppelbuchung", description: "Dieser Arbeitsplatz ist bereits gebucht.", variant: "destructive" });
      setLoading(false);
      return;
    }
    await base44.entities.Booking.create({
      workspace_id: selectedWs,
      workspace_name: ws.name,
      date, start_time: startTime, end_time: endTime,
      status: "confirmed", notes,
      total_workspace_cost: 0, total_material_cost: 0, total_cost: 0,
    });
    const me = await base44.auth.me();
    base44.integrations.Core.SendEmail({
      to: me.email,
      subject: `Buchungsbestätigung: ${ws.name}`,
      body: `Hallo,\n\ndeine Buchung wurde bestätigt:\n\nArbeitsplatz: ${ws.name}\nDatum: ${date}\nZeitraum: ${startTime} – ${endTime} Uhr\n\nFolkwang Fotolabor`,
    }).catch(() => {});
    toast({ title: "Gebucht!", description: `${ws.name} am ${date} von ${startTime} bis ${endTime}` });
    setLoading(false);
    onOpenChange(false);
    onBooked?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Buchung</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Workspace picker with availability */}
          <div>
            <Label>Arbeitsplatz</Label>
            <div className="space-y-1.5 mt-1.5 max-h-48 overflow-y-auto border border-border rounded-md p-2">
              {workspaces.map(ws => {
                const isBooked = bookedWsIds.has(ws.id);
                const hasAccess = accessMap[ws.id];
                const unavailable = isBooked || ws.status !== "available" || !hasAccess;
                return (
                  <button
                    key={ws.id}
                    disabled={unavailable}
                    onClick={() => !unavailable && setSelectedWs(ws.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded transition-colors
                      ${selectedWs === ws.id ? "bg-primary text-primary-foreground" : ""}
                      ${unavailable ? "opacity-40 cursor-not-allowed bg-muted" : "hover:bg-accent cursor-pointer"}
                    `}
                  >
                    <span className="font-medium">{ws.name}</span>
                    <span className="text-xs flex items-center gap-1">
                      {isBooked ? <><Lock className="h-3 w-3" /> Belegt</> :
                       ws.status !== "available" ? <><Lock className="h-3 w-3" /> {ws.status === "maintenance" ? "Wartung" : "Inaktiv"}</> :
                       !hasAccess ? <><Lock className="h-3 w-3" /> Kein Zugriff</> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Buchungsart</Label>
            <Select value={slotType} onValueChange={v => { setSlotType(v); setStartTime(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SLOT_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Datum <span className="text-muted-foreground text-xs">(Mo–Fr)</span></Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            {date && !isWeekday(date) && <p className="text-xs text-destructive mt-1">Nur Werktage (Mo–Fr) buchbar.</p>}
          </div>
          <div>
            <Label>Startzeit</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger><SelectValue placeholder="Startzeit wählen" /></SelectTrigger>
              <SelectContent>
                {startOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {startTime && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Zeitraum:</span>
              <span className="font-semibold ml-2">{startTime} – {endTime} Uhr</span>
            </div>
          )}
          <div>
            <Label>Notizen (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Besondere Anforderungen..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedWs}>
            {loading ? "Wird gebucht..." : "Jetzt buchen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Time grid helpers ─────────────────────────────────────────────────
function TimeGrid({ dates, bookings, workspaces, wsColorMap, onSlotClick, closures = [], isDuringClosure }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row */}
        <div className={`grid border-b border-border`} style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)` }}>
          <div className="py-2" />
          {dates.map((d, i) => {
            const today = new Date();
            const isToday = toDateStr(today) === toDateStr(d);
            const dow = (d.getDay() + 6) % 7;
            return (
              <div key={i} className={`text-center py-2 text-sm font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {WEEKDAYS_SHORT[dow]} {d.getDate()}.{pad(d.getMonth()+1)}.
              </div>
            );
          })}
        </div>
        {/* Hour rows */}
        {HOURS.map(hour => (
          <div key={hour} className="grid border-b border-border" style={{ gridTemplateColumns: `60px repeat(${dates.length}, 1fr)`, minHeight: "56px" }}>
            <div className="text-xs text-muted-foreground px-2 py-1 border-r border-border flex items-start pt-1">{pad(hour)}:00</div>
            {dates.map((d, di) => {
              const dateStr = toDateStr(d);
              const timeStr = `${pad(hour)}:00`;
              const endTimeStr = `${pad(hour + 1)}:00`;
              const closure = isDuringClosure(dateStr, timeStr, endTimeStr);
              const dayBookings = bookings.filter(b =>
                b.date === dateStr && b.status !== "cancelled" &&
                parseInt(b.start_time) <= hour && parseInt(b.end_time) > hour
              );
              return (
                <div
                  key={di}
                  className={`border-r border-border last:border-r-0 p-0.5 transition-colors relative ${
                    closure ? "bg-red-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/30"
                  }`}
                  onClick={() => !closure && onSlotClick(dateStr, hour)}
                >
                  {closure && <div className="text-[10px] px-1.5 py-0.5 rounded bg-red-200 text-red-800 border border-red-300 font-medium mb-0.5 truncate">🔒 Geschlossen</div>}
                  {dayBookings.map(b => (
                    <div
                      key={b.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium mb-0.5 truncate ${wsColorMap[b.workspace_id] || "bg-muted text-muted-foreground border-border"}`}
                      title={`${b.workspace_name} · ${b.start_time}–${b.end_time}`}
                    >
                      {b.workspace_name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Month grid ───────────────────────────────────────────────────────
function MonthGrid({ year, month, bookings, wsColorMap, onDayClick, closures = [], isDuringClosure }) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (day) => day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  const bookingsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${pad(month+1)}-${pad(day)}`;
    return bookings.filter(b => b.date === dateStr && b.status !== "cancelled");
  };
  const hasClosureOnDay = (day) => {
    if (!day) return false;
    const dateStr = `${year}-${pad(month+1)}-${pad(day)}`;
    return isDuringClosure(dateStr);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS_SHORT.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-3">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const dayBookings = bookingsForDay(day);
          return (
            <div
              key={idx}
              onClick={() => day && !hasClosureOnDay(day) && onDayClick(`${year}-${pad(month+1)}-${pad(day)}`)}
              className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-border transition-colors
                ${hasClosureOnDay(day) ? "bg-red-50 cursor-not-allowed" : day ? "cursor-pointer hover:bg-muted/40" : "bg-muted/10 opacity-0 pointer-events-none"}
              `}
            >
              {day && (
                <>
                  <div className={`text-xs font-medium mb-1 h-5 w-5 flex items-center justify-center rounded-full
                    ${isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {hasClosureOnDay(day) && <div className="text-[10px] px-1.5 py-0.5 rounded bg-red-200 text-red-800 border border-red-300 font-medium truncate">🔒 Geschlossen</div>}
                    {dayBookings.slice(0, 3).map(b => (
                      <div key={b.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${(wsColorMap[b.workspace_id] || "bg-muted text-muted-foreground border-border").replace(" border-\\S+", "")}`}
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
  );
}

// ── Main EnhancedCalendar component ──────────────────────────────────
export default function EnhancedCalendar({ bookings, workspaces, onBooked, closures = [] }) {
  const [viewMode, setViewMode] = useState("month");
  const [current, setCurrent] = useState(new Date());
  const [bookingPopup, setBookingPopup] = useState({ open: false, date: null, hour: null });

  // Helper: check if a date/time is during a closure
  const isDuringClosure = (dateStr, startTime = "09:00", endTime = "18:00") => {
    return closures.some(c => {
      if (dateStr < c.start_date || dateStr > c.end_date) return false;
      if (c.is_all_day) return true;
      if (dateStr === c.start_date && dateStr === c.end_date) {
        return (c.start_time || "09:00") < endTime && (c.end_time || "18:00") > startTime;
      }
      return true;
    });
  };

  const wsColorMap = {};
  workspaces.forEach((w, i) => { wsColorMap[w.id] = CAL_COLORS[i % CAL_COLORS.length]; });

  const year = current.getFullYear();
  const month = current.getMonth();

  // Navigation
  const nav = (dir) => {
    const d = new Date(current);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrent(d);
  };

  const navLabel = () => {
    if (viewMode === "month") return `${MONTHS[month]} ${year}`;
    if (viewMode === "week") {
      const mon = getWeekDates(current)[0];
      const fri = getWeekDates(current)[4];
      return `${mon.getDate()}.${pad(mon.getMonth()+1)} – ${fri.getDate()}.${pad(fri.getMonth()+1)}.${fri.getFullYear()}`;
    }
    const dow = (current.getDay() + 6) % 7;
    return `${WEEKDAYS_FULL[dow]}, ${current.getDate()}. ${MONTHS[current.getMonth()]} ${year}`;
  };

  function getWeekDates(d) {
    const dow = (d.getDay() + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return x; });
  }

  const openBooking = (date, hour) => setBookingPopup({ open: true, date, hour });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-semibold min-w-[160px] text-center text-sm">{navLabel()}</span>
          <Button variant="outline" size="icon" onClick={() => nav(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date())}>Heute</Button>
        </div>
        <div className="flex gap-1">
          {[["day","Tag"],["week","Woche"],["month","Monat"]].map(([key, label]) => (
            <Button key={key} size="sm" variant={viewMode === key ? "default" : "outline"} onClick={() => setViewMode(key)}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Legend */}
      {workspaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workspaces.map((w, i) => (
            <span key={w.id} className={`text-xs px-2 py-1 rounded-full font-medium border ${CAL_COLORS[i % CAL_COLORS.length]}`}>
              {w.name}
            </span>
          ))}
        </div>
      )}

      {/* Views */}
      {viewMode === "month" && (
        <MonthGrid year={year} month={month} bookings={bookings} wsColorMap={wsColorMap}
          onDayClick={(date) => openBooking(date, null)} closures={closures} isDuringClosure={isDuringClosure} />
      )}

      {viewMode === "week" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <TimeGrid
            dates={getWeekDates(current)}
            bookings={bookings}
            workspaces={workspaces}
            wsColorMap={wsColorMap}
            onSlotClick={openBooking}
            closures={closures}
            isDuringClosure={isDuringClosure}
          />
        </div>
      )}

      {viewMode === "day" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <TimeGrid
            dates={[current]}
            bookings={bookings}
            workspaces={workspaces}
            wsColorMap={wsColorMap}
            onSlotClick={openBooking}
            closures={closures}
            isDuringClosure={isDuringClosure}
          />
        </div>
      )}

      <BookingPopup
        open={bookingPopup.open}
        onOpenChange={(v) => setBookingPopup(p => ({ ...p, open: v }))}
        prefillDate={bookingPopup.date}
        prefillHour={bookingPopup.hour}
        workspaces={workspaces}
        bookings={bookings}
        onBooked={onBooked}
      />
    </div>
  );
}