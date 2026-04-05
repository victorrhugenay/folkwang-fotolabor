import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [dsgvoAccepted, setDsgvoAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const isComplete = form.vorname && form.nachname && form.matrikelnummer && form.strasse && form.hausnummer && form.plz && form.ort && agbAccepted && dsgvoAccepted;

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
        {/* AGB */}
        <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-semibold">Allgemeine Geschäftsbedingungen (AGB)</p>
          <ScrollArea className="h-32 text-xs text-muted-foreground leading-relaxed pr-2">
            <p className="font-medium mb-1">§ 1 Geltungsbereich</p>
            <p className="mb-2">Diese AGB gelten für die Nutzung des Folkwang Fotolabors durch Studierende und Angehörige der Folkwang Universität der Künste.</p>
            <p className="font-medium mb-1">§ 2 Nutzungsbedingungen</p>
            <p className="mb-2">Die Nutzung des Fotolabors ist ausschließlich für studienbezogene Zwecke gestattet. Eine gewerbliche Nutzung ist nicht zulässig. Die Nutzer sind verpflichtet, die Geräte und Materialien sorgsam zu behandeln.</p>
            <p className="font-medium mb-1">§ 3 Buchungen & Stornierung</p>
            <p className="mb-2">Buchungen sind verbindlich. Stornierungen sind bis 24 Stunden vor dem Buchungszeitraum kostenfrei möglich. Bei Nichterscheinen ohne Stornierung kann die Buchungsberechtigung vorübergehend entzogen werden.</p>
            <p className="font-medium mb-1">§ 4 Haftung</p>
            <p className="mb-2">Jeder Nutzer haftet für von ihm verursachte Schäden an Geräten oder Einrichtungen. Die Universität übernimmt keine Haftung für mitgebrachte Gegenstände oder Datenträger.</p>
            <p className="font-medium mb-1">§ 5 Hausordnung</p>
            <p>Im Labor ist auf Sauberkeit und Ordnung zu achten. Speisen und Getränke sind nicht erlaubt. Nach der Nutzung sind alle Geräte ordnungsgemäß abzuschalten und der Arbeitsplatz zu reinigen.</p>
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Checkbox id="agb" checked={agbAccepted} onCheckedChange={setAgbAccepted} />
            <label htmlFor="agb" className="text-sm cursor-pointer">Ich habe die AGB gelesen und akzeptiere sie.</label>
          </div>
        </div>

        {/* DSGVO */}
        <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-semibold">Datenschutzerklärung (DSGVO)</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Im Rahmen der Nutzung des Folkwang Fotolabors werden personenbezogene Daten (Name, E-Mail-Adresse, Matrikelnummer, Adresse) erhoben und verarbeitet. Die Daten werden ausschließlich zur Verwaltung von Buchungen und Nutzerzugängen verwendet und nicht an Dritte weitergegeben. Die Speicherung erfolgt auf sicheren Servern innerhalb der EU. Du hast jederzeit das Recht auf Auskunft, Berichtigung und Löschung deiner Daten gemäß Art. 15–17 DSGVO. Kontakt: fotolabor@folkwang-uni.de
          </p>
          <div className="flex items-center gap-2">
            <Checkbox id="dsgvo" checked={dsgvoAccepted} onCheckedChange={setDsgvoAccepted} />
            <label htmlFor="dsgvo" className="text-sm cursor-pointer">Ich stimme der Verarbeitung meiner Daten gemäß der Datenschutzerklärung zu.</label>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || !isComplete} className="w-full">
          {saving ? "Wird gespeichert..." : "Profil speichern & fortfahren"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}