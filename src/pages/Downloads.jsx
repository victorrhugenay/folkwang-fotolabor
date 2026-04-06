import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import FilePreviewModal from "../components/FilePreviewModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FolderDown, FileText, Image, FileSpreadsheet, File, Plus, Trash2, Loader2, User, Users } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { HardDrive } from "lucide-react";

function formatFileSize(bytes) {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function getFileSize(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return parseInt(response.headers.get("content-length") || "0", 10);
  } catch {
    return null;
  }
}

function getFileIcon(url) {
  if (!url) return File;
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return Image;
  if (["xls", "xlsx"].includes(ext)) return FileSpreadsheet;
  return FileText;
}

function UploadDocDialog({ open, onOpenChange, users, onSaved }) {
  const [form, setForm] = useState({ title: "", description: "", folder: "", target: "all", user_email: "" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!form.title || !file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Document.create({ ...form, file_url });
    setUploading(false);
    setForm({ title: "", description: "", folder: "", target: "all", user_email: "" });
    setFile(null);
    onSaved();
    onOpenChange(false);
    toast({ title: "Dokument hochgeladen" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Dokument hochladen</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Titel *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ordner</Label>
              <Input value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))} placeholder="z.B. Formulare" />
            </div>
            <div>
              <Label>Zielgruppe</Label>
              <Select value={form.target} onValueChange={v => setForm(f => ({ ...f, target: v, user_email: "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Nutzer</SelectItem>
                  <SelectItem value="user">Einzelner Nutzer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.target === "user" && (
            <div>
              <Label>Nutzer *</Label>
              <Select value={form.user_email} onValueChange={v => setForm(f => ({ ...f, user_email: v }))}>
                <SelectTrigger><SelectValue placeholder="Nutzer wählen" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.email} value={u.email}>
                      {u.vorname || u.nachname ? `${u.vorname || ""} ${u.nachname || ""}`.trim() : u.full_name || u.email} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Datei *</Label>
            <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={uploading || !form.title || !file || (form.target === "user" && !form.user_email)}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Downloads() {
  const { user, isAdmin } = useCurrentUser();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const loadData = async () => {
    const [allDocs, allUsers] = await Promise.all([
      base44.entities.Document.list("-created_date", 100),
      isAdmin ? base44.entities.User.list().catch(() => []) : Promise.resolve([]),
    ]);
    setDocs(allDocs);
    setUsers(allUsers);
    setLoading(false);
  };

  useEffect(() => { if (user) loadData(); }, [user, isAdmin]);

  const handleDelete = async (id) => {
    await base44.entities.Document.delete(id);
    toast({ title: "Gelöscht" });
    loadData();
  };

  // Filter: show docs for "all" or docs specifically for this user
  const visibleDocs = docs.filter(d =>
    d.target === "all" || (d.target === "user" && d.user_email === user?.email)
  );

  // Group by folder
  const folders = {};
  visibleDocs.forEach(d => {
    const folder = d.folder || "Allgemein";
    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(d);
  });

  // My personal docs
  const myDocs = visibleDocs.filter(d => d.target === "user" && d.user_email === user?.email);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-1">Folkwang Fotolabor</p>
          <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
          <p className="text-muted-foreground mt-1">{visibleDocs.length} Dokument{visibleDocs.length !== 1 ? "e" : ""} verfügbar</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Dokument hochladen
          </Button>
        )}
      </div>

      {/* Personal docs banner */}
      {myDocs.length > 0 && (
        <div className="bg-accent/40 border border-accent rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-accent-foreground" />
            <h2 className="font-semibold text-accent-foreground text-sm uppercase tracking-widest">Meine Dokumente</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myDocs.map(doc => <DocCard key={doc.id} doc={doc} isAdmin={isAdmin} onPreview={() => setPreview(doc)} onDelete={() => handleDelete(doc.id)} />)}
          </div>
        </div>
      )}

      {/* Folders */}
      {Object.entries(folders)
        .filter(([, fdocs]) => fdocs.some(d => d.target === "all"))
        .map(([folder, fdocs]) => {
          const publicDocs = fdocs.filter(d => d.target === "all");
          return (
            <div key={folder}>
              <div className="flex items-center gap-2 mb-3">
                <FolderDown className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">{folder}</h2>
                <span className="text-xs text-muted-foreground">({publicDocs.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {publicDocs.map(doc => <DocCard key={doc.id} doc={doc} isAdmin={isAdmin} onPreview={() => setPreview(doc)} onDelete={() => handleDelete(doc.id)} />)}
              </div>
            </div>
          );
        })}

      {visibleDocs.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <FolderDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Keine Dokumente vorhanden</p>
        </div>
      )}

      {/* Admin: all user-specific docs */}
      {isAdmin && docs.filter(d => d.target === "user").length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Nutzerbezogene Dokumente (Admin-Ansicht)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {docs.filter(d => d.target === "user").map(doc => (
              <DocCard key={doc.id} doc={doc} isAdmin={isAdmin} onPreview={() => setPreview(doc)} onDelete={() => handleDelete(doc.id)} userEmail={doc.user_email} />
            ))}
          </div>
        </div>
      )}

      <UploadDocDialog open={uploadOpen} onOpenChange={setUploadOpen} users={users} onSaved={loadData} />
      {preview && <FilePreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function DocCard({ doc, isAdmin, onPreview, onDelete, userEmail }) {
  const Icon = getFileIcon(doc.file_url);
  const [fileSize, setFileSize] = useState(null);
  const [loadingSize, setLoadingSize] = useState(true);

  useEffect(() => {
    getFileSize(doc.file_url).then(size => {
      setFileSize(size);
      setLoadingSize(false);
    });
  }, [doc.file_url]);

  return (
    <div className="nm-card p-4 hover:scale-[1.01] transition-transform flex items-start gap-3 group" style={{ border: 'none' }}>
      <div className="nm-icon h-10 w-10 shrink-0" style={{ borderRadius: '10px' }}>
        <Icon className="h-5 w-5 text-accent-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <button onClick={onPreview} className="text-sm font-medium text-left hover:text-primary transition-colors line-clamp-2 w-full">
          {doc.title}
        </button>
        {doc.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</p>}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <HardDrive className="h-3 w-3" />
          {loadingSize ? "..." : formatFileSize(fileSize)}
          {userEmail && <span className="ml-auto text-primary"><User className="h-3 w-3 inline mr-0.5" />{userEmail}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2" title={doc.file_url}>
            Download
          </a>
          {isAdmin && (
            <button onClick={onDelete} className="ml-auto text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}