import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function Admin() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editForms, setEditForms] = useState({});
  const [saving, setSaving] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Bitte E-Mail-Adresse angeben.", variant: "destructive" });
      return;
    }
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    toast({ title: "Einladung gesendet", description: `${inviteEmail} wurde eingeladen. Ein Einmal-Login-Link wurde per E-Mail verschickt.` });
    setInviteEmail("");
    setInviteRole("user");
    setInviting(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    base44.entities.User.list("-created_date", 100).then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, [isAdmin]);

  const toggleExpand = (u) => {
    if (expandedId === u.id) {
      setExpandedId(null);
    } else {
      setExpandedId(u.id);
      setEditForms((prev) => ({
        ...prev,
        [u.id]: {
          vorname: u.vorname || "",
          nachname: u.nachname || "",
          matrikelnummer: u.matrikelnummer || "",
          strasse: u.strasse || "",
          hausnummer: u.hausnummer || "",
          plz: u.plz || "",
          ort: u.ort || "",
          role: u.role || "user"
        }
      }));
    }
  };

  const setField = (userId, field) => (e) => {
    setEditForms((prev) => ({ ...prev, [userId]: { ...prev[userId], [field]: e.target.value } }));
  };

  const handleSave = async (userId) => {
    setSaving(userId);
    const form = editForms[userId];
    await base44.entities.User.update(userId, form);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...form } : u));
    toast({ title: "Nutzerdaten gespeichert" });
    setSaving(null);
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>);

  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Shield className="h-10 w-10 opacity-40" />
        <p className="font-medium">Kein Zugriff – nur für Administratoren</p>
      </div>);

  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nutzerverwaltung</h1>
        <p className="text-muted-foreground mt-1">{users.length} registrierte Nutzer</p>
      </div>

      {/* Invite new user */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Neuen Nutzer einladen</h2>
        </div>
        <p className="text-sm text-muted-foreground">Der Nutzer erhält einen Einmal-Login-Link per E-Mail und kann danach ein eigenes Passwort setzen.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label>E-Mail-Adresse</Label>
            <Input
              type="email"
              placeholder="nutzer@beispiel.de"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()} />
            
          </div>
          <div>
            <Label>Rolle</Label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <span className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Nutzer</span>
                </SelectItem>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Administrator</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleInvite} disabled={inviting} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-none inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9">
              {inviting ? "Wird gesendet..." : "Einladen"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((u) => {
          const form = editForms[u.id] || {};
          const isOpen = expandedId === u.id;
          return (
            <div key={u.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Row */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                onClick={() => toggleExpand(u)}>
                
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || "–"}
                  </p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {u.role === "admin" ? "Administrator" : "Nutzer"}
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded edit form */}
              {isOpen &&
              <div className="border-t border-border px-5 py-5 space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Vorname</Label>
                      <Input value={form.vorname} onChange={setField(u.id, "vorname")} />
                    </div>
                    <div>
                      <Label>Nachname</Label>
                      <Input value={form.nachname} onChange={setField(u.id, "nachname")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>E-Mail-Adresse</Label>
                      <Input value={u.email} disabled className="bg-muted cursor-not-allowed" />
                    </div>
                    <div>
                      <Label>Matrikelnummer</Label>
                      <Input value={form.matrikelnummer} onChange={setField(u.id, "matrikelnummer")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Label>Straße</Label>
                      <Input value={form.strasse} onChange={setField(u.id, "strasse")} />
                    </div>
                    <div>
                      <Label>Hausnummer</Label>
                      <Input value={form.hausnummer} onChange={setField(u.id, "hausnummer")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Postleitzahl</Label>
                      <Input value={form.plz} onChange={setField(u.id, "plz")} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Ort</Label>
                      <Input value={form.ort} onChange={setField(u.id, "ort")} />
                    </div>
                  </div>
                  <div>
                    <Label>Rolle</Label>
                    <Select value={form.role} onValueChange={(v) => setEditForms((prev) => ({ ...prev, [u.id]: { ...prev[u.id], role: v } }))}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Administrator</span>
                        </SelectItem>
                        <SelectItem value="user">
                          <span className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Nutzer</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-1">
                    <Button onClick={() => handleSave(u.id)} disabled={saving === u.id}>
                      {saving === u.id ? "Wird gespeichert..." : "Speichern"}
                    </Button>
                  </div>
                </div>
              }
            </div>);

        })}
        {users.length === 0 &&
        <div className="text-center py-12 text-muted-foreground">Keine Nutzer gefunden</div>
        }
      </div>
    </div>);

}