import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/context/CartContext";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../lib/currency";
import { saveLastOrder } from "../lib/lastOrder";

export default function Checkout() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const getRealTenantId = (key) => key === "__NO_TENANT__" ? null : key;

  const grouped = items.reduce((acc, item) => {
    const tenantId = item.tenant_id || item.vendor_id || null;
    const key = tenantId || "__NO_TENANT__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const deliveryFee = Object.values(grouped).reduce(
    (sum, tenantItems) => sum + Number(tenantItems[0]?.seller?.delivery_fee || 0),
    0
  );
  const tax = 0;
  const total = subtotal + deliveryFee + tax;

  const handleOrder = async () => {
    if (!name || !phone || !city || !address) return alert("يرجى تعبئة البيانات كاملة");

    setSubmitting(true);
    setSubmitError("");
    try {
      const orderGroups = Object.entries(grouped);
      const requestedOrders = orderGroups.map(([tenantKey, tenantItems]) => ({
        tenant_id: getRealTenantId(tenantKey),
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

      try {
        const queueResponse = await fetch("/api/orders/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIds: (data || []).map((order) => order.id) }),
        });
        if (!queueResponse.ok) throw new Error("Queue request failed");
      } catch (queueError) {
        console.error("Order created, but queue jobs were not scheduled:", queueError);
      }

      const customer = { name, phone, city, address };
      const orderData = {
        orders: (Array.isArray(data) ? data : []).map((order, index) => ({
          ...order,
          items: (orderGroups[index]?.[1] || []).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price || 0),
            qty: Number(item.qty || 1),
          })),
        })),
        customer,
        savedAt: new Date().toISOString(),
      };
      try {
        saveLastOrder(orderData);
      } catch (storageError) {
        console.error("Order was created, but could not be saved on this device:", storageError);
        orderData.storageWarning = "تعذر حفظ الطلب على هذا الجهاز، احتفظ برقم الطلب.";
      }

      clearCart();
      navigate("/order-success", { state: orderData });
    } catch (error) {
      setSubmitError(error.message || "تعذر إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return <div className="p-20 text-center text-black">السلة فارغة <Link to="/shop" className="text-black underline">تصفح المتجر</Link></div>;

  return (
    <div dir="rtl" className="mx-auto max-w-2xl px-4 py-8 text-black">
      <div className="rounded-lg border border-black bg-white p-6">
        <h1 className="mb-5 text-3xl font-black text-black">إتمام الطلب</h1>

        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العميل" className="w-full rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" className="w-full rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" className="w-full rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" className="w-full rounded-lg border border-black bg-white p-3 text-black outline-none" />
        </div>

        {submitError && <p role="alert" className="mt-4 rounded-lg border border-black bg-white p-3 text-black">{submitError}</p>}

        <div className="mt-5 rounded-lg border border-black bg-white p-4 text-black">
          <div>عدد المتاجر: {Object.keys(grouped).length}</div>
          <div className="mt-3 flex justify-between text-sm"><span>المجموع الفرعي</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span>رسوم التوصيل</span><span>{formatCurrency(deliveryFee)}</span></div>
          <div className="mt-2 flex justify-between text-sm"><span>الضريبة</span><span>{formatCurrency(tax)}</span></div>
          <div className="mt-3 border-t border-black pt-3 text-2xl font-black text-black">الإجمالي: {formatCurrency(total)}</div>
        </div>

        <button onClick={handleOrder} disabled={submitting} className="mt-6 w-full rounded-lg bg-[#0EA5E9] px-5 py-3 text-lg font-black text-white hover:bg-[#0284C7] disabled:opacity-60">
          {submitting ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}
        </button>
        <p className="mt-4 text-center text-sm">
          لديك حساب؟{" "}
          <Link to="/login?next=%2Fcheckout" className="font-bold text-sky-700 underline">
            تسجيل الدخول والعودة للدفع
          </Link>
        </p>
      </div>
    </div>
  );
}