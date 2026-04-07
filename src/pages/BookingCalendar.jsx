import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, CalendarDays, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const EVENT_STYLE = { bg: "bg-violet-100 border-violet-300", dot: "bg-violet-400", text: "text-violet-800" };
const BOOKING_STYLE = { bg: "bg-blue-100 border-blue-300", dot: "bg-blue-500", text: "text-blue-800" };

const BOOKING_COLORS = [
  BOOKING_STYLE, BOOKING_STYLE, BOOKING_STYLE,
  BOOKING_STYLE, BOOKING_STYLE, BOOKING_STYLE,
];

const BLOCKAGE_STYLE = { bg: "bg-amber-100 border-amber-300", dot: "bg-amber-400", text: "text-amber-800" };
const CLOSURE_STYLE = { bg: "bg-red-100 border-red-300", dot: "bg-red-400", text: "text-red-800" };

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [closures, setClosures] = useState([]);
  const [blockages, setBlockages] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("month");
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterWorkspace, setFilterWorkspace] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list("-date", 500),
      base44.entities.Workspace.list(),
      base44.entities.Closure.list(),
      base44.entities.WorkspaceBlockage.list(),
      base44.entities.Event.list(),
    ]).then(([b, w, c, bl, ev]) => {
      setBookings(b);
      setWorkspaces(w);
      setClosures(c);
      setBlockages(bl);
      setEvents(ev.filter(e => e.status !== "cancelled"));
      setLoading(false);
    });
  }, []);

  const wsColorMap = {};
  workspaces.forEach((w, i) => { wsColorMap[w.id] = BOOKING_COLORS[i % BOOKING_COLORS.length]; });

  const hasClosureOnDay = (dateStr) =>
    closures.some(c => dateStr >= c.start_date && dateStr <= c.end_date);

  const bookingsForDay = (dateStr) =>
    bookings.filter(b => b.date === dateStr && b.status !== "cancelled" &&
      (filterWorkspace === "all" || b.workspace_id === filterWorkspace) &&
      (filterType === "all" || filterType === "booking"));

  const blockagesForDay = (dateStr) =>
    blockages.filter(b => b.date === dateStr &&
      (filterWorkspace === "all" || b.workspace_id === filterWorkspace) &&
      (filterType === "all" || filterType === b.reason || filterType === "blockage"));

  const eventsForDay = (dateStr) =>
    events.filter(e => dateStr >= e.start_date && dateStr <= e.end_date &&
      (filterType === "all" || filterType === "event" || filterType === e.type));

  const allItemsForDay = (dateStr) => {
    const items = [];
    if (hasClosureOnDay(dateStr) && (filterType === "all" || filterType === "closure")) {
      items.push({ type: "closure", label: "Geschlossen", style: CLOSURE_STYLE });
    }
    eventsForDay(dateStr).forEach(e => {
      items.push({ type: "event", label: e.title, time: `${e.start_time}–${e.end_time}`, style: EVENT_STYLE, data: e });
    });
    blockagesForDay(dateStr).forEach(b => {
      items.push({ type: "blockage", label: `${b.workspace_name}: ${b.description || b.reason}`, time: `${b.start_time}–${b.end_time}`, style: BLOCKAGE_STYLE, data: b });
    });
    bookingsForDay(dateStr).forEach(b => {
      items.push({ type: "booking", label: b.workspace_name, time: `${b.start_time}–${b.end_time}`, style: wsColorMap[b.workspace_id] || BOOKING_COLORS[0], data: b });
    });
    return items;
  };

  const today = new Date();
  const todayStr = toDateStr(today);

  // Navigation
  const navigate = (dir) => {
    if (view === "month") setCurrent(new Date(current.getFullYear(), current.getMonth() + dir, 1));
    else if (view === "week") setCurrent(addDays(current, dir * 7));
    else setCurrent(addDays(current, dir));
  };

  const titleLabel = () => {
    if (view === "month") return `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;
    if (view === "week") {
      const ws = startOfWeek(current);
      const we = addDays(ws, 6);
      return `${ws.getDate()}. – ${we.getDate()}. ${MONTHS[we.getMonth()]} ${we.getFullYear()}`;
    }
    return `${current.getDate()}. ${MONTHS[current.getMonth()]} ${current.getFullYear()}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
          <p className="text-muted-foreground mt-1">Buchungen, Blockaden und Schließzeiten</p>
        </div>
        {/* View switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {["day","week","month"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                {v === "day" ? "Tag" : v === "week" ? "Woche" : "Monat"}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCurrent(new Date())}>Heute</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-end">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterWorkspace} onValueChange={setFilterWorkspace}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Arbeitsplatz" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Arbeitsplätze</SelectItem>
            {workspaces.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Typ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="booking">Buchungen</SelectItem>
            <SelectItem value="event">Veranstaltungen</SelectItem>
            <SelectItem value="closure">Schließzeiten</SelectItem>
          </SelectContent>
        </Select>
        {(filterWorkspace !== "all" || filterType !== "all") && (
          <button onClick={() => { setFilterWorkspace("all"); setFilterType("all"); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="font-semibold text-base min-w-[220px] text-center">{titleLabel()}</span>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Views */}
      {view === "month" && <MonthView current={current} todayStr={todayStr} allItemsForDay={allItemsForDay} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />}
      {view === "week" && <WeekView current={current} todayStr={todayStr} allItemsForDay={allItemsForDay} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />}
      {view === "day" && <DayView current={current} todayStr={todayStr} allItemsForDay={allItemsForDay} />}

      {/* Detail panel for month/week selected day */}
      {selectedDay && view !== "day" && (
        <DayDetailPanel dateStr={selectedDay} items={allItemsForDay(selectedDay)} onClose={() => setSelectedDay(null)} />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${BOOKING_STYLE.bg} ${BOOKING_STYLE.text}`}>Buchungen</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${EVENT_STYLE.bg} ${EVENT_STYLE.text}`}>Veranstaltungen</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${BLOCKAGE_STYLE.bg} ${BLOCKAGE_STYLE.text}`}>Blockaden</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${CLOSURE_STYLE.bg} ${CLOSURE_STYLE.text}`}>Schließzeiten</span>
      </div>
    </div>
  );
}

function MonthView({ current, todayStr, allItemsForDay, selectedDay, setSelectedDay }) {
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS_SHORT.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-3">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="min-h-[80px] border-b border-r border-border opacity-0" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const items = allItemsForDay(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;

          // Group dots by type
          const dots = items.map(item => item.style.dot);

          return (
            <div key={idx} onClick={() => setSelectedDay(dateStr === selectedDay ? null : dateStr)}
              className={`min-h-[80px] p-1.5 border-b border-r border-border cursor-pointer transition-colors
                ${isSelected ? "bg-accent/40" : "hover:bg-muted/30"}`}>
              <div className={`text-xs font-medium mb-1.5 h-5 w-5 flex items-center justify-center rounded-full
                ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{day}</div>
              <div className="flex flex-wrap gap-0.5">
                {dots.slice(0, 6).map((dotColor, i) => (
                  <span key={i} className={`w-2 h-2 rounded-full ${dotColor}`} />
                ))}
                {dots.length > 6 && <span className="text-[9px] text-muted-foreground leading-none mt-0.5">+{dots.length - 6}</span>}
              </div>
              {items.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 2).map((item, i) => (
                    <div key={i} className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${item.style.bg} ${item.style.text} border ${item.style.bg}`}>
                      {item.label}
                    </div>
                  ))}
                  {items.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{items.length - 2} weitere</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ current, todayStr, allItemsForDay, selectedDay, setSelectedDay }) {
  const ws = startOfWeek(current);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d, i) => {
          const ds = toDateStr(d);
          const isToday = ds === todayStr;
          return (
            <div key={i} className="text-center py-3 border-r border-border last:border-r-0">
              <div className="text-xs text-muted-foreground font-medium">{WEEKDAYS_SHORT[i]}</div>
              <div className={`mx-auto mt-1 h-6 w-6 flex items-center justify-center rounded-full text-sm font-semibold
                ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const ds = toDateStr(d);
          const items = allItemsForDay(ds);
          const isSelected = ds === selectedDay;
          return (
            <div key={i} onClick={() => setSelectedDay(ds === selectedDay ? null : ds)}
              className={`min-h-[140px] p-1.5 border-r border-border last:border-r-0 cursor-pointer transition-colors
                ${isSelected ? "bg-accent/40" : "hover:bg-muted/30"}`}>
              <div className="space-y-1">
                {items.map((item, j) => (
                  <div key={j} className={`text-xs px-1.5 py-1 rounded border font-medium ${item.style.bg} ${item.style.text}`}>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.style.dot}`} />
                      <span className="truncate text-[11px]">{item.label}</span>
                    </div>
                    {item.time && <div className="text-[10px] opacity-60 pl-2.5">{item.time}</div>}
                  </div>
                ))}
                {items.length === 0 && <div className="text-xs text-muted-foreground/30 text-center pt-4">–</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ current, todayStr, allItemsForDay }) {
  const dateStr = toDateStr(current);
  const items = allItemsForDay(dateStr);
  const isToday = dateStr === todayStr;

  const [d, m, y] = [current.getDate(), current.getMonth(), current.getFullYear()];
  const dow = (current.getDay() + 6) % 7;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 flex items-center justify-center rounded-full font-bold text-lg
          ${isToday ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{d}</div>
        <div>
          <p className="font-semibold">{WEEKDAYS_LONG[dow]}</p>
          <p className="text-sm text-muted-foreground">{String(d).padStart(2,"0")}.{String(m+1).padStart(2,"0")}.{y}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Keine Einträge an diesem Tag</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${item.style.bg}`}>
              <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.style.dot}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.style.text}`}>{item.label}</p>
                {item.time && <p className={`text-xs ${item.style.text} opacity-80`}>{item.time} Uhr</p>}
                {item.data?.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{item.data.notes}</p>}
                {item.data?.created_by && <p className="text-xs text-muted-foreground">{item.data.created_by}</p>}
              </div>
              {item.type === "event" && (
                <Badge variant="outline" className={`text-xs shrink-0 ${item.style.text} border-current`}>
                  {item.data?.type === "course" ? "Kurs" : "Veranstaltung"}
                </Badge>
              )}
              {item.type === "blockage" && (
                <Badge variant="outline" className={`text-xs shrink-0 ${item.style.text} border-current`}>
                  Blockade
                </Badge>
              )}
              {item.type === "booking" && (
                <Badge variant="outline" className="text-xs shrink-0">Buchung</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DayDetailPanel({ dateStr, items, onClose }) {
  const [y, m, d] = dateStr.split("-");
  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const dow = (dateObj.getDay() + 6) % 7;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{WEEKDAYS_LONG[dow]}, {d}.{m}.{y}</span>
          <span className="text-sm text-muted-foreground">– {items.length} Einträge</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Keine Einträge an diesem Tag.</p>
      ) : (
        <div className="space-y-2">
          {items.sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${item.style.bg}`}>
              <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.style.dot}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.style.text}`}>{item.label}</p>
                {item.time && <p className={`text-xs ${item.style.text} opacity-80`}>{item.time} Uhr</p>}
                {item.data?.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{item.data.notes}</p>}
                {item.data?.created_by && <p className="text-xs text-muted-foreground">{item.data.created_by}</p>}
              </div>
              {item.type === "event" && (
                <Badge variant="outline" className={`text-xs shrink-0 ${item.style.text} border-current`}>
                  {item.data?.type === "course" ? "Kurs" : "Veranstaltung"}
                </Badge>
              )}
              {item.type === "blockage" && (
                <Badge variant="outline" className={`text-xs shrink-0 ${item.style.text} border-current`}>
                  Blockade
                </Badge>
              )}
              {item.type === "booking" && (
                <Badge variant="outline" className="text-xs shrink-0">Buchung</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}