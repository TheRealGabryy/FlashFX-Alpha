import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import UIDesignTool from './components/UIDesignTool';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/home');

  useEffect(() => {
    const guestMode = localStorage.getItem('guestMode');
    if (!guestMode) {
      localStorage.setItem('guestMode', 'true');
    }

    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/home');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleBackToHome = () => {
    window.location.hash = '/home';
  };

  const renderPage = () => {
    if (currentPath === '/home' || currentPath === '') {
      return <HomePage />;
    } else if (currentPath.startsWith('/editor')) {
      const params = new URLSearchParams(currentPath.split('?')[1] || '');
      const projectId = params.get('project');
      return <UIDesignTool onBackToMain={handleBackToHome} editorMode={true} projectId={projectId} />;
    }
    return <HomePage />;
  };

  return (
    <div className="h-screen overflow-hidden">
      <AuthProvider>
        {renderPage()}
      </AuthProvider>
    </div>
  );
}

export default App;