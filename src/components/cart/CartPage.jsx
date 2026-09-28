import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { items, removeFromCart, clearCart } = useCart();

  const grouped = useMemo(
    () =>
      items.reduce((acc, item) => {
        const tenantId = item.tenant_id || item.vendor_id || "unknown";
        if (!acc[tenantId]) acc[tenantId] = [];
        acc[tenantId].push(item);
        return acc;
      }, {}),
    [items]
  );

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

  if (items.length === 0) {
    return (
      <div className="p-16 text-center text-[#D4AF37]">
        <p className="text-2xl font-black">السلة فارغة</p>
        <Link to="/shop" className="mt-4 inline-block rounded-full bg-[#E91E63] px-5 py-3 font-bold text-white">تصفح المنتجات</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-5xl px-4 py-8 text-white">
      <h1 className="mb-6 text-3xl font-black text-[#D4AF37]">سلة المشتريات</h1>

      {Object.entries(grouped).map(([tenantId, list]) => {
        const subtotal = list.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
        return (
          <div key={tenantId} className="mb-5 rounded-[24px] border border-white/10 bg-[#171717] p-4">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-black text-white">المتجر: {list[0]?.seller?.store_name || "متجر"}</h2>
              <span className="text-[#D4AF37]">المجموع: {subtotal.toLocaleString()} SDG</span>
            </div>

            {list.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <img src={item.image_url || item.images?.[0] || "https://placehold.co/100x100/111/D4AF37?text=AH"} alt={item.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-sm text-white/60">الكمية: {item.qty}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-[#E91E63]">{(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString()} SDG</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-400">حذف</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="mt-6 rounded-[24px] border border-white/10 bg-[#171717] p-5">
        <div className="flex items-center justify-between text-2xl font-black text-white">
          <span>الإجمالي</span>
          <span>{total.toLocaleString()} SDG</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/checkout" className="flex-1 rounded-full bg-[#E91E63] px-5 py-3 text-center font-bold text-white">إتمام الطلب</Link>
          <button onClick={clearCart} className="rounded-full border border-red-500/40 px-5 py-3 text-red-400">إفراغ السلة</button>
        </div>
      </div>
    </div>
  );
}