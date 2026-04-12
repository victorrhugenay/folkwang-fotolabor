/**
 * Apple-style time grid used by WeekView and DayView in BookingCalendar.
 * Hours are displayed from START_HOUR to END_HOUR.
 * Each item needs: { label, time (e.g. "09:00–11:00"), style: { bg, text, dot }, type }
 */

const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 56; // px per hour

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

function getItemPosition(item) {
  if (!item.time) return null;
  const [startStr, endStr] = item.time.split("–");
  const start = parseTime(startStr?.trim());
  const end = parseTime(endStr?.trim());
  if (start == null || end == null || end <= start) return null;
  const top = (start - START_HOUR) * HOUR_HEIGHT;
  const height = (end - start) * HOUR_HEIGHT;
  if (top + height < 0 || top > TOTAL_HOURS * HOUR_HEIGHT) return null;
  return {
    top: Math.max(0, top),
    height: Math.max(18, Math.min(height, TOTAL_HOURS * HOUR_HEIGHT - Math.max(0, top))),
  };
}

// Group overlapping items into columns for side-by-side rendering
function layoutItems(items) {
  const positioned = items
    .map((item, idx) => ({ item, idx, pos: getItemPosition(item) }))
    .filter(x => x.pos !== null);

  const columns = [];
  positioned.forEach(entry => {
    let placed = false;
    for (const col of columns) {
      const last = col[col.length - 1];
      const lastEnd = last.pos.top + last.pos.height;
      if (entry.pos.top >= lastEnd - 2) {
        col.push(entry);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([entry]);
  });

  const result = [];
  columns.forEach((col, colIdx) => {
    col.forEach(entry => {
      result.push({ ...entry, colIdx, totalCols: columns.length });
    });
  });

  // Also include items without position (all-day / no time)
  items.forEach((item, idx) => {
    if (!getItemPosition(item)) {
      result.push({ item, idx, pos: null, colIdx: 0, totalCols: 1 });
    }
  });

  return result;
}

export default function TimeGrid({ days, allItemsForDay, selectedDay, setSelectedDay, singleDay = false }) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  const totalHeight = TOTAL_HOURS * HOUR_HEIGHT;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Day headers */}
      {!singleDay && (
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
          <div className="border-r border-border" />
          {days.map(({ dateStr, label, dayNum, isToday, isWeekend }) => (
            <div
              key={dateStr}
              className={`text-center py-2.5 border-r border-border last:border-r-0 ${isWeekend ? "bg-muted/40" : ""}`}
            >
              <div className="text-xs text-muted-foreground font-medium">{label}</div>
              <div className={`mx-auto mt-0.5 h-6 w-6 flex items-center justify-center rounded-full text-sm font-semibold
                ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                {dayNum}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
        <div className="relative flex" style={{ minHeight: totalHeight }}>
          {/* Hour labels */}
          <div className="w-12 shrink-0 border-r border-border relative">
            {hours.map(h => (
              <div
                key={h}
                className="absolute w-full text-right pr-2"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 7 }}
              >
                <span className="text-[10px] text-muted-foreground font-medium">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className={`flex-1 grid`} style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
            {days.map(({ dateStr, isWeekend }) => {
              const items = allItemsForDay(dateStr);
              const laid = layoutItems(items);
              const isSelected = dateStr === selectedDay;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay && setSelectedDay(dateStr === selectedDay ? null : dateStr)}
                  className={`relative border-r border-border last:border-r-0 transition-colors
                    ${isWeekend ? "bg-muted/20" : ""}
                    ${isSelected ? "bg-accent/20" : setSelectedDay ? "hover:bg-muted/10" : ""}
                    ${setSelectedDay ? "cursor-pointer" : ""}`}
                  style={{ height: totalHeight }}
                >
                  {/* Hour lines */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-border/40"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {hours.map(h => (
                    <div
                      key={`${h}-half`}
                      className="absolute left-0 right-0 border-t border-border/20"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    />
                  ))}

                  {/* Positioned items */}
                  {laid.filter(e => e.pos !== null).map((entry, i) => {
                    const { item, pos, colIdx, totalCols } = entry;
                    const widthPct = 100 / totalCols;
                    const leftPct = colIdx * widthPct;
                    return (
                      <div
                        key={i}
                        onClick={e => e.stopPropagation()}
                        className={`absolute rounded overflow-hidden border shadow-sm ${item.style.bg} ${item.style.text}`}
                        style={{
                          top: pos.top + 1,
                          height: pos.height - 2,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          minHeight: 16,
                        }}
                      >
                        <div className={`w-full h-full px-1 py-0.5 flex flex-col overflow-hidden`}>
                          <span className="text-[10px] font-semibold leading-tight truncate">{item.label}</span>
                          {pos.height >= 30 && item.time && (
                            <span className="text-[9px] opacity-70 leading-tight truncate">{item.time}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* All-day items (no time) at top */}
                  {laid.filter(e => e.pos === null).map((entry, i) => (
                    <div
                      key={`allday-${i}`}
                      onClick={e => e.stopPropagation()}
                      className={`mx-0.5 mb-0.5 px-1 py-0.5 rounded text-[9px] font-semibold truncate border ${entry.item.style.bg} ${entry.item.style.text}`}
                      style={{ position: "relative", zIndex: 1 }}
                    >
                      {entry.item.label}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}