import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { VideoProvider } from './hooks/useVideos';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './hooks/useToast';
import { UserProvider } from './hooks/useUsers';
import { ProgressProvider } from './hooks/useProgress';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <UserProvider>
            <VideoProvider>
              <ProgressProvider>
                <App />
              </ProgressProvider>
            </VideoProvider>
          </UserProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);