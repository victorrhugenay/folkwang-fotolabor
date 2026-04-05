import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Download, Plus, Trash2, FileText, Users, User } from "lucide-react";
import ImageUpload from "../components/ImageUpload";

export default function Downloads() {
  const { user, isAdmin, loading: userLoading } = useCurrentUser();
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", file_url: "", target: "all", user_email: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useState(null);

  const loadData = async () => {
    const docs = await base44.entities.Document.list("-created_date", 200);
    setDocuments(docs);
    if (isAdmin) {
      const u = await base44.entities.User.list().catch(() => []);
      setUsers(u);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) loadData();
  }, [userLoading, isAdmin]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url, title: f.title || file.name }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.file_url) return;
    await base44.entities.Document.create({
      title: form.title,
      description: form.description,
      file_url: form.file_url,
      target: form.target,
      user_email: form.target === "user" ? form.user_email : "",
    });
    toast({ title: "Dokument hochgeladen" });
    setDialogOpen(false);
    setForm({ title: "", description: "", file_url: "", target: "all", user_email: "" });
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Document.delete(id);
    toast({ title: "Dokument gelöscht" });
    loadData();
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Filter docs visible to current user
  const visibleDocs = isAdmin
    ? documents
    : documents.filter(d => d.target === "all" || d.user_email === user?.email);

  const allDocs = visibleDocs.filter(d => d.target === "all");
  const myDocs = visibleDocs.filter(d => d.target === "user" && d.user_email === user?.email);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Bereich</p>
          <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
          <p className="text-muted-foreground mt-1">Dokumente und Dateien</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Dokument hochladen
          </Button>
        )}
      </div>

      {/* All-users documents */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Für alle Nutzer</h2>
        </div>
        {allDocs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border text-sm">
            Keine Dokumente vorhanden
          </div>
        ) : (
          <div className="bg-card border border-border divide-y divide-border">
            {allDocs.map(doc => (
              <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={() => handleDelete(doc.id)} />
            ))}
          </div>
        )}
      </section>

      {/* User-specific documents */}
      {(isAdmin || myDocs.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {isAdmin ? "Nutzer-spezifische Dokumente" : "Meine Dokumente"}
            </h2>
          </div>
          {isAdmin ? (
            // Admin sees all user-specific docs grouped by user
            (() => {
              const userDocs = documents.filter(d => d.target === "user");
              if (userDocs.length === 0) return (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-border text-sm">
                  Keine nutzer-spezifischen Dokumente
                </div>
              );
              return (
                <div className="bg-card border border-border divide-y divide-border">
                  {userDocs.map(doc => {
                    const u = users.find(u => u.email === doc.user_email);
                    const name = u ? (u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email) : doc.user_email;
                    return <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={() => handleDelete(doc.id)} userLabel={name} />;
                  })}
                </div>
              );
            })()
          ) : (
            myDocs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border text-sm">
                Keine persönlichen Dokumente
              </div>
            ) : (
              <div className="bg-card border border-border divide-y divide-border">
                {myDocs.map(doc => (
                  <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={() => handleDelete(doc.id)} />
                ))}
              </div>
            )
          )}
        </section>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Datei *</Label>
              <div className="mt-1">
                <input type="file" onChange={handleFileUpload} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:border file:border-border file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-accent cursor-pointer" />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Wird hochgeladen…</p>}
                {form.file_url && <p className="text-xs text-green-600 mt-1">✓ Datei hochgeladen</p>}
              </div>
            </div>
            <div>
              <Label>Titel *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="z. B. Nutzungsordnung 2025" />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Kurze Beschreibung (optional)" />
            </div>
            <div>
              <Label>Zielgruppe *</Label>
              <Select value={form.target} onValueChange={v => setForm(f => ({ ...f, target: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Nutzer</SelectItem>
                  <SelectItem value="user">Einzelner Nutzer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.target === "user" && (
              <div>
                <Label>Nutzer *</Label>
                <Select value={form.user_email} onValueChange={v => setForm(f => ({ ...f, user_email: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nutzer auswählen" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.email}>
                        {u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.file_url || uploading || (form.target === "user" && !form.user_email)}>
              Hochladen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocRow({ doc, isAdmin, onDelete, userLabel }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 bg-accent flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-accent-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.title}</p>
        {doc.description && <p className="text-xs text-muted-foreground truncate">{doc.description}</p>}
        {userLabel && <p className="text-xs text-muted-foreground">→ {userLabel}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border hover:bg-muted transition-colors"
        >
          <Download className="h-3 w-3" /> Download
        </a>
        {isAdmin && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}