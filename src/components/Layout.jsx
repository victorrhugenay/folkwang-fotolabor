import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import CompleteProfileDialog from "./CompleteProfileDialog";
import Footer from "./Footer";
import { LayoutDashboard, CalendarDays, Building2, Package, Receipt, Menu, Users, UserCircle, TrendingUp, LogOut, Shield, GraduationCap, Mail, CalendarRange } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workspaces", label: "Arbeitsplätze", icon: Building2 },
  { to: "/bookings", label: "Buchungen", icon: CalendarDays },
  { to: "/materials", label: "Materialien", icon: Package, adminOnly: true },
  { to: "/costs", label: "Abrechnung", icon: Receipt },
  { to: "/admin", label: "Nutzerverwaltung", icon: Users, adminOnly: true },
  { to: "/groups", label: "Gruppen & Zugang", icon: Shield, adminOnly: true },
  { to: "/auswertung", label: "Auswertung", icon: TrendingUp, adminOnly: true },
  { to: "/calendar", label: "Belegungskalender", icon: CalendarRange },
  { to: "/events", label: "Kurse & Events", icon: GraduationCap },
  { to: "/contact", label: "Kontakt", icon: Mail },
  { to: "/profile", label: "Mein Profil", icon: UserCircle },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useCurrentUser();

  const profileIncomplete = !loading && user && (!user.vorname || !user.nachname || !user.matrikelnummer);

  return (
    <div className="min-h-screen flex bg-background">
      {profileIncomplete && <CompleteProfileDialog user={user} onCompleted={() => window.location.reload()} />}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card fixed h-full z-30">
        <SidebarContent currentPath={location.pathname} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full bg-card shadow-2xl">
            <SidebarContent currentPath={location.pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg tracking-tight">Folkwang Fotolabor</span>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ currentPath, onNavigate }) {
  const { isAdmin } = useCurrentUser();

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          Folkwang<br />Fotolabor
        </h1>

      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to || (to !== "/dashboard" && currentPath.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => { base44.auth.logout(); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>
    </div>
  );
}