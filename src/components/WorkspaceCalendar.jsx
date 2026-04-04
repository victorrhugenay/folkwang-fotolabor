import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { addDays, startOfWeek, format, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9–17
const HOUR_HEIGHT = 56; // px per hour

const COLORS = [
  "bg-blue-400", "bg-emerald-400", "bg-violet-400",
  "bg-orange-400", "bg-rose-400", "bg-cyan-400",
];

export default function WorkspaceCalendar({ workspaces }) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [bookings, setBookings] = useState([]);
  const [selectedWs, setSelectedWs] = useState("all");
  const [loading, setLoading] = useState(true);

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    setLoading(true);
    base44.entities.Booking.filter({ status: "confirmed" }).then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const wsColorMap = {};
  workspaces.forEach((w, i) => {
    wsColorMap[w.id] = COLORS[i % COLORS.length];
  });

  const filteredBookings = bookings.filter(b => {
    if (selectedWs !== "all" && b.workspace_id !== selectedWs) return false;
    return days.some(d => isSameDay(d, parseISO(b.date)));
  });

  const getBookingsForDayAndHour = (day, hour) =>
    filteredBookings.filter(b => {
      if (!isSameDay(parseISO(b.date), day)) return false;
      const start = parseInt(b.start_time?.split(":")[0]);
      return start === hour;
    });

  const getBookingHeight = (b) => {
    const start = parseInt(b.start_time?.split(":")[0]);
    const end = parseInt(b.end_time?.split(":")[0]);
    return (end - start) * HOUR_HEIGHT;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(d => addDays(d, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm min-w-[200px] text-center">
            {format(weekStart, "dd. MMM", { locale: de })} – {format(addDays(weekStart, 4), "dd. MMM yyyy", { locale: de })}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekStart(d => addDays(d, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Heute
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={selectedWs}
            onChange={e => setSelectedWs(e.target.value)}
          >
            <option value="all">Alle Arbeitsplätze</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-border">
              <div />
              {days.map(day => (
                <div
                  key={day.toISOString()}
                  className={`text-center py-2 text-sm font-medium border-l border-border ${isSameDay(day, new Date()) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                >
                  <div>{format(day, "EEE", { locale: de })}</div>
                  <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-[56px_repeat(5,1fr)]">
              {/* Time labels column */}
              <div>
                {HOURS.map(h => (
                  <div key={h} className="flex items-start justify-end pr-2 text-xs text-muted-foreground" style={{ height: HOUR_HEIGHT }}>
                    <span className="mt-[-8px]">{String(h).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(day => (
                <div key={day.toISOString()} className="border-l border-border relative">
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="border-b border-border/50"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}
                  {/* Booking blocks */}
                  {filteredBookings
                    .filter(b => isSameDay(parseISO(b.date), day))
                    .map(b => {
                      const startH = parseInt(b.start_time?.split(":")[0]);
                      const topOffset = (startH - 9) * HOUR_HEIGHT;
                      const height = getBookingHeight(b);
                      const colorClass = wsColorMap[b.workspace_id] || "bg-primary";
                      return (
                        <div
                          key={b.id}
                          className={`absolute left-1 right-1 rounded-md px-2 py-1 ${colorClass} text-white text-xs overflow-hidden shadow-sm`}
                          style={{ top: topOffset + 2, height: height - 4 }}
                          title={`${b.workspace_name} · ${b.start_time}–${b.end_time}`}
                        >
                          <p className="font-semibold truncate">{b.workspace_name}</p>
                          <p className="opacity-90 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {b.start_time}–{b.end_time}
                          </p>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {selectedWs === "all" && workspaces.length > 0 && (
        <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-border">
          {workspaces.map((w, i) => (
            <span key={w.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-3 w-3 rounded-sm ${COLORS[i % COLORS.length]}`} />
              {w.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}