import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { UserCircle, KeyRound } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        vorname: u.vorname || "",
        nachname: u.nachname || "",
        matrikelnummer: u.matrikelnummer || "",
        strasse: u.strasse || "",
        hausnummer: u.hausnummer || "",
        plz: u.plz || "",
        ort: u.ort || "",
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    toast({ title: "Profil gespeichert" });
    setSaving(false);
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const [pwForm, setPwForm] = useState({ newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const handlePasswordChange = async () => {
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
      toast({ title: "Passwort muss mindestens 6 Zeichen haben.", variant: "destructive" });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      toast({ title: "Passwörter stimmen nicht überein.", variant: "destructive" });
      return;
    }
    setPwSaving(true);
    await base44.auth.updateMe({ password: pwForm.newPassword });
    toast({ title: "Passwort geändert" });
    setPwForm({ newPassword: "", confirm: "" });
    setPwSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mein Profil</h1>
        <p className="text-muted-foreground mt-1">Persönliche Angaben verwalten</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
            <UserCircle className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <p className="font-semibold">{form.vorname || form.nachname ? `${form.vorname || ''} ${form.nachname || ''}`.trim() : user?.full_name || user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div>
          <Label>E-Mail-Adresse</Label>
          <Input value={user?.email || ""} disabled className="bg-muted cursor-not-allowed" />
          <p className="text-xs text-muted-foreground mt-1">Die E-Mail-Adresse kann nicht geändert werden.</p>
        </div>

        <div>
          <Label>Matrikelnummer *</Label>
          <Input value={form.matrikelnummer} onChange={set("matrikelnummer")} placeholder="12345678" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Label>Straße *</Label>
            <Input value={form.strasse} onChange={set("strasse")} placeholder="Musterstraße" />
          </div>
          <div>
            <Label>Hausnummer *</Label>
            <Input value={form.hausnummer} onChange={set("hausnummer")} placeholder="1a" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Postleitzahl *</Label>
            <Input value={form.plz} onChange={set("plz")} placeholder="12345" />
          </div>
          <div className="sm:col-span-2">
            <Label>Ort *</Label>
            <Input value={form.ort} onChange={set("ort")} placeholder="Musterstadt" />
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Password change */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Passwort ändern</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Neues Passwort</Label>
            <Input
              type="password"
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="Mindestens 6 Zeichen"
            />
          </div>
          <div>
            <Label>Passwort bestätigen</Label>
            <Input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Passwort wiederholen"
            />
          </div>
        </div>
        <Button onClick={handlePasswordChange} disabled={pwSaving}>
          {pwSaving ? "Wird gespeichert..." : "Passwort ändern"}
        </Button>
      </div>
    </div>
  );
}