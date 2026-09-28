import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer dir='rtl' className='mt-10 bg-sky-600 text-white'>
      <div className='max-w-7xl mx-auto px-4 py-10'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
          <div>
            <h3 className='text-xl font-bold mb-4'>AHHio</h3>
            <p className='text-gray-200 text-sm'>
              أول منصة متعددة التجار في السودان. اشتري من أفضل التجار من مكان واحد.
            </p>
          </div>

          <div>
            <h3 className='font-bold mb-4'>روابط سريعة</h3>
            <ul className='space-y-2 text-gray-200 text-sm'>
              <li><Link to='/' className='hover:text-white'>الرئيسية</Link></li>
              <li><Link to='/vendor/register' className='hover:text-white'>كن تاجر معنا</Link></li>
              <li><Link to='/cart' className='hover:text-white'>السلة</Link></li>
              <li><Link to='/login' className='hover:text-white'>تسجيل الدخول</Link></li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold mb-4'>تواصل معنا</h3>
            <ul className='space-y-4 text-gray-200 text-sm'>
              <li className='flex items-center gap-2'><span>📞</span><span>249910070934</span></li>
              <li className='flex items-center gap-2'><span>✉️</span><span>support@ahhio.com</span></li>
            </ul>

            <div className='flex gap-4 mt-4 text-sm'>
              <a href='#' className='hover:text-blue-200'>فيسبوك</a>
              <a href='#' className='hover:text-pink-200'>إنستغرام</a>
              <a href='https://wa.me/249910070934' className='hover:text-green-200'>واتساب</a>
            </div>
          </div>
        </div>

        <div className='border-t border-gray-300 mt-8 pt-6 text-center text-gray-200 text-sm'>
          <p>©2026 AHHio. جميع الحقوق محفوظة</p>
          <p className='mt-1'>صنع في السودان</p>
        </div>
      </div>
    </footer>
  );
}