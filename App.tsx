import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { initDB } from './services/db';
import { ToastContainer } from './components/Toast';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await initDB();
      } catch (error) {
        console.error("Fatal: Could not initialize database.", error);
        // Optionally show a permanent error message to the user
      } finally {
        setIsDbLoading(false);
      }
    };
    initializeDatabase();
  }, []);

  if (authLoading || isDbLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
      </div>
    );
  }

  const renderApp = () => {
    if (!user) {
      return <LoginPage />;
    }
  
    if (user.type === 'student') {
      return <StudentDashboard />;
    }
  
    if (user.type === 'admin') {
      return <AdminDashboard />;
    }
  
    return <LoginPage />;
  }

  return (
    <>
      <ToastContainer />
      {renderApp()}
    </>
  );
};

export default App;
