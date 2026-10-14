import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, removeFromCart, clearCart } = useCart();

  const grouped = useMemo(
    () =>
      items.reduce((acc, item) => {
        const tenantId = item.tenant_id ?? item.vendor_id ?? null;
        const groupKey = tenantId ?? "unassigned";
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(item);
        return acc;
      }, {}),
    [items]
  );

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

  if (items.length === 0) {
    return (
      <div className="p-16 text-center text-black">
        <p className="text-2xl font-black text-black">السلة فارغة</p>
        <Link to="/shop" className="mt-4 inline-block rounded-lg bg-[#0EA5E9] px-5 py-3 font-bold text-white hover:bg-[#0284C7]">تصفح المنتجات</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-5xl px-4 py-8 text-black">
      <h1 className="mb-6 text-3xl font-black text-black">سلة المشتريات</h1>

      {Object.entries(grouped).map(([tenantId, list]) => {
        const subtotal = list.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
        return (
          <div key={tenantId} className="mb-5 rounded-lg border border-black bg-white p-4">
            <div className="mb-3 flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-lg font-black text-black">المتجر: {list[0]?.seller?.store_name || "متجر"}</h2>
              <span className="text-black">المجموع: {subtotal.toLocaleString()} SDG</span>
            </div>

            {list.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <img src={item.image_url || item.images?.[0] || "https://placehold.co/100x100/fff/000?text=AH"} alt={item.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div>
                    <div className="font-bold text-black">{item.name}</div>
                    <div className="text-sm text-black">الكمية: {item.qty}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-black">{(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString()} SDG</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-sm text-black">حذف</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="mt-6 rounded-lg border border-black bg-white p-5">
        <div className="flex items-center justify-between text-2xl font-black text-black">
          <span>الإجمالي</span>
          <span>{total.toLocaleString()} SDG</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/checkout" className="flex-1 rounded-lg bg-[#0EA5E9] px-5 py-3 text-center font-bold text-white hover:bg-[#0284C7]">إتمام الطلب</Link>
          <button onClick={clearCart} className="rounded-lg bg-[#0EA5E9] px-5 py-3 text-white hover:bg-[#0284C7]">إفراغ السلة</button>
        </div>
      </div>
    </div>
  );
}