import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../hooks/useCurrentUser";
import CompleteProfileDialog from "./CompleteProfileDialog";
import Footer from "./Footer";
import {
  LayoutDashboard, Package, Receipt, Menu, Users, UserCircle,
  TrendingUp, LogOut, Shield, GraduationCap, Mail, CalendarRange,
  FolderDown, Wrench, BookOpen, X, ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";

const navGroups = [
  {
    label: null,
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ]
  },
  {
    label: "Labor",
    items: [
      { to: "/arbeitsplatzbuchung", label: "Arbeitsplatzbuchung", icon: CalendarRange },
      { to: "/materials", label: "Materialkosten", icon: Package },
      { to: "/costs", label: "Abrechnung", icon: Receipt },
    ]
  },
  {
    label: "Veranstaltungen",
    items: [
      { to: "/events", label: "Kurse & Events", icon: GraduationCap },
    ]
  },
  {
    label: "Ressourcen",
    items: [
      { to: "/downloads", label: "Downloads", icon: FolderDown },
    ]
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { to: "/admin", label: "Nutzerverwaltung", icon: Users },
      { to: "/groups", label: "Gruppen & Zugang", icon: Shield },
      { to: "/auswertung", label: "Auswertung", icon: TrendingUp },
      { to: "/contact", label: "Kontaktanfragen", icon: Mail },
      { to: "/wartung", label: "Wartung", icon: Wrench },
    ]
  },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, isAdmin } = useCurrentUser();

  const profileIncomplete = !loading && user && (!user.vorname || !user.nachname || !user.matrikelnummer);

  return (
    <div className="min-h-screen flex overflow-x-hidden bg-[#F5F5F7]">
      {profileIncomplete && <CompleteProfileDialog user={user} onCompleted={() => window.location.reload()} />}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed h-full z-30 apple-sidebar">
        <SidebarContent currentPath={location.pathname} isAdmin={isAdmin} />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full apple-sidebar flex flex-col shadow-2xl">
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileOpen(false)} className="apple-btn apple-btn-ghost p-2">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <SidebarContent currentPath={location.pathname} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 apple-glass-subtle border-b border-black/5">
          <button
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white shadow-sm border border-black/06 text-gray-600 apple-transition hover:bg-gray-50"
          >
            <Menu className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </button>
          <span className="font-bold text-sm tracking-tight flex-1" style={{ color: '#1a1a1a' }}>
            Folkwang <span style={{ color: 'var(--apple-orange)' }}>Fotolabor</span>
          </span>
          <UserMenu user={user} />
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex sticky top-0 z-20 items-center justify-end px-8 py-3 apple-glass-subtle border-b border-black/5">
          <UserMenu user={user} />
        </header>

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);

  const name = user?.vorname || user?.nachname
    ? `${user.vorname || ''} ${user.nachname || ''}`.trim()
    : user?.full_name || user?.email || 'Profil';

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold apple-transition"
        style={{ background: 'var(--apple-orange)', boxShadow: '0 2px 8px rgba(255,161,0,0.35)' }}
        title={name}
      >
        {initials || <UserCircle className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-11 z-50 w-56 rounded-2xl overflow-hidden"
            style={{ background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.07)' }}
          >
            <div className="px-4 py-3 border-b border-black/06">
              <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
              {user?.email && <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>}
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { to: "/profile", icon: UserCircle, label: "Mein Profil" },
                { to: "/my-bookings", icon: BookOpen, label: "Meine Buchungen" },
                { to: "/contact", icon: Mail, label: "Kontakt" },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 font-medium apple-transition hover:bg-gray-50 group"
                >
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="border-t border-black/06 p-2">
              <button
                onClick={() => { setOpen(false); base44.auth.logout(); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium w-full text-left text-red-500 apple-transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SidebarContent({ currentPath, isAdmin, onNavigate }) {
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    base44.entities.ContactMessage.filter({ read: false }).then(msgs => {
      setUnreadMessages(msgs.length);
    });
    const unsubscribe = base44.entities.ContactMessage.subscribe(() => {
      base44.entities.ContactMessage.filter({ read: false }).then(msgs => {
        setUnreadMessages(msgs.length);
      });
    });
    return unsubscribe;
  }, [isAdmin]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-sm"
            style={{ background: 'var(--apple-orange)' }}
          >
            F
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight tracking-tight">Fotolabor</p>
            <p className="text-xs font-medium" style={{ color: 'var(--apple-orange)' }}>Folkwang</p>
          </div>
        </div>
      </div>

      <div className="apple-divider mx-4 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        {navGroups
          .filter(g => !g.adminOnly || isAdmin)
          .map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="apple-sidebar-section">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => {
                   const isActive = currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to));
                   const hasUnread = to === '/contact' && unreadMessages > 0;
                   return (
                     <Link
                       key={to}
                       to={to}
                       onClick={onNavigate}
                       className={`apple-nav-item ${isActive ? 'active' : ''}`}
                     >
                       <span
                         className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 relative"
                         style={{
                           background: isActive ? 'var(--apple-orange-mid)' : 'rgba(0,0,0,0.05)',
                         }}
                       >
                         <Icon
                           style={{
                             width: 14,
                             height: 14,
                             color: isActive ? 'var(--apple-orange)' : '#888'
                           }}
                         />
                         {hasUnread && (
                           <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                             {unreadMessages > 9 ? '9+' : unreadMessages}
                           </span>
                         )}
                       </span>
                       <span className="flex-1 truncate">{label}</span>
                     </Link>
                   );
                })}
              </div>
            </div>
          ))}
      </nav>

      <div className="apple-divider mx-4 mt-2 mb-3" />
      <div className="px-3 pb-5 text-xs text-gray-400 font-medium tracking-tight text-center">
        © 2025 Folkwang
      </div>
    </div>
  );
}