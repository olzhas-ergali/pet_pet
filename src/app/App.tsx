import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { useAuthStore } from '@/store/authStore';
import { ThemeSync } from './components/ThemeSync';
import { AppErrorBoundary } from './components/AppErrorBoundary';

function AppBootstrap() {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);
  return null;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ThemeSync />
      <AppBootstrap />
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AppErrorBoundary>
  );
}
