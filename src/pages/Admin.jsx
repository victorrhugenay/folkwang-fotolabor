import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, ChevronDown, ChevronUp, UserPlus, Trash2, GraduationCap, Users, Plus, X, Pencil, Building2 } from "lucide-react";
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
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [editForms, setEditForms] = useState({});
  const [saving, setSaving] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [tab, setTab] = useState("users");
  const [memberships, setMemberships] = useState([]);
  const [editGroup, setEditGroup] = useState(null);
  const [editGroupDialog, setEditGroupDialog] = useState(false);

  const loadAll = () => {
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
  };

  useEffect(loadAll, [isAdmin]);

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

  const handleSaveGroup = async (form) => {
    if (editGroup?.id) {
      await base44.entities.Group.update(editGroup.id, form);
      toast({ title: "Gruppe gespeichert" });
    } else {
      await base44.entities.Group.create(form);
      toast({ title: "Gruppe erstellt" });
    }
    setEditGroupDialog(false);
    setEditGroup(null);
    loadAll();
  };

  const handleDeleteGroup = async (id) => {
    await base44.entities.Group.delete(id);
    const toDelete = memberships.filter(m => m.group_id === id);
    await Promise.all(toDelete.map(m => base44.entities.GroupMembership.delete(m.id)));
    toast({ title: "Gruppe gelöscht" });
    loadAll();
  };

  const handleAddUserToGroup = async (groupId, userEmail) => {
    const user = users.find(u => u.email === userEmail);
    const group = groups.find(g => g.id === groupId);
    await base44.entities.GroupMembership.create({
      group_id: groupId,
      group_name: group.name,
      user_email: userEmail,
      user_name: user ? (user.vorname || user.nachname ? `${user.vorname || ""} ${user.nachname || ""}`.trim() : user.full_name) : userEmail,
    });
    toast({ title: "Nutzer hinzugefügt" });
    loadAll();
  };

  const handleRemoveUserFromGroup = async (memberId) => {
    await base44.entities.GroupMembership.delete(memberId);
    setMemberships((prev) => prev.filter((m) => m.id !== memberId));
    toast({ title: "Nutzer aus Gruppe entfernt" });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nutzerverwaltung</h1>
          <p className="text-muted-foreground mt-1">{users.length} Nutzer</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            <Button
              variant={tab === "users" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("users")}
            >
              <User className="h-4 w-4 mr-2" /> Nutzer ({users.length})
            </Button>
            <Button
              variant={tab === "groups" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("groups")}
            >
              <Users className="h-4 w-4 mr-2" /> Gruppen ({groups.length})
            </Button>
          </div>
          <Button onClick={() => { setInviteEmail(""); setInviteRole("user"); setEditGroupDialog(false); setTab("users"); }}>
            <UserPlus className="h-4 w-4 mr-2" /> Nutzer einladen
          </Button>
        </div>
      </div>

      {tab === "users" && (
      <div className="space-y-6">
      {/* Invite new user */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Details</h2>
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
            <Button onClick={handleInvite} disabled={inviting}>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gruppenverwaltung</h1>
            <p className="text-muted-foreground mt-1">{groups.length} Gruppen</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setEditGroup({}); setEditGroupDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Neue Gruppe
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {groups.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Noch keine Gruppen angelegt</p>
            </div>
          )}
          {groups.map(group => {
            const groupMembers = memberships.filter(m => m.group_id === group.id);
            const groupWorkspaces = workspaces.filter(w => (group.workspace_ids || []).includes(w.id));
            const isOpen = expandedGroupId === group.id;
            const availableUsers = users.filter(u => !groupMembers.some(m => m.user_email === u.email));

            return (
              <div key={group.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{group.name}</h3>
                    {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {groupMembers.length} Nutzer</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {groupWorkspaces.length} Arbeitsplätze</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setExpandedGroupId(isOpen ? null : group.id)}>
                      {isOpen ? "Schließen" : "Verwalten"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditGroup(group); setEditGroupDialog(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border p-5 bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Workspaces section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> Freigeschaltete Arbeitsplätze</h4>
                      <div className="space-y-1 mb-3">
                        {groupWorkspaces.length === 0 && <p className="text-sm text-muted-foreground">Keine Arbeitsplätze zugewiesen</p>}
                        {groupWorkspaces.map(w => (
                          <div key={w.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border text-sm">
                            <span>{w.name}</span>
                            <button
                              className="text-destructive hover:opacity-80"
                              onClick={async () => {
                                const newIds = (group.workspace_ids || []).filter(id => id !== w.id);
                                await base44.entities.Group.update(group.id, { workspace_ids: newIds });
                                loadAll();
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <AddWorkspaceSelect
                        workspaces={workspaces.filter(w => !(group.workspace_ids || []).includes(w.id))}
                        onAdd={async (wsId) => {
                          const newIds = [...(group.workspace_ids || []), wsId];
                          await base44.entities.Group.update(group.id, { workspace_ids: newIds });
                          loadAll();
                        }}
                      />
                    </div>

                    {/* Members section */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Mitglieder</h4>
                      <div className="space-y-1 mb-3">
                        {groupMembers.length === 0 && <p className="text-sm text-muted-foreground">Keine Mitglieder</p>}
                        {groupMembers.map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border text-sm">
                            <div>
                              <p className="font-medium">{m.user_name || m.user_email}</p>
                              <p className="text-xs text-muted-foreground">{m.user_email}</p>
                            </div>
                            <button className="text-destructive hover:opacity-80" onClick={() => handleRemoveUserFromGroup(m.id)}>
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <AddUserSelect
                        users={availableUsers}
                        onAdd={(email) => handleAddUserToGroup(group.id, email)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      <GroupFormDialog
        open={editGroupDialog}
        onOpenChange={setEditGroupDialog}
        group={editGroup}
        onSave={handleSaveGroup}
      />
    </div>);
}

function AddWorkspaceSelect({ workspaces, onAdd }) {
  const [val, setVal] = useState("");
  if (workspaces.length === 0) return null;
  return (
    <div className="flex gap-2">
      <select
        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        value={val}
        onChange={e => setVal(e.target.value)}
      >
        <option value="">Arbeitsplatz hinzufügen...</option>
        {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <Button size="sm" disabled={!val} onClick={() => { onAdd(val); setVal(""); }}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function AddUserSelect({ users, onAdd }) {
  const [val, setVal] = useState("");
  if (users.length === 0) return <p className="text-xs text-muted-foreground">Alle Nutzer sind bereits Mitglied</p>;
  return (
    <div className="flex gap-2">
      <select
        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        value={val}
        onChange={e => setVal(e.target.value)}
      >
        <option value="">Nutzer hinzufügen...</option>
        {users.map(u => (
          <option key={u.id} value={u.email}>
            {u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email} ({u.email})
          </option>
        ))}
      </select>
      <Button size="sm" disabled={!val} onClick={() => { onAdd(val); setVal(""); }}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function GroupFormDialog({ open, onOpenChange, group, onSave }) {
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (group) setForm({ name: group.name || "", description: group.description || "" });
  }, [group]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group?.id ? "Gruppe bearbeiten" : "Neue Gruppe"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Gruppenname *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="z.B. Kurs WS2425" />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}