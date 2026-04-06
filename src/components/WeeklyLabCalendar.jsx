import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WeeklyLabCalendar({ bookings = [], events = [], currentUserEmail }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [weekStart]);

  const hours = Array.from({ length: 8 }, (_, i) => 9 + i);

  const getBookingsForDay = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.filter(b => b.date === dateStr && b.status === "confirmed");
  };

  const getEventsForDay = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter(ev => ev.start_date <= dateStr && dateStr <= ev.end_date && ev.status === "upcoming");
  };

  const getItemsForHour = (date, hour) => {
    const dateStr = date.toISOString().split("T")[0];
    const items = [];
    
    bookings.forEach(b => {
      if (b.date !== dateStr || b.status !== "confirmed") return;
      const startHour = parseInt(b.start_time.split(":")[0]);
      const endHour = parseInt(b.end_time.split(":")[0]);
      if (hour >= startHour && hour < endHour) {
        items.push({ type: "booking", data: b, isOwn: b.created_by === currentUserEmail || b.booked_for_email === currentUserEmail });
      }
    });

    events.forEach(ev => {
      if (!(ev.start_date <= dateStr && dateStr <= ev.end_date) || ev.status !== "upcoming") return;
      const startHour = parseInt(ev.start_time.split(":")[0]);
      const endHour = parseInt(ev.end_time.split(":")[0]);
      if (hour >= startHour && hour < endHour) {
        items.push({ type: "event", data: ev, isOwn: false });
      }
    });

    return items;
  };

  const previousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Wochenkalender Labor</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex gap-1 mb-2">
            <div className="w-14 shrink-0"></div>
            {weekDays.map((date, idx) => {
              const isToday = date.toISOString().split("T")[0] === today;
              return (
                <div key={idx} className={`flex-1 min-w-24 text-center p-1.5 rounded-lg ${isToday ? "bg-primary/10 border border-primary/30" : "bg-muted"}`}>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {date.toLocaleDateString("de", { weekday: "short" })}
                  </p>
                  <p className="text-sm font-bold">{date.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Grid */}
           {hours.map(hour => (
            <div key={hour} className="flex gap-1 mb-0.5 min-h-6">
              <div className="w-10 shrink-0 text-xs text-muted-foreground py-0 font-medium text-center">{hour}</div>
              {weekDays.map((date, dayIdx) => {
                const items = getItemsForHour(date, hour);
                return (
                  <div
                    key={dayIdx}
                    className="flex-1 min-w-24 border border-border rounded-lg p-0.5 bg-white relative overflow-hidden"
                  >
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`text-[10px] p-0.5 rounded mb-0.5 truncate font-medium ${
                          item.type === "booking"
                            ? item.isOwn
                              ? "bg-primary/30 text-primary border border-primary/50"
                              : "bg-muted text-muted-foreground"
                            : "bg-blue-100 text-blue-700 border border-blue-300"
                        }`}
                        title={item.type === "booking" ? item.data.workspace_name : item.data.title}
                      >
                        {item.type === "booking" ? item.data.workspace_name : item.data.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary/30 border border-primary/50"></div>
          <span className="text-muted-foreground">Eigene Buchungen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-muted border border-border"></div>
          <span className="text-muted-foreground">Andere Buchungen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-100 border border-blue-300"></div>
          <span className="text-muted-foreground">Events/Kurse</span>
        </div>
      </div>
    </div>
  );
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}