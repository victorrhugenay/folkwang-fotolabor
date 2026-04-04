import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Mail, Send, CheckCircle } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Bitte alle Pflichtfelder ausfüllen.", variant: "destructive" });
      return;
    }
    setSending(true);
    await base44.entities.ContactMessage.create({ ...form, read: false });
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <div>
          <h2 className="text-xl font-bold">Nachricht gesendet!</h2>
          <p className="text-muted-foreground mt-1">Wir melden uns so schnell wie möglich bei dir.</p>
        </div>
        <Button variant="outline" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
          Neue Nachricht
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kontakt</h1>
          <p className="text-muted-foreground mt-0.5">Schreib uns eine Nachricht</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={set("name")} placeholder="Dein Name" />
          </div>
          <div>
            <Label>E-Mail *</Label>
            <Input type="email" value={form.email} onChange={set("email")} placeholder="deine@email.de" />
          </div>
        </div>
        <div>
          <Label>Betreff</Label>
          <Input value={form.subject} onChange={set("subject")} placeholder="Worum geht es?" />
        </div>
        <div>
          <Label>Nachricht *</Label>
          <Textarea value={form.message} onChange={set("message")} placeholder="Deine Nachricht..." className="min-h-[120px]" />
        </div>
        <Button onClick={handleSubmit} disabled={sending} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          {sending ? "Wird gesendet..." : "Nachricht senden"}
        </Button>
      </div>
    </div>
  );
}