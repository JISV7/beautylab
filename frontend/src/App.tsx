import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

type Page = 'home' | 'dashboard' | 'admin';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const saved = localStorage.getItem('currentPage') as Page;
    console.log('[App] Initial currentPage from localStorage:', saved);
    return saved || 'home';
  });

  const handleNavigateToDashboard = () => {
    console.log('[App] Navigating to dashboard');
    setCurrentPage('dashboard');
  };

  const handleNavigateToAdmin = () => {
    console.log('[App] Navigating to admin');
    setCurrentPage('admin');
  };

  const handleLogout = () => {
    console.log('[App] Logging out, redirecting to home');
    setCurrentPage('home');
  };

  // Persist page state to localStorage
  useEffect(() => {
    console.log('[App] Saving currentPage to localStorage:', currentPage);
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  return (
    <ThemeProvider>
      <AuthProvider>
        {currentPage === 'dashboard' ? (
          <Dashboard onNavigateToAdmin={handleNavigateToAdmin} onLogout={handleLogout} />
        ) : currentPage === 'admin' ? (
          <AdminDashboard onNavigateToDashboard={handleNavigateToDashboard} onLogout={handleLogout} />
        ) : (
          <Home
            onNavigateToDashboard={handleNavigateToDashboard}
            onNavigateToAdmin={handleNavigateToAdmin}
            onLogout={handleLogout}
          />
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

