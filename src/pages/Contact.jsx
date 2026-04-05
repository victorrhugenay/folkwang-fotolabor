import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Mail, Send, CheckCircle, Inbox, Trash2 } from "lucide-react";

function Contact() {
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

function AdminContactView() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ContactMessage.list("-created_date", 500).then(msgs => {
      setMessages(msgs);
      setLoading(false);
    });
  }, []);

  const markAsRead = async (id) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    await base44.entities.ContactMessage.update(id, { read: !msg.read });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: !m.read } : m));
  };

  const deleteMessage = async (id) => {
    await base44.entities.ContactMessage.delete(id);
    setMessages(prev => prev.filter(m => m.id !== id));
    toast({ title: "Nachricht gelöscht" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kontaktanfragen</h1>
          <p className="text-muted-foreground mt-0.5">{messages.length} Anfragen gesamt</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">E-Mail</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Betreff</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Nachricht</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {messages.map(msg => (
                <tr key={msg.id} className={`hover:bg-muted/30 transition-colors ${msg.read ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium">{msg.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{msg.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{msg.subject || "–"}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs truncate max-w-xs">{msg.message}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => markAsRead(msg.id)}
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full transition-colors ${
                        msg.read ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      {msg.read ? "Gelesen" : "Neu"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1 rounded hover:bg-red-100 text-destructive hover:text-red-700 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Keine Anfragen vorhanden</div>
        )}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const { isAdmin, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return isAdmin ? <AdminContactView /> : <Contact />;
}