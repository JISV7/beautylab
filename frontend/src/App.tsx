import { useState } from 'react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

type Page = 'home' | 'dashboard' | 'admin';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateToAdmin = () => {
    setCurrentPage('admin');
  };

  // If on dashboard or admin, don't show Home page
  if (currentPage === 'dashboard') {
    return (
      <ThemeProvider>
        <AuthProvider>
          <Dashboard onNavigateToAdmin={handleNavigateToAdmin} />
        </AuthProvider>
      </ThemeProvider>
    );
  }

  if (currentPage === 'admin') {
    return (
      <ThemeProvider>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </ThemeProvider>
    );
  }

  // Home page with login that redirects to dashboard
  return (
    <ThemeProvider>
      <AuthProvider>
        <Home
          onNavigateToDashboard={handleNavigateToDashboard}
          onNavigateToAdmin={handleNavigateToAdmin}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

