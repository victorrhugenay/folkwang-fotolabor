import { ArrowUp, ArrowDown, User, ChevronUp, ChevronDown } from "lucide-react";

import { Trash2 } from 'lucide-react';

export default function CostsTable({ isAdmin, bookings, usages, users, expandedUser, setExpandedUser, sortBy, sortOrder, handleSort, openCost, totalCost, togglePaid, toggleUsagePaid, deletePaid, deleteUsagePaid }) {

  const getSortedUsers = () => {
    const userList = [...users];
    userList.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "name") {
        aVal = a.full_name || a.email;
        bVal = b.full_name || b.email;
      } else if (sortBy === "openCost") {
        const aBookings = bookings.filter(bk => bk.created_by === a.email && bk.status !== "cancelled");
        const aUsages = usages.filter(mu => mu.created_by === a.email && (!mu.booking_id || !bookings.find(b => b.id === mu.booking_id)));
        aVal = aBookings.filter(bk => !bk.paid).reduce((s, bk) => s + (bk.total_cost || 0), 0) + aUsages.filter(mu => !mu.paid).reduce((s, mu) => s + (mu.total_price || 0), 0);
        
        const bBookings = bookings.filter(bk => bk.created_by === b.email && bk.status !== "cancelled");
        const bUsages = usages.filter(mu => mu.created_by === b.email && (!mu.booking_id || !bookings.find(bk => bk.id === mu.booking_id)));
        bVal = bBookings.filter(bk => !bk.paid).reduce((s, bk) => s + (bk.total_cost || 0), 0) + bUsages.filter(mu => !mu.paid).reduce((s, mu) => s + (mu.total_price || 0), 0);
      } else if (sortBy === "totalCost") {
        const aBookings = bookings.filter(bk => bk.created_by === a.email && bk.status !== "cancelled");
        const aUsages = usages.filter(mu => mu.created_by === a.email && (!mu.booking_id || !bookings.find(b => b.id === mu.booking_id)));
        aVal = aBookings.reduce((s, bk) => s + (bk.total_cost || 0), 0) + aUsages.reduce((s, mu) => s + (mu.total_price || 0), 0);
        
        const bBookings = bookings.filter(bk => bk.created_by === b.email && bk.status !== "cancelled");
        const bUsages = usages.filter(mu => mu.created_by === b.email && (!mu.booking_id || !bookings.find(bk => bk.id === mu.booking_id)));
        bVal = bBookings.reduce((s, bk) => s + (bk.total_cost || 0), 0) + bUsages.reduce((s, mu) => s + (mu.total_price || 0), 0);
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return userList;
  };

  const sortedUsers = getSortedUsers();

  if (isAdmin) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-5 py-3 text-sm cursor-pointer hover:bg-muted/70 select-none" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-2">
                    Nutzer
                    {sortBy === "name" && (sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3 text-sm cursor-pointer hover:bg-muted/70 select-none" onClick={() => handleSort("openCost")}>
                  <div className="flex items-center justify-end gap-2">
                    Offene Kosten
                    {sortBy === "openCost" && (sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3 text-sm cursor-pointer hover:bg-muted/70 select-none" onClick={() => handleSort("totalCost")}>
                  <div className="flex items-center justify-end gap-2">
                    Gesamtkosten
                    {sortBy === "totalCost" && (sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />)}
                  </div>
                </th>
                <th className="text-right font-medium px-4 py-3 text-sm"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedUsers.map(u => {
                const uBookings = bookings.filter(b => b.created_by === u.email && b.status !== "cancelled");
                const uUsages = usages.filter(mu => mu.created_by === u.email && (!mu.booking_id || !bookings.find(b => b.id === mu.booking_id)));
                const total = uBookings.reduce((s, b) => s + (b.total_cost || 0), 0) + uUsages.reduce((s, mu) => s + (mu.total_price || 0), 0);
                const open = uBookings.filter(b => !b.paid).reduce((s, b) => s + (b.total_cost || 0), 0) + uUsages.filter(mu => !mu.paid).reduce((s, mu) => s + (mu.total_price || 0), 0);
                const name = u.full_name || u.email;
                const isExpanded = expandedUser === u.id;
                
                return (
                  <>
                    <tr key={u.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                          className="flex items-center gap-3 text-left w-full"
                        >
                          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-sm text-destructive">{open.toFixed(2)} €</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-sm">{total.toFixed(2)} €</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setExpandedUser(isExpanded ? null : u.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="px-0 py-0">
                          <div className="bg-muted/20 border-t border-border">
                            <table className="w-full text-sm">
                              <tbody className="divide-y divide-border">
                                {uBookings.map(b => (
                                  <tr key={b.id} className="hover:bg-muted/30">
                                    <td className="px-8 py-2 font-medium">{b.workspace_name}</td>
                                    <td className="px-4 py-2 hidden sm:table-cell"><span className="text-xs bg-muted px-2 py-0.5 font-medium">Buchung</span></td>
                                    <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">{b.date}</td>
                                    <td className="px-4 py-2 text-right font-semibold">{(b.total_cost || 0).toFixed(2)} €</td>
                                    <td className="px-4 py-2 flex items-center gap-2">
                                      <button
                                        onClick={() => togglePaid(b)}
                                        className={`px-2.5 py-0.5 rounded-full font-medium text-xs transition-colors ${
                                          b.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                        }`}
                                      >
                                        {b.paid ? "Bezahlt" : "Offen"}
                                      </button>
                                      {isAdmin && (
                                        <button
                                          onClick={() => deletePaid(b.id)}
                                          className="p-1 rounded hover:bg-red-100 text-destructive hover:text-red-700 transition-colors"
                                          title="Buchung löschen"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {uUsages.map(mu => (
                                  <tr key={mu.id} className="hover:bg-muted/30">
                                    <td className="px-8 py-2 font-medium">{mu.material_name} <span className="text-xs text-muted-foreground font-normal">({mu.quantity} {mu.unit})</span></td>
                                    <td className="px-4 py-2 hidden sm:table-cell"><span className="text-xs bg-accent px-2 py-0.5 font-medium text-accent-foreground">Material</span></td>
                                    <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">–</td>
                                    <td className="px-4 py-2 text-right font-semibold">{(mu.total_price || 0).toFixed(2)} €</td>
                                    <td className="px-4 py-2 flex items-center gap-2">
                                      <button
                                        onClick={() => toggleUsagePaid(mu)}
                                        className={`px-2.5 py-0.5 rounded-full font-medium text-xs transition-colors ${
                                          mu.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                        }`}
                                      >
                                        {mu.paid ? "Bezahlt" : "Offen"}
                                      </button>
                                      {isAdmin && (
                                        <button
                                          onClick={() => deleteUsagePaid(mu.id)}
                                          className="p-1 rounded hover:bg-red-100 text-destructive hover:text-red-700 transition-colors"
                                          title="Material löschen"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {uBookings.length === 0 && uUsages.length === 0 && (
                                  <tr><td colSpan={5} className="px-8 py-3 text-muted-foreground text-xs">Keine Kosten vorhanden</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                <td className="px-5 py-3">Gesamt</td>
                <td className="px-4 py-3 text-right text-destructive">
                  {sortedUsers.reduce((sum, u) => {
                    const uBookings = bookings.filter(b => b.created_by === u.email && b.status !== "cancelled");
                    const uUsages = usages.filter(mu => mu.created_by === u.email && (!mu.booking_id || !bookings.find(b => b.id === mu.booking_id)));
                    const open = uBookings.filter(b => !b.paid).reduce((s, b) => s + (b.total_cost || 0), 0) + uUsages.filter(mu => !mu.paid).reduce((s, mu) => s + (mu.total_price || 0), 0);
                    return sum + open;
                  }, 0).toFixed(2)} €
                </td>
                <td className="px-4 py-3 text-right">
                  {sortedUsers.reduce((sum, u) => {
                    const uBookings = bookings.filter(b => b.created_by === u.email && b.status !== "cancelled");
                    const uUsages = usages.filter(mu => mu.created_by === u.email && (!mu.booking_id || !bookings.find(b => b.id === mu.booking_id)));
                    const total = uBookings.reduce((s, b) => s + (b.total_cost || 0), 0) + uUsages.reduce((s, mu) => s + (mu.total_price || 0), 0);
                    return sum + total;
                  }, 0).toFixed(2)} €
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
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
            {bookings.length > 0 && (
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 font-medium">Du</td>
                <td className="px-4 py-3 text-right font-semibold text-destructive">{openCost.toFixed(2)} €</td>
                <td className="px-4 py-3 text-right font-semibold">{totalCost.toFixed(2)} €</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {bookings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Keine Daten vorhanden</div>
      )}
    </div>
  );
}