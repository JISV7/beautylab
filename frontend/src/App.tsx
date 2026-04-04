import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ExplorePage } from './pages/ExplorePage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { CartPage } from './components/cart/CartPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Protected route — redirects to home if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Dashboard wrapper
const DashboardRoute = () => {
  const { logout: authLogout } = useAuth();

  const handleLogout = () => {
    authLogout();
    window.location.href = '/';
  };

  const handleNavigateToAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <Dashboard
      onNavigateToAdmin={handleNavigateToAdmin}
      onLogout={handleLogout}
    />
  );
};

// Admin route — requires admin/root role
const AdminRoute = () => {
  const { user, isAuthenticated, isLoading, logout: authLogout } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    authLogout();
    return <Navigate to="/" replace />;
  }

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('admin') || roles.includes('root');

  if (!isAdmin) {
    authLogout();
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    authLogout();
    window.location.href = '/';
  };

  const handleNavigateToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <AdminDashboard
      onNavigateToDashboard={handleNavigateToDashboard}
      onLogout={handleLogout}
    />
  );
};

// Cart wrapper
const CartPageWrapper = () => {
  const navigate = useNavigate();
  return <CartPage onBack={() => navigate('/explore')} />;
};

// Course detail — renders inside DashboardLayout when authenticated, standalone when not
const CourseDetailRoute = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Public: standalone page, no dashboard wrapper
    return (
      <CourseDetailsPage
        courseId={params.id || ''}
        onBack={() => navigate('/explore')}
        isAuthenticated={false}
      />
    );
  }

  // Authenticated: redirect to Dashboard with course-details tab
  navigate(`/dashboard?tab=course-details&courseId=${params.id}`, { replace: true });
  return null;
};

// Explore route — redirects authenticated users to dashboard
const ExploreRoute = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <ExplorePage />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<ExploreRoute />} />
              <Route path="/course/:id" element={<CourseDetailRoute />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardRoute />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminRoute />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <CartPageWrapper />
                </ProtectedRoute>
              } />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
