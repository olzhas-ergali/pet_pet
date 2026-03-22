import type { ComponentType } from 'react';
import { createElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { DEFAULT_ROUTE_LANG } from '@/i18n/langRouting';
import { LangLayout } from './layout/LangLayout';
import { PublicLayout } from './layout/PublicLayout';
import { ProtectedLayout } from './layout/ProtectedLayout';
import { RootRedirect } from './pages/RootRedirect';
import { WildcardLangRedirect } from './pages/WildcardLangRedirect';
import { Auth } from './pages/Auth';
import { Landing } from './pages/Landing';
import { RouteChunkFallback } from './components/RouteChunkFallback';

function lazyPage<T extends Record<string, ComponentType<object>>>(
  loader: () => Promise<T>,
  exportName: keyof T & string,
) {
  return (): Promise<{
    Component: ComponentType<object>;
    HydrateFallback: typeof RouteChunkFallback;
  }> =>
    loader().then((mod) => ({
      Component: mod[exportName],
      HydrateFallback: RouteChunkFallback,
    }));
}

export const router = createBrowserRouter([
  { path: '/', Component: RootRedirect },
  {
    path: '/auth',
    element: createElement(Navigate, {
      to: `/${DEFAULT_ROUTE_LANG}/auth`,
      replace: true,
    }),
  },
  {
    path: '/:lang',
    Component: LangLayout,
    children: [
      {
        Component: PublicLayout,
        children: [
          { index: true, Component: Landing },
          { path: 'auth', Component: Auth },
        ],
      },
      {
        Component: ProtectedLayout,
        children: [
          { path: 'market', lazy: lazyPage(() => import('./pages/HomeNew'), 'HomeNew') },
          { path: 'catalog', lazy: lazyPage(() => import('./pages/Catalog'), 'Catalog') },
          { path: 'product/:id', lazy: lazyPage(() => import('./pages/ProductDetailNew'), 'ProductDetailNew') },
          { path: 'cart', lazy: lazyPage(() => import('./pages/Cart'), 'Cart') },
          { path: 'checkout', lazy: lazyPage(() => import('./pages/Checkout'), 'Checkout') },
          { path: 'order-success', lazy: lazyPage(() => import('./pages/OrderSuccess'), 'OrderSuccess') },
          { path: 'profile', lazy: lazyPage(() => import('./pages/Profile'), 'Profile') },
          {
            path: 'profile/personal',
            lazy: lazyPage(() => import('./pages/profile/ProfilePersonal'), 'ProfilePersonal'),
          },
          {
            path: 'profile/addresses',
            lazy: lazyPage(() => import('./pages/profile/ProfileAddresses'), 'ProfileAddresses'),
          },
          {
            path: 'profile/payment',
            lazy: lazyPage(() => import('./pages/profile/ProfilePayment'), 'ProfilePayment'),
          },
          {
            path: 'profile/notifications',
            lazy: lazyPage(() => import('./pages/profile/ProfileNotifications'), 'ProfileNotifications'),
          },
          {
            path: 'profile/settings',
            lazy: lazyPage(() => import('./pages/profile/ProfileSettings'), 'ProfileSettings'),
          },
          { path: 'supplier', lazy: lazyPage(() => import('./pages/Supplier'), 'Supplier') },
          { path: 'admin', lazy: lazyPage(() => import('./pages/Admin'), 'Admin') },
        ],
      },
    ],
  },
  { path: '*', Component: WildcardLangRedirect },
]);
