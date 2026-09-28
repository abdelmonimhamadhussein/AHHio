import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data: loadedVendor } = await supabase
        .from("tenants")
        .select("id, slug, store_name, whatsapp_number")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!loadedVendor) {
        setLoading(false);
        return;
      }

      setVendor(loadedVendor);
      const { data: loadedOrders } = await supabase
        .from("orders")
        .select("*")
          .eq("tenant_id", loadedVendor.id)
        .order("created_at", { ascending: false });

      setOrders(loadedOrders || []);
      setLoading(false);
    }

    load();
  }, []);

  const updateStatus = async (orderId, status) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .eq("tenant_id", vendor?.id);
    if (error) return;
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
  if (!vendor) return <div className="p-10 text-center">المتجر غير موجود</div>;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">طلبات متجر {vendor.store_name}</h1>
        <Link to="/vendor/dashboard" className="border px-3 py-2 rounded-lg">
          لوحة التحكم
        </Link>
      </div>

      {orders.length === 0 && <p className="text-center p-20 text-gray-500">لا توجد طلبات</p>}

      {orders.map((order) => (
        <article key={order.id} className="bg-white border rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex justify-between gap-3">
            <p className="font-bold">#{String(order.id).slice(0, 6)}</p>
            <span className={`px-3 py-1 rounded-full text-xs ${
              order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
              order.status === "accepted" ? "bg-green-100 text-green-700" :
              "bg-gray-100"
            }`}>
              {order.status === "pending" ? "جديد" : order.status === "accepted" ? "تم القبول" : order.status}
            </span>
          </div>

          <div className="mt-2 text-sm space-y-1">
            <p>الزبون: {order.customer_name} - {order.phone || order.customer_phone}</p>
            <p>العنوان: {order.address}</p>
            <p>الدفع: {order.payment_method === "cash" ? "الدفع عند الاستلام" : order.payment_method}</p>
          </div>

          <div className="bg-gray-50 p-2 rounded-lg mt-3">
            {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
              <div key={index} className="flex justify-between text-sm py-1">
                <span>{item.name} x {item.qty}</span>
                <span>{Number(item.price || 0) * Number(item.qty || 1)} جنيه</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t mt-2 pt-2">
              <span>الإجمالي</span>
              <span>{order.total} جنيه</span>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            {order.status === "pending" && (
              <>
                <button type="button" onClick={() => updateStatus(order.id, "accepted")} className="flex-1 bg-black text-white py-2 rounded-lg">
                  قبول
                </button>
                <a href={`https://wa.me/${order.phone || order.customer_phone}?text=${encodeURIComponent(`مرحبا ${order.customer_name} بخصوص طلبك`)}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-center">
                  واتساب الزبون
                </a>
              </>
            )}
            {order.status === "accepted" && (
              <button type="button" onClick={() => updateStatus(order.id, "delivered")} className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-bold">
                تم التوصيل
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
