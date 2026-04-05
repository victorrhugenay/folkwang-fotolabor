export default function Datenschutz() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <h1 className="text-2xl font-bold">Datenschutzerklärung</h1>
      <p className="text-sm text-muted-foreground">Stand: April 2026 · gemäß DSGVO, BDSG und TMG</p>

      <section className="space-y-2">
        <h2 className="font-semibold">1. Verantwortlicher</h2>
        <p className="text-sm text-muted-foreground">Folkwang Universität der Künste, Klemensborn 39, 45239 Essen<br />E-Mail: fotolabor@folkwang-uni.de</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. Erhobene Daten</h2>
        <p className="text-sm text-muted-foreground">Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Name, Vorname</li>
          <li>E-Mail-Adresse</li>
          <li>Matrikelnummer</li>
          <li>Anschrift (Straße, Hausnummer, PLZ, Ort)</li>
          <li>Buchungs- und Nutzungsdaten</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. Zweck der Datenverarbeitung</h2>
        <p className="text-sm text-muted-foreground">Die Daten werden ausschließlich zur Verwaltung von Nutzerzugängen, Buchungen, Materialverbrauch und Abrechnung innerhalb des Folkwang Fotolabors verwendet. Eine Weitergabe an Dritte erfolgt nicht.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">4. Rechtsgrundlage</h2>
        <p className="text-sm text-muted-foreground">Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Die Einwilligung kann jederzeit widerrufen werden.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">5. Speicherdauer</h2>
        <p className="text-sm text-muted-foreground">Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen (in der Regel max. 3 Jahre nach Ende der Nutzung).</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">6. Ihre Rechte</h2>
        <p className="text-sm text-muted-foreground">Sie haben gemäß DSGVO folgende Rechte:</p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
          <li>Recht auf Löschung (Art. 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
        </ul>
        <p className="text-sm text-muted-foreground">Zur Ausübung Ihrer Rechte wenden Sie sich an: fotolabor@folkwang-uni.de</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">7. Beschwerderecht</h2>
        <p className="text-sm text-muted-foreground">Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Postfach 20 04 44, 40102 Düsseldorf.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">8. Datensicherheit</h2>
        <p className="text-sm text-muted-foreground">Alle Daten werden verschlüsselt übertragen (TLS/SSL) und auf sicheren Servern innerhalb der EU gespeichert. Zugriff haben nur autorisierte Personen.</p>
      </section>
    </div>
  );
}