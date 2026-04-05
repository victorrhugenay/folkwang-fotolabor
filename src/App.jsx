import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Workspaces from './pages/Workspaces';
import Bookings from './pages/Bookings';
import Materials from './pages/Materials';
import Costs from './pages/Costs';
import Admin from './pages/Admin';
import Auswertung from './pages/Auswertung';
import Groups from './pages/Groups';
import Profile from './pages/Profile';
import Events from './pages/Events';
import Contact from './pages/Contact';
import BookingCalendar from './pages/BookingCalendar';
import Impressum from './pages/Impressum';
import AGBPage from './pages/AGBPage';
import Datenschutz from './pages/Datenschutz';
import Barrierefreiheit from './pages/Barrierefreiheit';
import MyBookings from './pages/MyBookings';
import Downloads from './pages/Downloads';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/auswertung" element={<Auswertung />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/events" element={<Events />} />
        <Route path="/calendar" element={<BookingCalendar />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/agb" element={<AGBPage />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/barrierefreiheit" element={<Barrierefreiheit />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App