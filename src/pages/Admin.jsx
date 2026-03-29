import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Admin() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.User.list().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const updateRole = async (userId, role) => {
    await base44.entities.User.update(userId, { role });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    toast({ title: "Rolle aktualisiert" });
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Shield className="h-10 w-10 opacity-40" />
        <p className="font-medium">Kein Zugriff – nur für Administratoren</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nutzerverwaltung</h1>
        <p className="text-muted-foreground mt-1">{users.length} registrierte Nutzer</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Nutzer</th>
                <th className="text-left font-medium px-4 py-3">E-Mail</th>
                <th className="text-left font-medium px-4 py-3">Registriert</th>
                <th className="text-left font-medium px-4 py-3">Rolle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                        <User className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <span className="font-medium">{u.full_name || "–"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString("de-DE") : "–"}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={u.role || "user"} onValueChange={role => updateRole(u.id, role)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" /> Administrator
                          </span>
                        </SelectItem>
                        <SelectItem value="user">
                          <span className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" /> Nutzer
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Keine Nutzer gefunden</div>
        )}
      </div>
    </div>
  );
}