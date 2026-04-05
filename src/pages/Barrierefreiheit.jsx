export default function Barrierefreiheit() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <h1 className="text-2xl font-bold">Erklärung zur Barrierefreiheit</h1>
      <p className="text-sm text-muted-foreground">gemäß § 12a BGG (Behindertengleichstellungsgesetz) · Stand: April 2026</p>

      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Die Folkwang Universität der Künste ist bemüht, ihre digitalen Angebote im Einklang mit den Bestimmungen des Behindertengleichstellungsgesetzes NRW (BGG NRW) sowie der Barrierefreie-Informationstechnik-Verordnung NRW (BITV 2.0) barrierefrei zugänglich zu machen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Stand der Vereinbarkeit</h2>
        <p className="text-sm text-muted-foreground">Diese Plattform ist teilweise mit den Anforderungen der BITV 2.0 vereinbar. Wir arbeiten kontinuierlich daran, die Barrierefreiheit zu verbessern.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Bekannte Einschränkungen</h2>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Einige Grafiken und Icons enthalten möglicherweise keine alternativen Texte</li>
          <li>Bestimmte Interaktionselemente sind ggf. nicht vollständig per Tastatur bedienbar</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Feedback & Kontakt</h2>
        <p className="text-sm text-muted-foreground">
          Wenn Sie Barrieren auf dieser Plattform feststellen oder Unterstützung benötigen, kontaktieren Sie uns bitte:<br />
          E-Mail: fotolabor@folkwang-uni.de<br />
          Telefon: +49 (0) 201 4903-0
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Schlichtungsverfahren</h2>
        <p className="text-sm text-muted-foreground">
          Wenn Sie auf Ihre Anfrage keine zufriedenstellende Antwort erhalten, können Sie sich an die Schlichtungsstelle gemäß § 16 BGG NRW wenden: Schlichtungsstelle nach dem BGG NRW, Ministerium für Arbeit, Gesundheit und Soziales NRW, Fürstenwall 25, 40219 Düsseldorf.
        </p>
      </section>
    </div>
  );
}