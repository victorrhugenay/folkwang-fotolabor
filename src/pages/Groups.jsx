import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, Plus, Pencil, Trash2, Users, Building2, UserPlus, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Groups() {
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const [groups, setGroups] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editGroup, setEditGroup] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadAll = () => {
    if (!isAdmin) return;
    Promise.all([
      base44.entities.Group.list(),
      base44.entities.Workspace.list(),
      base44.entities.User.list(),
      base44.entities.GroupMembership.list(),
    ]).then(([g, w, u, m]) => {
      setGroups(g);
      setWorkspaces(w);
      setUsers(u);
      setMemberships(m);
      setLoading(false);
    });
  };

  useEffect(loadAll, [isAdmin]);

  const handleSaveGroup = async (form) => {
    if (editGroup?.id) {
      await base44.entities.Group.update(editGroup.id, form);
      toast({ title: "Gruppe gespeichert" });
    } else {
      await base44.entities.Group.create(form);
      toast({ title: "Gruppe erstellt" });
    }
    setEditDialog(false);
    setEditGroup(null);
    loadAll();
  };

  const handleDeleteGroup = async (id) => {
    await base44.entities.Group.delete(id);
    // also remove memberships
    const toDelete = memberships.filter(m => m.group_id === id);
    await Promise.all(toDelete.map(m => base44.entities.GroupMembership.delete(m.id)));
    toast({ title: "Gruppe gelöscht" });
    loadAll();
  };

  const handleAddMember = async (group, userEmail) => {
    const user = users.find(u => u.email === userEmail);
    await base44.entities.GroupMembership.create({
      group_id: group.id,
      group_name: group.name,
      user_email: userEmail,
      user_name: user ? (user.vorname || user.nachname ? `${user.vorname || ""} ${user.nachname || ""}`.trim() : user.full_name) : userEmail,
    });
    toast({ title: "Nutzer hinzugefügt" });
    loadAll();
  };

  const handleRemoveMember = async (membershipId) => {
    await base44.entities.GroupMembership.delete(membershipId);
    toast({ title: "Nutzer entfernt" });
    loadAll();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gruppen & Freischaltungen</h1>
          <p className="text-muted-foreground mt-1">Verwalte Nutzergruppen und deren Zugang zu Arbeitsplätzen</p>
        </div>
        <Button onClick={() => { setEditGroup({}); setEditDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Neue Gruppe
        </Button>
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
          const isOpen = expandedId === group.id;
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
                  <Button variant="outline" size="sm" onClick={() => setExpandedId(isOpen ? null : group.id)}>
                    {isOpen ? "Schließen" : "Verwalten"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditGroup(group); setEditDialog(true); }}>
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
                          <button className="text-destructive hover:opacity-80" onClick={() => handleRemoveMember(m.id)}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <AddUserSelect
                      users={availableUsers}
                      onAdd={(email) => handleAddMember(group, email)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GroupFormDialog
        open={editDialog}
        onOpenChange={setEditDialog}
        group={editGroup}
        onSave={handleSaveGroup}
      />
    </div>
  );
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
        <UserPlus className="h-3.5 w-3.5" />
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