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
    <nav dir='rtl' className='sticky top-0 z-50 border-b border-sky-200 bg-sky-500 shadow-md shadow-sky-200/60'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5'>
        <Link to='/' className='text-2xl font-bold text-white'>AHHio</Link>

        <div className='hidden gap-6 md:flex'>
          <Link to='/' className='text-sm font-medium text-sky-50 transition hover:text-white'>الرئيسية</Link>
          <Link to='/shop' className='text-sm font-medium text-sky-50 transition hover:text-white'>المتجر</Link>
          <Link to='/plans' className='text-sm font-medium text-sky-50 transition hover:text-white'>الباقات</Link>
          <Link to='/vendor/register' className='text-sm font-medium text-emerald-100 transition hover:text-white'>بيع معنا</Link>
        </div>

        <div className='flex items-center gap-4'>
          <Link to='/cart' className='relative text-white'>
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className='absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white'>
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className='flex items-center gap-2'>
              {isVendor && (
                <Link to='/vendor/dashboard' className='flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white'>
                  <LayoutDashboard size={16} /> لوحتي
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link to='/admin/dashboard' className='flex items-center gap-1 rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white'>
                  <Store size={16} /> الادمن
                </Link>
              )}

              <button type='button' onClick={handleSignOut} className='flex items-center gap-1 rounded border border-white/30 px-2 py-1 text-sm text-white'>
                <LogOut size={18} /> خروج
              </button>
            </div>
          ) : (
            <div className='flex gap-2'>
              <Link to='/Login' className='rounded border border-white/40 px-3 py-1.5 text-sm font-medium text-white'>دخول</Link>
              <Link to='/Register' className='rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white'>تسجيل</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}