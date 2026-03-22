import { createBrowserRouter } from 'react-router';
import { ProtectedLayout } from './layout/ProtectedLayout';
import { Auth } from './pages/Auth';
import { HomeNew } from './pages/HomeNew';
import { Catalog } from './pages/Catalog';
import { ProductDetailNew } from './pages/ProductDetailNew';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { Supplier } from './pages/Supplier';
import { Admin } from './pages/Admin';

export const router = createBrowserRouter([
  { path: '/auth', Component: Auth },
  {
    Component: ProtectedLayout,
    children: [
      { path: '/', Component: HomeNew },
      { path: '/catalog', Component: Catalog },
      { path: '/product/:id', Component: ProductDetailNew },
      { path: '/cart', Component: Cart },
      { path: '/checkout', Component: Checkout },
      { path: '/order-success', Component: OrderSuccess },
      { path: '/profile', Component: Profile },
      { path: '/supplier', Component: Supplier },
      { path: '/admin', Component: Admin },
    ],
  },
]);
