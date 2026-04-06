import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import CompleteProfileDialog from "./CompleteProfileDialog";
import Footer from "./Footer";
import { LayoutDashboard, Package, Receipt, Menu, Users, UserCircle, TrendingUp, LogOut, Shield, GraduationCap, Mail, CalendarRange, FolderDown, Wrench, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/arbeitsplatzbuchung", label: "Arbeitsplatzbuchung", icon: CalendarRange },
  { to: "/materials", label: "Materialkosten", icon: Package },
  { to: "/costs", label: "Abrechnung", icon: Receipt },
  { to: "/admin", label: "Nutzerverwaltung", icon: Users, adminOnly: true },
  { to: "/groups", label: "Gruppen & Zugang", icon: Shield, adminOnly: true },
  { to: "/auswertung", label: "Auswertung", icon: TrendingUp, adminOnly: true },
  { to: "/wartung", label: "Wartung", icon: Wrench, adminOnly: true },
  { to: "/events", label: "Kurse & Events", icon: GraduationCap },
  { to: "/downloads", label: "Downloads", icon: FolderDown },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useCurrentUser();

  const profileIncomplete = !loading && user && (!user.vorname || !user.nachname || !user.matrikelnummer);

  return (
    <div className="min-h-screen flex bg-background overflow-x-hidden">
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
      <div className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm tracking-widest uppercase text-sidebar-foreground flex-1">Folkwang <span className="text-primary">Fotolabor</span></span>
          <UserMenu />
        </header>

        {/* Desktop top header - removed UserMenu, now in sidebar */}
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-center h-9 w-9 rounded-full bg-accent hover:bg-accent/80 transition-colors border border-border"
        title="Profil"
      >
        <UserCircle className="h-5 w-5 text-accent-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-48 bg-popover border border-border shadow-lg py-1">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold truncate">{user?.vorname || user?.nachname ? `${user.vorname || ""} ${user.nachname || ""}`.trim() : user?.full_name || user?.email || "Profil"}</p>
            </div>
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
              <UserCircle className="h-4 w-4" /> Mein Profil
            </Link>
            <Link to="/my-bookings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
              <BookOpen className="h-4 w-4" /> Meine Buchungen
            </Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
              <Mail className="h-4 w-4" /> Kontakt
            </Link>
            <div className="border-t border-border mt-1" />
            <button
              onClick={() => { setOpen(false); base44.auth.logout(); }}
              className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left hover:bg-muted text-destructive hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Abmelden
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SidebarContent({ currentPath, onNavigate }) {
  const { isAdmin } = useCurrentUser();

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-start gap-3">
          <div>
            <p className="text-base font-bold tracking-tight leading-tight">Fotolabor</p>
          </div>
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
              className={`flex items-center gap-3 px-3 py-2 text-sm transition-all duration-150 group border-l-2 ${
                isActive
                  ? "border-foreground bg-muted font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <UserMenu />
      </div>
    </div>
  );
}