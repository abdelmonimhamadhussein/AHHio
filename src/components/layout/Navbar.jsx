import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, LogOut, LayoutDashboard, Store } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const [vendor, setVendor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vendor') || 'null');
    } catch {
      return null;
    }
  });
  const totalItems = items.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const isVendor = user?.role === 'vendor' || user?.role === 'seller' || Boolean(vendor);

  const handleSignOut = async () => {
    localStorage.removeItem('vendor');
    setVendor(null);
    await signOut();
  };

  return (
    <nav dir='rtl' className='sticky top-0 z-50 border-b border-black bg-sky-500 text-white'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-2.5'>
        <Link to='/' className='text-2xl font-bold text-white'>AHHio</Link>

        <div className='order-3 flex w-full justify-center gap-4 text-xs sm:text-sm md:order-none md:w-auto md:gap-6'>
          <Link to='/' className='text-sm font-medium text-white'>الرئيسية</Link>
          <Link to='/shop' className='text-sm font-medium text-white'>المتجر</Link>
          <Link to='/plans' className='text-sm font-medium text-white'>الخطط</Link>
          <Link to='/vendor' className='text-sm font-medium text-white'>لوحة التاجر</Link>
        </div>

        <div className='flex items-center gap-4'>
          <Link to='/cart' aria-label='السلة' className='relative rounded-lg bg-sky-500 px-3 py-2 text-white'>
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className='absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-bold text-white'>
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className='flex items-center gap-2'>
              {isVendor && (
                  <Link to='/vendor' className='flex items-center gap-1 rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white'>
                  <LayoutDashboard size={16} /> لوحتي
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link to='/admin/dashboard' className='flex items-center gap-1 rounded bg-black px-3 py-1 text-sm font-medium text-white'>
                  <Store size={16} /> الادمن
                </Link>
              )}

              <button type='button' onClick={handleSignOut} className='flex items-center gap-1 rounded border border-white/30 px-2 py-1 text-sm text-white'>
                <LogOut size={18} /> خروج
              </button>
            </div>
          ) : (
            <div className='flex gap-2'>
              <Link to='/login' className='rounded border border-white px-3 py-1.5 text-sm font-medium text-white'>دخول</Link>
              <Link to='/register' className='rounded bg-sky-500 px-3 py-1.5 text-sm font-medium text-white'>سجل</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}