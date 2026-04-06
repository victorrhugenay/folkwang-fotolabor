import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Receipt, ChevronDown, ChevronUp, User, ArrowUp, ArrowDown } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import StatCard from "../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(160, 60%, 45%)", "hsl(30, 80%, 55%)", "hsl(280, 65%, 60%)", "hsl(340, 75%, 55%)"];

export default function Costs() {
  const [bookings, setBookings] = useState([]);
  const [usages, setUsages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const { isAdmin } = useCurrentUser();

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    base44.auth.me().then(me => {
      Promise.all([
        base44.entities.Booking.list("-created_date", 100),
        base44.entities.MaterialUsage.list("-created_date", 100),
        isAdmin ? base44.entities.User.list("-created_date", 100).catch(() => []) : Promise.resolve([]),
      ]).then(([b, u, allUsers]) => {
        const myBookings = isAdmin ? b : b.filter(bk => bk.created_by === me.email || bk.booked_for_email === me.email);
        const myUsages = isAdmin ? u : u.filter(mu => mu.created_by === me.email);
        setBookings(myBookings);
        setUsages(myUsages);
        setUsers(allUsers);
        setLoading(false);
      });
    });
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Standalone usages = no booking_id or booking not found
  const bookingIds = new Set(bookings.map(b => b.id));
  const standaloneUsages = usages.filter(u => !u.booking_id || !bookingIds.has(u.booking_id));
  const standaloneCost = standaloneUsages.reduce((s, u) => s + (u.total_price || 0), 0);
  const standaloneOpenCost = standaloneUsages.filter(u => !u.paid).reduce((s, u) => s + (u.total_price || 0), 0);

  const activBookings = bookings.filter(b => b.status !== "cancelled");
  const totalCost = activBookings.reduce((s, b) => s + (b.total_cost || 0), 0) + standaloneCost;
  const openCost = activBookings.filter(b => !b.paid).reduce((s, b) => s + (b.total_cost || 0), 0) + standaloneOpenCost;
  const totalWorkspaceCost = activBookings.reduce((s, b) => s + (b.total_workspace_cost || 0), 0);
  const totalMaterialCost = activBookings.reduce((s, b) => s + (b.total_material_cost || 0), 0) + standaloneCost;

  // Material breakdown by name
  const materialBreakdown = {};
  usages.forEach(u => {
    materialBreakdown[u.material_name] = (materialBreakdown[u.material_name] || 0) + (u.total_price || 0);
  });
  const pieData = Object.entries(materialBreakdown).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value);

  // Monthly chart data
  const monthlyData = {};
  bookings.forEach(b => {
    if (!b.date) return;
    const month = b.date.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { month, workspace: 0, material: 0 };
    monthlyData[month].workspace += b.total_workspace_cost || 0;
    monthlyData[month].material += b.total_material_cost || 0;
  });
  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).map(d => ({
    ...d,
    workspace: Math.round(d.workspace * 100) / 100,
    material: Math.round(d.material * 100) / 100,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abrechnung</h1>
        <p className="text-muted-foreground mt-1">Kostenübersicht und Auswertungen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Receipt} label="Gesamtkosten" value={`${totalCost.toFixed(2)} €`} />
        <StatCard icon={Receipt} label="Offene Kosten" value={`${openCost.toFixed(2)} €`} />
      </div>

      {isAdmin ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Kosten nach Nutzer (erste 20)</h2>
          </div>
          <div className="divide-y divide-border">
            {users.slice(0, 20).map(u => {
              const uBookings = bookings.filter(b => b.created_by === u.email && b.status !== "cancelled");
              const uUsages = usages.filter(mu => mu.created_by === u.email && (!mu.booking_id || !bookings.find(b => b.id === mu.booking_id)));
              const total = uBookings.reduce((s, b) => s + (b.total_cost || 0), 0) + uUsages.reduce((s, mu) => s + (mu.total_price || 0), 0);
              const open = uBookings.filter(b => !b.paid).reduce((s, b) => s + (b.total_cost || 0), 0) + uUsages.filter(mu => !mu.paid).reduce((s, mu) => s + (mu.total_price || 0), 0);
              const name = u.full_name || u.email;
              const isExpanded = expandedUser === u.id;
              return (
                <div key={u.id}>
                  <button
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{u.full_name || u.email}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="bg-muted/20 border-t border-border">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-border">
                          {uBookings.map(b => (
                            <tr key={b.id} className="hover:bg-muted/30">
                              <td className="px-8 py-2 font-medium">{b.workspace_name}</td>
                              <td className="px-4 py-2 hidden sm:table-cell"><span className="text-xs bg-muted px-2 py-0.5 font-medium">Buchung</span></td>
                              <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">{b.date}</td>
                              <td className="px-4 py-2 text-right font-semibold">{(b.total_cost || 0).toFixed(2)} €</td>
                              <td className="px-4 py-2">{b.paid ? <span className="text-xs text-green-600 font-medium">Bezahlt</span> : <span className="text-xs text-destructive font-medium">Offen</span>}</td>
                            </tr>
                          ))}
                          {uUsages.map(mu => (
                            <tr key={mu.id} className="hover:bg-muted/30">
                              <td className="px-8 py-2 font-medium">{mu.material_name} <span className="text-xs text-muted-foreground font-normal">({mu.quantity} {mu.unit})</span></td>
                              <td className="px-4 py-2 hidden sm:table-cell"><span className="text-xs bg-accent px-2 py-0.5 font-medium text-accent-foreground">Material</span></td>
                              <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">–</td>
                              <td className="px-4 py-2 text-right font-semibold">{(mu.total_price || 0).toFixed(2)} €</td>
                              <td className="px-4 py-2">{mu.paid ? <span className="text-xs text-green-600 font-medium">Bezahlt</span> : <span className="text-xs text-destructive font-medium">Offen</span>}</td>
                            </tr>
                          ))}
                          {uBookings.length === 0 && uUsages.length === 0 && (
                            <tr><td colSpan={5} className="px-8 py-3 text-muted-foreground text-xs">Keine Kosten vorhanden</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Meine Kosten</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left font-medium px-4 py-3"></th>
                  <th className="text-left font-medium px-4 py-3 cursor-pointer hover:bg-muted/70 select-none" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-2">
                      Nutzer
                      {sortBy === "name" && (sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="text-right font-medium px-4 py-3 cursor-pointer hover:bg-muted/70 select-none" onClick={() => handleSort("openCost")}>
                    <div className="flex items-center justify-end gap-2">
                      Offene Kosten
                      {sortBy === "openCost" && (sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                    </div>
                  </th>
                  <th className="text-right font-medium px-4 py-3 cursor-pointer hover:bg-muted/70 select-none" onClick={() => handleSort("totalCost")}>
                    <div className="flex items-center justify-end gap-2">
                      Gesamtkosten
                      {sortBy === "totalCost" && (sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(bookings.length > 0 || standaloneUsages.length > 0) && (() => {
                  const data = [
                    { name: "Du", openCost, totalCost }
                  ];
                  const sorted = [...data].sort((a, b) => {
                    let aVal = a[sortBy];
                    let bVal = b[sortBy];
                    if (aVal == null) aVal = "";
                    if (bVal == null) bVal = "";
                    const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal;
                    return sortOrder === "asc" ? cmp : -cmp;
                  });
                  return sorted.map(row => (
                    <tr key={row.name} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-destructive">{row.openCost.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right font-semibold">{row.totalCost.toFixed(2)} €</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 && standaloneUsages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Keine Daten vorhanden</div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-4">Monatliche Kosten</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
                <Bar dataKey="workspace" name="Arbeitsplatz" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="material" name="Material" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Noch keine Daten vorhanden</p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-4">Materialkosten-Verteilung</h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Noch keine Materialien verwendet</p>
          )}
        </div>
      </div>
    </div>
  );
}