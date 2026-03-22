import { createBrowserRouter } from 'react-router';
import { PublicLayout } from './layout/PublicLayout';
import { ProtectedLayout } from './layout/ProtectedLayout';
import { Auth } from './pages/Auth';
import { Landing } from './pages/Landing';
import { HomeNew } from './pages/HomeNew';
import { Catalog } from './pages/Catalog';
import { ProductDetailNew } from './pages/ProductDetailNew';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { Supplier } from './pages/Supplier';
import { Admin } from './pages/Admin';
import { ProfilePersonal } from './pages/profile/ProfilePersonal';
import { ProfileAddresses } from './pages/profile/ProfileAddresses';
import { ProfilePayment } from './pages/profile/ProfilePayment';
import { ProfileNotifications } from './pages/profile/ProfileNotifications';

export const router = createBrowserRouter([
  {
    Component: PublicLayout,
    children: [
      { path: '/', Component: Landing },
      { path: '/auth', Component: Auth },
    ],
  },
  {
    Component: ProtectedLayout,
    children: [
      { path: '/market', Component: HomeNew },
      { path: '/catalog', Component: Catalog },
      { path: '/product/:id', Component: ProductDetailNew },
      { path: '/cart', Component: Cart },
      { path: '/checkout', Component: Checkout },
      { path: '/order-success', Component: OrderSuccess },
      { path: '/profile', Component: Profile },
      { path: '/profile/personal', Component: ProfilePersonal },
      { path: '/profile/addresses', Component: ProfileAddresses },
      { path: '/profile/payment', Component: ProfilePayment },
      { path: '/profile/notifications', Component: ProfileNotifications },
      { path: '/supplier', Component: Supplier },
      { path: '/admin', Component: Admin },
    ],
  },
]);
