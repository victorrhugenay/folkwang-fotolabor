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
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: 'var(--nm-bg)' }}>
      {profileIncomplete && <CompleteProfileDialog user={user} onCompleted={() => window.location.reload()} />}
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed h-full z-30" style={{ background: 'var(--nm-bg)', boxShadow: '4px 0 20px rgba(0,0,0,0.06)' }}>
        <SidebarContent currentPath={location.pathname} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full shadow-2xl" style={{ background: 'var(--nm-bg)' }}>
            <SidebarContent currentPath={location.pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'var(--nm-bg)', borderColor: 'var(--nm-shadow-dark)' }}>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm tracking-widest uppercase flex-1" style={{ color: '#404040' }}>Folkwang <span style={{ color: 'var(--nm-orange)' }}>Fotolabor</span></span>
          <UserMenu />
        </header>

        {/* Desktop top header */}
        <header className="hidden lg:flex sticky top-0 z-20 items-center justify-end px-8 py-3 border-b" style={{ background: 'var(--nm-bg)', borderColor: 'var(--nm-shadow-dark)' }}>
          <UserMenu />
        </header>
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
        className="nm-btn flex items-center justify-center h-9 w-9"
        style={{ borderRadius: '50%' }}
        title="Profil"
      >
        <UserCircle className="h-5 w-5" style={{ color: '#FFA100' }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-52 nm-card-lg py-2" style={{ border: 'none' }}>
            <div className="px-4 py-2.5 mb-1" style={{ borderBottom: '1px solid var(--nm-shadow-dark)' }}>
              <p className="text-xs font-semibold truncate" style={{ color: '#404040' }}>{user?.vorname || user?.nachname ? `${user.vorname || ''} ${user.nachname || ''}`.trim() : user?.full_name || user?.email || 'Profil'}</p>
            </div>
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg mx-1 hover:bg-white/40">
              <UserCircle className="h-4 w-4" style={{ color: '#FFA100' }} /> Mein Profil
            </Link>
            <Link to="/my-bookings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg mx-1 hover:bg-white/40">
              <BookOpen className="h-4 w-4" style={{ color: '#FFA100' }} /> Meine Buchungen
            </Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-lg mx-1 hover:bg-white/40">
              <Mail className="h-4 w-4" style={{ color: '#FFA100' }} /> Kontakt
            </Link>
            <div className="my-1" style={{ borderTop: '1px solid var(--nm-shadow-dark)' }} />
            <button
              onClick={() => { setOpen(false); base44.auth.logout(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left transition-colors rounded-lg mx-1 hover:bg-white/40 text-red-500"
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
      <div className="px-6 py-7" style={{ borderBottom: '1px solid var(--nm-shadow-dark)' }}>
        <div className="nm-card p-3 inline-flex items-center gap-3">
          <div className="nm-icon h-9 w-9" style={{ borderRadius: '10px' }}>
            <span style={{ color: 'var(--nm-orange)', fontWeight: 700, fontSize: 16 }}>F</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: '#303030' }}>Fotolabor</p>
            <p className="text-xs" style={{ color: 'var(--nm-orange)' }}>Folkwang</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 ${
                isActive ? 'nm-nav-active' : 'hover:bg-white/30 rounded-xl'
              }`}
              style={isActive ? {} : { color: '#666', borderRadius: '10px' }}
            >
              <span className={`nm-icon h-7 w-7 shrink-0`} style={{ borderRadius: '8px' }}>
                <Icon className="h-3.5 w-3.5" style={{ color: isActive ? 'var(--nm-orange)' : '#888' }} />
              </span>
              <span className="tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--nm-shadow-dark)' }} />
    </div>
  );
}