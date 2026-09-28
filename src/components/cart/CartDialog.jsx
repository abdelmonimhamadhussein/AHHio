import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function CartDialog({ onClose }) {
  const { items, removeFromCart, clearCart } = useCart();

  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0,
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">سلة المشتريات</h2>
          <button onClick={onClose} className="text-gray-500">إغلاق</button>
        </div>

        {items.length === 0 ? (
          <p className="text-center py-8 text-gray-500">السلة فاضية</p>
        ) : (
          <>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-gray-500">الكمية: {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{Number(item.price || 0) * Number(item.qty || 1)} جنيه</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-sm">حذف</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between font-bold text-lg">
              <span>الإجمالي</span>
              <span>{total} جنيه</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Link to="/checkout" onClick={onClose} className="flex-1 bg-black text-white text-center py-2 rounded-lg">
                متابعة الشراء
              </Link>
              <button onClick={clearCart} className="px-4 py-2 border rounded-lg">افراغ السلة</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
