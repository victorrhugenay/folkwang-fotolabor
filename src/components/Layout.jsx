import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import CompleteProfileDialog from "./CompleteProfileDialog";
import Footer from "./Footer";
import { LayoutDashboard, Package, Receipt, Menu, Users, UserCircle, TrendingUp, LogOut, Shield, GraduationCap, Mail, CalendarRange, BookMarked, FolderDown, Wrench } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/arbeitsplatzbuchung", label: "Arbeitsplatzbuchung", icon: CalendarRange },
  { to: "/materials", label: "Materialien", icon: Package },
  { to: "/costs", label: "Abrechnung", icon: Receipt },
  { to: "/admin", label: "Nutzerverwaltung", icon: Users, adminOnly: true },
  { to: "/groups", label: "Gruppen & Zugang", icon: Shield, adminOnly: true },
  { to: "/auswertung", label: "Auswertung", icon: TrendingUp, adminOnly: true },
  { to: "/wartung", label: "Wartung", icon: Wrench, adminOnly: true },
  { to: "/my-bookings", label: "Meine Buchungen", icon: BookMarked },
  { to: "/events", label: "Kurse & Events", icon: GraduationCap },
  { to: "/downloads", label: "Downloads", icon: FolderDown },
  { to: "/contact", label: "Kontakt", icon: Mail },
  { to: "/profile", label: "Mein Profil", icon: UserCircle },
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