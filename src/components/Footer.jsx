import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer dir='rtl' className='mt-auto bg-sky-500 text-white'>
      <div className='max-w-7xl mx-auto px-4 py-10'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
          <div>
            <h3 className='text-xl font-bold mb-4'>AHHio</h3>
            <p className='text-white text-sm'>
              أول منصة متعددة التجار في السودان. اشتري من أفضل التجار من مكان واحد.
            </p>
          </div>

          <div>
            <h3 className='font-bold mb-4'>روابط سريعة</h3>
            <ul className='space-y-2 text-white text-sm'>
              <li><Link to='/' className='hover:text-white'>الرئيسية</Link></li>
              <li><Link to='/vendor/login' className='hover:text-white'>دخول التجار</Link></li>
              <li><Link to='/shop' className='hover:text-white'>المتجر</Link></li>
              <li><Link to='/plans' className='hover:text-white'>الخطط</Link></li>
              <li><Link to='/cart' className='hover:text-white'>السلة</Link></li>
              <li><Link to='/login' className='hover:text-white'>تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold mb-4'>تواصل معنا</h3>
            <ul className='space-y-4 text-white text-sm'>
              <li className='flex items-center gap-2 text-white'><span>📞</span><span>249910070934</span></li>
              <li className='flex items-center gap-2 text-white'><span>✉️</span><span>support@ahhio.com</span></li>
            </ul>

            <div className='flex gap-4 mt-4 text-sm text-white'>
              <a href='#' className='text-white'>فيسبوك</a>
              <a href='#' className='text-white'>إنستغرام</a>
              <a href='https://wa.me/249910070934' className='text-white'>واتساب</a>
            </div>
          </div>
        </div>

        <div className='border-t border-white mt-8 pt-6 text-center text-white text-sm'>
          <p>©2026 AHHio. جميع الحقوق محفوظة</p>
          <p className='mt-1'>صنع في السودان</p>
        </div>
      </div>
    </footer>
  );
}