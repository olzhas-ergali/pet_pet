import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { useAuthStore } from '@/store/authStore';
import { usePricesRealtime } from '@/hooks/usePricesRealtime';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';

function AppBootstrap() {
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);
  usePricesRealtime();
  useOrdersRealtime();
  return null;
}

export default function App() {
  return (
    <>
      <AppBootstrap />
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}
