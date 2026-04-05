export default function Impressum() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <h1 className="text-2xl font-bold">Impressum</h1>
      <p className="text-sm text-muted-foreground">Angaben gemäß § 5 TMG</p>

      <section className="space-y-1">
        <h2 className="font-semibold">Anbieter</h2>
        <p className="text-sm">Folkwang Universität der Künste</p>
        <p className="text-sm">Klemensborn 39</p>
        <p className="text-sm">45239 Essen</p>
      </section>

      <section className="space-y-1">
        <h2 className="font-semibold">Vertreten durch</h2>
        <p className="text-sm">Den Rektor der Folkwang Universität der Künste</p>
      </section>

      <section className="space-y-1">
        <h2 className="font-semibold">Kontakt</h2>
        <p className="text-sm">Telefon: +49 (0) 201 4903-0</p>
        <p className="text-sm">E-Mail: fotolabor@folkwang-uni.de</p>
        <p className="text-sm">Web: www.folkwang-uni.de</p>
      </section>

      <section className="space-y-1">
        <h2 className="font-semibold">Umsatzsteuer-ID</h2>
        <p className="text-sm">Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz: DE 122 083 673</p>
      </section>

      <section className="space-y-1">
        <h2 className="font-semibold">Aufsichtsbehörde</h2>
        <p className="text-sm">Ministerium für Kultur und Wissenschaft des Landes Nordrhein-Westfalen</p>
        <p className="text-sm">Völklinger Straße 49, 40221 Düsseldorf</p>
      </section>

      <section className="space-y-1">
        <h2 className="font-semibold">Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)</h2>
        <p className="text-sm">Folkwang Universität der Künste, Klemensborn 39, 45239 Essen</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Haftungsausschluss</h2>
        <p className="text-sm text-muted-foreground">
          Die Inhalte dieser Plattform wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf dieser Plattform nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </p>
      </section>
    </div>
  );
}