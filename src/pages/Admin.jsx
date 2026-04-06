import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, ChevronDown, ChevronUp, UserPlus, Trash2, GraduationCap, Users, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function Admin() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editForms, setEditForms] = useState({});
  const [saving, setSaving] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [tab, setTab] = useState("users");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupWorkspaces, setNewGroupWorkspaces] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [memberships, setMemberships] = useState([]);

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
    Promise.all([
      base44.entities.User.list("-created_date", 100),
      base44.entities.Group.list(),
      base44.entities.GroupMembership.list(),
      base44.entities.Workspace.list()
    ]).then(([userData, groupData, membershipData, workspaceData]) => {
      setUsers(userData);
      setGroups(groupData);
      setMemberships(membershipData);
      setWorkspaces(workspaceData);
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

  const handleDelete = async (userId) => {
    if (!confirm("Nutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    await base44.entities.User.delete(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setExpandedId(null);
    toast({ title: "Nutzer gelöscht" });
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: "Gruppennamen angeben", variant: "destructive" });
      return;
    }
    setCreatingGroup(true);
    const group = await base44.entities.Group.create({
      name: newGroupName,
      description: newGroupDesc,
      workspace_ids: newGroupWorkspaces
    });
    setGroups([...groups, group]);
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupWorkspaces([]);
    toast({ title: "Gruppe erstellt" });
    setCreatingGroup(false);
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm("Gruppe wirklich löschen?")) return;
    await base44.entities.Group.delete(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setMemberships((prev) => prev.filter((m) => m.group_id !== groupId));
    toast({ title: "Gruppe gelöscht" });
  };

  const handleAddUserToGroup = async (groupId, userEmail) => {
    const user = users.find(u => u.email === userEmail);
    if (!user) return;
    await base44.entities.GroupMembership.create({
      group_id: groupId,
      group_name: groups.find(g => g.id === groupId)?.name,
      user_email: user.email,
      user_name: user.vorname || user.nachname ? `${user.vorname || ""} ${user.nachname || ""}`.trim() : user.full_name || user.email
    });
    const newMembership = {
      group_id: groupId,
      user_email: user.email,
      group_name: groups.find(g => g.id === groupId)?.name,
      user_name: user.vorname || user.nachname ? `${user.vorname || ""} ${user.nachname || ""}`.trim() : user.full_name || user.email
    };
    setMemberships([...memberships, newMembership]);
    toast({ title: "Nutzer zur Gruppe hinzugefügt" });
  };

  const handleRemoveUserFromGroup = async (memberId) => {
    await base44.entities.GroupMembership.delete(memberId);
    setMemberships((prev) => prev.filter((m) => m.id !== memberId));
    toast({ title: "Nutzer aus Gruppe entfernt" });
  };

  const handleUpdateGroupWorkspaces = async (groupId, workspaceIds) => {
    await base44.entities.Group.update(groupId, { workspace_ids: workspaceIds });
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, workspace_ids: workspaceIds } : g));
    toast({ title: "Arbeitsplätze aktualisiert" });
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
        <div className="flex gap-4 mt-3">
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tab === "users" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Nutzer ({users.length})
          </button>
          <button
            onClick={() => setTab("groups")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tab === "groups" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Gruppen ({groups.length})
          </button>
        </div>
      </div>

      {tab === "users" && (
      <div className="space-y-6">
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
                <SelectItem value="dozent">
                  <span className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" /> Dozent</span>
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
                   <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === "admin" ? "bg-primary/10 text-primary" :
                      u.role === "dozent" ? "bg-blue-100 text-blue-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {u.role === "admin" ? "Administrator" : u.role === "dozent" ? "Dozent" : "Nutzer"}
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
                        <SelectItem value="dozent">
                          <span className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" /> Dozent</span>
                        </SelectItem>
                        <SelectItem value="user">
                          <span className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Nutzer</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Group memberships */}
                  <div className="border-t border-border pt-4">
                    <Label className="text-sm font-semibold">Gruppenmitgliedschaften</Label>
                    <div className="mt-3 space-y-2">
                      {groups.map((g) => {
                        const isMember = memberships.some(m => m.group_id === g.id && m.user_email === u.email);
                        return (
                          <div key={g.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-border">
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isMember}
                                onChange={async (e) => {
                                  if (e.target.checked) {
                                    await handleAddUserToGroup(g.id, u.email);
                                  } else {
                                    const membership = memberships.find(m => m.group_id === g.id && m.user_email === u.email);
                                    if (membership) {
                                      await handleRemoveUserFromGroup(membership.id);
                                    }
                                  }
                                }}
                                className="h-4 w-4 rounded"
                              />
                              <span className="text-sm">{g.name}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button onClick={() => handleSave(u.id)} disabled={saving === u.id}>
                      {saving === u.id ? "Wird gespeichert..." : "Speichern"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="h-4 w-4" /> Löschen
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
      </div>
      )}

      {tab === "groups" && (
      <div className="space-y-6">
        {/* Create new group */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Neue Gruppe erstellen</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Label>Gruppenname</Label>
              <Input
                placeholder="z.B. Fotografen"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Beschreibung (optional)</Label>
              <Input
                placeholder="Beschreibung der Gruppe"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Freigeschaltete Arbeitsplätze</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {workspaces.map((w) => (
                <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupWorkspaces.includes(w.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewGroupWorkspaces([...newGroupWorkspaces, w.id]);
                      } else {
                        setNewGroupWorkspaces(newGroupWorkspaces.filter(id => id !== w.id));
                      }
                    }}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">{w.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleCreateGroup} disabled={creatingGroup}>
            <Plus className="h-4 w-4 mr-2" />
            {creatingGroup ? "Wird erstellt..." : "Gruppe erstellen"}
          </Button>
        </div>

        {/* Groups list */}
        <div className="space-y-3">
          {groups.map((g) => {
            const groupMembers = memberships.filter(m => m.group_id === g.id);
            const availableUsers = users.filter(u => !groupMembers.find(m => m.user_email === u.email));
            return (
              <div key={g.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{g.name}</p>
                      {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
                      <p className="text-xs text-muted-foreground mt-2">{groupMembers.length} Mitglied{groupMembers.length !== 1 ? "er" : ""}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Freigeschaltete Arbeitsplätze ({(g.workspace_ids || []).length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {workspaces.map((w) => (
                        <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(g.workspace_ids || []).includes(w.id)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...(g.workspace_ids || []), w.id]
                                : (g.workspace_ids || []).filter(id => id !== w.id);
                              handleUpdateGroupWorkspaces(g.id, updated);
                            }}
                            className="h-4 w-4 rounded"
                          />
                          <span className="text-sm">{w.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-3 border-t border-border">
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(g.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Group members */}
                <div className="px-5 py-4 border-t border-border bg-muted/20">
                  <p className="text-sm font-medium mb-3">Mitglieder</p>
                  {groupMembers.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {groupMembers.map((m) => {
                        const user = users.find(u => u.email === m.user_email);
                        return (
                          <div key={m.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-border text-sm">
                            <span>{user?.vorname || user?.nachname ? `${user.vorname || ""} ${user.nachname || ""}`.trim() : user?.full_name || m.user_email}</span>
                            <button
                              onClick={() => handleRemoveUserFromGroup(m.id)}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-4">Keine Mitglieder</p>
                  )}

                  {availableUsers.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Nutzer hinzufügen</p>
                      <div className="flex gap-2">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddUserToGroup(g.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-md border border-input bg-white text-sm"
                        >
                          <option value="">Nutzer auswählen...</option>
                          {availableUsers.map((u) => (
                            <option key={u.id} value={u.email}>
                              {u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Keine Gruppen erstellt</div>
          )}
        </div>
      </div>
      )}

    </div>);

}