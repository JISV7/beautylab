import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ExplorePage } from './pages/ExplorePage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

type Page = 'home' | 'dashboard' | 'admin' | 'explore' | 'course-details';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const saved = localStorage.getItem('currentPage') as Page;
    console.log('[App] Initial currentPage from localStorage:', saved);
    return saved || 'home';
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const handleNavigateToDashboard = () => {
    console.log('[App] Navigating to dashboard');
    setCurrentPage('dashboard');
  };

  const handleNavigateToAdmin = () => {
    console.log('[App] Navigating to admin');
    setCurrentPage('admin');
  };

  const handleNavigateToExplore = () => {
    console.log('[App] Navigating to explore');
    setCurrentPage('explore');
  };

  const handleViewCourse = (courseId: string) => {
    console.log('[App] Viewing course:', courseId);
    setSelectedCourseId(courseId);
    setCurrentPage('course-details');
  };

  const handleBackToExplore = () => {
    console.log('[App] Back to explore');
    setSelectedCourseId(null);
    setCurrentPage('explore');
  };

  const handleLogout = () => {
    console.log('[App] Logging out, redirecting to home');
    setSelectedCourseId(null);
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
        {currentPage === 'course-details' && selectedCourseId ? (
          <CourseDetailsPage courseId={selectedCourseId} onBack={handleBackToExplore} />
        ) : currentPage === 'explore' ? (
          <ExplorePage onViewCourse={handleViewCourse} />
        ) : currentPage === 'dashboard' ? (
          <Dashboard onNavigateToAdmin={handleNavigateToAdmin} onLogout={handleLogout} />
        ) : currentPage === 'admin' ? (
          <AdminDashboard onNavigateToDashboard={handleNavigateToDashboard} onLogout={handleLogout} />
        ) : (
          <Home
            onNavigateToDashboard={handleNavigateToDashboard}
            onNavigateToAdmin={handleNavigateToAdmin}
            onNavigateToExplore={handleNavigateToExplore}
            onLogout={handleLogout}
          />
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

