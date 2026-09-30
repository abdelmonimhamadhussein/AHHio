import { lazy, Suspense } from 'react';
import { useDialog } from '../context/DialogContext.jsx';

const ProductDetails = lazy(() => import('../product/ProductDetails.jsx'));
const CartDialog = lazy(() => import('../cart/CartDialog.jsx').then((module) => ({ default: module.CartDialog })));
const AuthDialog = lazy(() => import('../auth/AuthDialog.jsx').then((module) => ({ default: module.AuthDialog })));
const Checkout = lazy(() => import('../../Pages/Checkout.jsx'));

export function DialogManager() {
  const { open, type, closeDialog } = useDialog();

  return (
    <Suspense fallback={null}>
      <>
        {open && type === 'cart' && <CartDialog onClose={() => closeDialog()} />}
        {open && type === 'Auth' && <AuthDialog onClose={() => closeDialog()} />}
        {open && type === 'checkout' && <Checkout />}
        {open && type === 'product' && <ProductDetails />}
      </>
    </Suspense>
  );
}

