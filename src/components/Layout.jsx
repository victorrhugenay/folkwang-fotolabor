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
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar fixed h-full z-30">
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
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm tracking-widest uppercase text-sidebar-foreground">Folkwang <span className="text-primary">Fotolabor</span></span>
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
      <div className="px-6 py-7 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-1 bg-primary shrink-0" />
          <h1 className="text-lg font-bold tracking-widest text-sidebar-foreground uppercase">
            Folkwang<br /><span className="font-light text-primary/90">Fotolabor</span>
          </h1>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to || (to !== "/dashboard" && currentPath.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-all duration-150 group ${
                isActive
                  ? "bg-primary text-black font-semibold"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="tracking-wide">{label}</span>
              {isActive && <div className="ml-auto w-1 h-4 bg-black/20 rounded-full" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={() => { base44.auth.logout(); }}
          className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium w-full text-sidebar-foreground/50 hover:text-red-400 hover:bg-sidebar-accent transition-all duration-150"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="tracking-wide">Abmelden</span>
        </button>
      </div>
    </div>
  );
}