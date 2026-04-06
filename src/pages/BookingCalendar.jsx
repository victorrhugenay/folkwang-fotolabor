import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "bg-blue-200 text-blue-800",
  "bg-green-200 text-green-800",
  "bg-purple-200 text-purple-800",
  "bg-orange-200 text-orange-800",
  "bg-pink-200 text-pink-800",
  "bg-teal-200 text-teal-800",
  "bg-yellow-200 text-yellow-800",
  "bg-red-200 text-red-800",
];

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list("-date", 500),
      base44.entities.Workspace.list(),
      base44.entities.Closure.list(),
    ]).then(([b, w, c]) => {
      setBookings(b);
      setWorkspaces(w);
      setClosures(c);
      setLoading(false);
    });
  }, []);

  const wsColorMap = {};
  workspaces.forEach((w, i) => { wsColorMap[w.id] = COLORS[i % COLORS.length]; });

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1);
  // Monday-based: getDay() returns 0=Sun, so shift
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

  const hasClosureOnDay = (day) => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return closures.some(c => {
      if (dateStr < c.start_date || dateStr > c.end_date) return false;
      return true;
    });
  };

  const today = new Date();
  const isToday = (day) => day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

  const selectedBookings = selectedDay ? bookingsForDay(selectedDay) : [];
  const selectedDateStr = selectedDay
    ? `${String(selectedDay).padStart(2, "0")}.${String(month + 1).padStart(2, "0")}.${year}`
    : null;

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
          <h1 className="text-2xl font-bold tracking-tight">Belegungskalender</h1>
          <p className="text-muted-foreground mt-1">Übersicht aller Arbeitsplatzbuchungen</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setCurrent(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold w-36 text-center">{MONTHS[month]} {year}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrent(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setCurrent(new Date()); setSelectedDay(null); }}>
            Heute
          </Button>
        </div>
      </div>

      {/* Legend */}
      {workspaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workspaces.map((w, i) => (
            <span key={w.id} className={`text-xs px-2 py-1 rounded-full font-medium ${COLORS[i % COLORS.length]}`}>
              {w.name}
            </span>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-3">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const dayBookings = bookingsForDay(day);
            const isSelected = day === selectedDay;
            return (
              <div
                key={idx}
                onClick={() => day && !hasClosureOnDay(day) && setSelectedDay(day === selectedDay ? null : day)}
                className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-border last:border-r-0 transition-colors
                  ${hasClosureOnDay(day) ? "bg-red-50 cursor-not-allowed" : day ? "cursor-pointer hover:bg-muted/40" : "bg-muted/10"}
                  ${isSelected ? "bg-accent/40" : ""}
                  ${!day ? "opacity-0 pointer-events-none" : ""}
                `}
              >
                {day && (
                  <>
                    <div className={`text-xs font-medium mb-1 h-5 w-5 flex items-center justify-center rounded-full
                      ${isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"}
                    `}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                       {hasClosureOnDay(day) && <div className="text-[10px] px-1.5 py-0.5 rounded bg-red-200 text-red-800 border border-red-300 font-medium truncate">🔒 Geschlossen</div>}
                       {dayBookings.slice(0, 3).map(b => (
                        <div
                          key={b.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${wsColorMap[b.workspace_id] || "bg-muted text-muted-foreground"}`}
                          title={`${b.workspace_name} · ${b.start_time}–${b.end_time}`}
                        >
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

      {/* Day Detail Panel */}
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