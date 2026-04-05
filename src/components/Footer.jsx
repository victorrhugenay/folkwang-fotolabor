import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border py-6 text-center text-xs text-muted-foreground space-y-2">
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        <Link to="/agb" className="hover:text-foreground transition-colors">AGB</Link>
        <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutzerklärung</Link>
        <Link to="/barrierefreiheit" className="hover:text-foreground transition-colors">Barrierefreiheit</Link>
      </div>
      <p>© {new Date().getFullYear()} Folkwang Universität der Künste – Folkwang Fotolabor</p>
    </footer>
  );
}