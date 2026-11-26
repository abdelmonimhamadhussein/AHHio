import { Link } from "react-router-dom";
import { formatCurrency } from "../lib/currency";
import { readLastOrder } from "../lib/lastOrder";

export default function OrdersPage() {
  const lastOrder = readLastOrder();
  const orders = lastOrder?.orders || [];

  return (
    <main dir="rtl" className="mx-auto min-h-screen max-w-3xl px-4 py-8 text-black">
      <h1 className="mb-6 text-3xl font-black">طلباتي</h1>
      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-8 text-center">
          <p className="mb-5 text-gray-600">لا توجد طلبات محفوظة على هذا الجهاز.</p>
          <Link to="/shop" className="inline-block rounded-lg bg-sky-500 px-5 py-3 font-bold text-white hover:bg-sky-600">
            تصفح المتجر
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold">طلب #{order.id}</h2>
                <span className="text-sm text-gray-600">{order.store_name || "المتجر"}</span>
              </div>
              <div className="mt-4 space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span>{item.name} × {item.qty}</span>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t pt-3 font-bold">الإجمالي: {formatCurrency(order.total)}</p>
            </article>
          ))}
          <Link to="/shop" className="inline-block rounded-lg border border-gray-300 px-5 py-3 font-bold">
            متابعة التسوق
          </Link>
        </div>
      )}
    </main>
  );
}
