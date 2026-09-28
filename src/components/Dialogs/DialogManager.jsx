import { useDialog } from '../context/DialogContext.jsx';
import ProductDetails from '../product/ProductDetails.jsx';
import { CartDialog } from '../cart/CartDialog.jsx';
import { AuthDialog } from '../auth/AuthDialog.jsx';
import Checkout from '../../Pages/Checkout.jsx';

export function DialogManager() {
  const { open, type, closeDialog } = useDialog();

  return (
    <>
      {open && type === 'cart' && <CartDialog onClose={() => closeDialog()} />}
      {open && type === 'Auth' && <AuthDialog onClose={() => closeDialog()} />}
      {open && type === 'checkout' && <Checkout />}
      {open && type === 'product' && <ProductDetails />}
    </>
  );
}

