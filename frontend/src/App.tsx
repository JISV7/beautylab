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
    return saved || 'home';
  });

  const handleNavigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateToAdmin = () => {
    setCurrentPage('admin');
  };

  // Persist page state to localStorage
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  return (
    <ThemeProvider>
      <AuthProvider>
        {currentPage === 'dashboard' ? (
          <Dashboard onNavigateToAdmin={handleNavigateToAdmin} />
        ) : currentPage === 'admin' ? (
          <AdminDashboard />
        ) : (
          <Home
            onNavigateToDashboard={handleNavigateToDashboard}
            onNavigateToAdmin={handleNavigateToAdmin}
          />
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

