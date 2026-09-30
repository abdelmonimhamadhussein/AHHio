import { useState } from "react";
import { useCart } from "../components/context/CartContext";
import { supabase } from "../lib/supabase";

export default function Checkout() {
  const { items, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdOrders, setCreatedOrders] = useState([]);

  const grouped = items.reduce((acc, item) => {
    const tenantId = item.tenant_id || item.vendor_id || "unknown";
    if (!acc[tenantId]) acc[tenantId] = [];
    acc[tenantId].push(item);
    return acc;
  }, {});

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

  const handleOrder = async () => {
    if (!name || !phone || !city || !address) return alert("يرجى تعبئة البيانات كاملة");

    setSubmitting(true);
    setSubmitError("");
    try {
      const requestedOrders = Object.entries(grouped).map(([tenantId, tenantItems]) => ({
        tenant_id: tenantId,
        items: tenantItems.map((item) => ({ id: item.id, qty: Number(item.qty || 1) })),
      }));
      const { data, error } = await supabase.rpc("place_marketplace_order", {
        customer_name: name,
        customer_phone: phone,
        customer_city: city,
        customer_address: address,
        requested_orders: requestedOrders,
      });
      if (error) throw error;

      setCreatedOrders(data || []);
      clearCart();
    } catch (error) {
      setSubmitError(error.message || "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdOrders.length > 0) {
    return (
      <div dir="rtl" className="mx-auto max-w-2xl p-10 text-center text-white">
        <h1 className="text-2xl font-black text-[#D4AF37]">تم إرسال طلبك</h1>
        <p className="mt-2 text-white/70">أرسل تفاصيل كل طلب إلى المتجر عبر واتساب:</p>
        <div className="mt-6 grid gap-3">
          {createdOrders.map((order) => {
            const rawPhone = String(order.whatsapp_number || "249910070934").replace(/\D/g, "");
            const whatsappPhone = rawPhone.startsWith("249") ? rawPhone : `249${rawPhone.replace(/^0+/, "")}`;
            const message = `طلب جديد ${order.id}\nالعميل: ${name}\nرقم الهاتف: ${phone}\nالمدينة: ${city}\nالعنوان: ${address}\nالإجمالي: ${Number(order.total).toLocaleString()} SDG`;
            return (
              <a key={order.id} href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-green-600 px-4 py-3 font-bold text-white">
                مراسلة {order.store_name}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  if (items.length === 0) return <div className="p-20 text-center text-[#D4AF37]">السلة فارغة</div>;

  return (
    <div dir="rtl" className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-[28px] border border-white/10 bg-[#171717] p-6">
        <h1 className="mb-5 text-3xl font-black text-[#D4AF37]">إتمام الطلب</h1>

        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العميل" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
        </div>

        {submitError && <p role="alert" className="mt-4 rounded-lg bg-red-950 p-3 text-red-200">{submitError}</p>}

        <div className="mt-5 rounded-[20px] bg-[#111111] p-4 text-white/80">
          <div>عدد المتاجر: {Object.keys(grouped).length}</div>
          <div className="mt-2 text-2xl font-black text-[#E91E63]">الإجمالي: {total.toLocaleString()} SDG</div>
        </div>

        <button onClick={handleOrder} disabled={submitting} className="mt-6 w-full rounded-full bg-[#E91E63] px-5 py-3 text-lg font-black text-white disabled:opacity-60">
          {submitting ? "جارٍ إرسال الطلب..." : "إرسال الطلب"}
        </button>
      </div>
    </div>
  );
}