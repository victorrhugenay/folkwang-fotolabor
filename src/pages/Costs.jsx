import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Receipt, ChevronDown, ChevronUp, User, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "../hooks/useCurrentUser";
import StatCard from "../components/StatCard";
import CostsTable from "../components/CostsTable";
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
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin } = useCurrentUser();

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const togglePaid = async (booking) => {
    const newPaid = !booking.paid;
    await base44.entities.Booking.update(booking.id, { paid: newPaid });
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, paid: newPaid } : b));
  };

  const toggleUsagePaid = async (usage) => {
    const newPaid = !usage.paid;
    await base44.entities.MaterialUsage.update(usage.id, { paid: newPaid });
    setUsages(prev => prev.map(u => u.id === usage.id ? { ...u, paid: newPaid } : u));
  };

  const deletePaid = async (bookingId) => {
    await base44.entities.Booking.delete(bookingId);
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const deleteUsagePaid = async (usageId) => {
    await base44.entities.MaterialUsage.delete(usageId);
    setUsages(prev => prev.filter(u => u.id !== usageId));
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

  // Filter users based on search term
  const filteredUsers = users.filter(u => {
    const name = (u.full_name || u.email).toLowerCase();
    const email = u.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abrechnung</h1>
          <p className="text-muted-foreground mt-1">Kostenübersicht und Auswertungen</p>
        </div>
        {isAdmin && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nach Name oder E-Mail suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Receipt} label="Gesamtkosten" value={`${totalCost.toFixed(2)} €`} />
        <StatCard icon={Receipt} label="Offene Kosten" value={`${openCost.toFixed(2)} €`} />
      </div>

      <CostsTable
        isAdmin={isAdmin}
        bookings={bookings}
        usages={usages}
        users={filteredUsers}
        expandedUser={expandedUser}
        setExpandedUser={setExpandedUser}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        openCost={openCost}
        totalCost={totalCost}
        togglePaid={togglePaid}
        toggleUsagePaid={toggleUsagePaid}
        deletePaid={deletePaid}
        deleteUsagePaid={deleteUsagePaid}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-4">Kostenstatus</h2>
          {totalCost > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    { name: "Offene Kosten", value: Math.round(openCost * 100) / 100 },
                    { name: "Bezahlte Kosten", value: Math.round((totalCost - openCost) * 100) / 100 }
                  ]} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                    <Cell fill="hsl(0, 84%, 55%)" />
                    <Cell fill="hsl(160, 60%, 45%)" />
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2 w-full">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(0, 84%, 55%)" }} />
                  <span>Offene Kosten: {openCost.toFixed(2)} €</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(160, 60%, 45%)" }} />
                  <span>Bezahlte Kosten: {(totalCost - openCost).toFixed(2)} €</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Noch keine Daten vorhanden</p>
          )}
        </div>
      </div>
    </div>
  );
}