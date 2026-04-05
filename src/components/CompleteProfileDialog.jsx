import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { UserCircle } from "lucide-react";

export default function CompleteProfileDialog({ user, onCompleted }) {
  const [form, setForm] = useState({
    vorname: user?.vorname || "",
    nachname: user?.nachname || "",
    matrikelnummer: user?.matrikelnummer || "",
    strasse: user?.strasse || "",
    hausnummer: user?.hausnummer || "",
    plz: user?.plz || "",
    ort: user?.ort || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const isComplete = form.vorname && form.nachname && form.matrikelnummer && form.strasse && form.hausnummer && form.plz && form.ort;

  const handleSave = async () => {
    if (!isComplete) {
      toast({ title: "Bitte alle Felder ausfüllen.", variant: "destructive" });
      return;
    }
    setSaving(true);
    await base44.auth.updateMe(form);
    toast({ title: "Profil gespeichert!" });
    setSaving(false);
    onCompleted();
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" hideClose>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Willkommen! Profil vervollständigen</DialogTitle>
          </div>
          <DialogDescription>
            Bitte ergänze deine Daten, um das Folkwang Fotolabor nutzen zu können.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vorname *</Label>
              <Input value={form.vorname} onChange={set("vorname")} placeholder="Max" />
            </div>
            <div>
              <Label>Nachname *</Label>
              <Input value={form.nachname} onChange={set("nachname")} placeholder="Mustermann" />
            </div>
          </div>
          <div>
            <Label>Matrikelnummer *</Label>
            <Input value={form.matrikelnummer} onChange={set("matrikelnummer")} placeholder="123456" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Straße *</Label>
              <Input value={form.strasse} onChange={set("strasse")} placeholder="Musterstraße" />
            </div>
            <div>
              <Label>Hausnr. *</Label>
              <Input value={form.hausnummer} onChange={set("hausnummer")} placeholder="1a" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>PLZ *</Label>
              <Input value={form.plz} onChange={set("plz")} placeholder="45128" />
            </div>
            <div className="col-span-2">
              <Label>Ort *</Label>
              <Input value={form.ort} onChange={set("ort")} placeholder="Essen" />
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || !isComplete} className="w-full">
          {saving ? "Wird gespeichert..." : "Profil speichern & fortfahren"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}