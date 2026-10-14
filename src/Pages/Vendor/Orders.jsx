import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigningOrderId, setAssigningOrderId] = useState(null);

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
      const [{ data: loadedOrders }, { data: loadedAgents }] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("tenant_id", loadedVendor.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("delivery_agents")
          .select("id, store_id, name, phone, is_active")
          .eq("store_id", loadedVendor.id)
          .order("name"),
      ]);

      setOrders(loadedOrders || []);
      setAgents(loadedAgents || []);
      setLoading(false);
    }

    load();
  }, []);

  const updateStatus = async (orderId, status) => {
    const { error } = await supabase.rpc("update_order_status", {
      target_order: orderId,
      new_status: status,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const assignAgent = async (orderId, agentId) => {
    setAssigningOrderId(orderId);
    const { error } = await supabase.rpc("assign_order_delivery_agent", {
      target_order: orderId,
      target_agent: agentId || null,
    });
    setAssigningOrderId(null);
    if (error) {
      alert(error.message);
      return;
    }

    setOrders((currentOrders) => currentOrders.map((order) => (
      order.id === orderId ? { ...order, delivery_agent_id: agentId || null } : order
    )));
  };

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
  if (!vendor) return <div className="p-10 text-center">المتجر غير موجود</div>;

  return (
    <div dir="rtl" className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">طلبات متجر {vendor.store_name}</h1>
        <Link to="/vendor" className="border px-3 py-2 rounded-lg">
          لوحة التحكم
        </Link>
      </div>

      {orders.length === 0 && <p className="text-center p-20 text-black">لا توجد طلبات</p>}

      {orders.map((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        const subtotal = Number(order.subtotal ?? items.reduce(
          (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
          0
        ));
        const deliveryFee = Number(order.delivery_fee || 0);
        const tax = Number(order.tax || 0);
        const total = subtotal + deliveryFee + tax;

        return (
        <article key={order.id} className="bg-white border rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex justify-between gap-3">
            <p className="font-bold">#{String(order.id).slice(0, 6)}</p>
            <span className={`px-3 py-1 rounded-full text-xs ${
              "border border-black text-black"
            }`}>
              {order.status === "pending" ? "جديد" : order.status === "accepted" ? "تم القبول" : order.status}
            </span>
          </div>

          <div className="mt-2 text-sm space-y-1">
            <p>الزبون: {order.customer_name} - {order.phone || order.customer_phone}</p>
            <p>العنوان: {order.address}</p>
            <p>الدفع: {order.payment_method === "cash" ? "الدفع عند الاستلام" : order.payment_method}</p>
          </div>

          <div className="bg-white border border-black p-2 rounded-lg mt-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm py-1">
                <span>{item.name} x {item.qty}</span>
                <span>{Number(item.price || 0) * Number(item.qty || 1)} جنيه</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t mt-2 pt-2">
              <span>المجموع الفرعي</span>
              <span>{subtotal} جنيه</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span>رسوم التوصيل</span>
              <span>{deliveryFee} جنيه</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span>الضريبة</span>
              <span>{tax} جنيه</span>
            </div>
            <div className="flex justify-between font-bold border-t mt-2 pt-2">
              <span>الإجمالي</span>
              <span>{total} جنيه</span>
            </div>
          </div>

          <label htmlFor={`delivery-agent-${order.id}`} className="mt-3 block text-sm font-bold">
            مندوب التوصيل
          </label>
          <select
            id={`delivery-agent-${order.id}`}
            value={order.delivery_agent_id || ""}
            disabled={assigningOrderId === order.id}
            onChange={(event) => assignAgent(order.id, event.target.value)}
            className="mt-1 w-full rounded-lg border border-black bg-white p-2 text-black disabled:opacity-60"
          >
            <option value="">بدون مندوب</option>
            {agents
              .filter((agent) => agent.is_active || agent.id === order.delivery_agent_id)
              .map((agent) => (
                <option key={agent.id} value={agent.id} disabled={!agent.is_active}>
                  {agent.name}{agent.is_active ? "" : " (واقف)"} - {agent.phone}
                </option>
              ))}
          </select>

          <div className="flex gap-2 mt-3">
            {order.status === "pending" && (
              <>
                <button type="button" onClick={() => updateStatus(order.id, "accepted")} className="flex-1 bg-[#0EA5E9] text-white py-2 rounded-lg hover:bg-[#0284C7]">
                  قبول
                </button>
                <a href={`https://wa.me/${order.phone || order.customer_phone}?text=${encodeURIComponent(`مرحبا ${order.customer_name} بخصوص طلبك`)}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#0EA5E9] text-white py-2 rounded-lg text-center hover:bg-[#0284C7]">
                  واتساب الزبون
                </a>
              </>
            )}
            {order.status === "accepted" && (
              <button type="button" onClick={() => updateStatus(order.id, "delivered")} className="w-full bg-[#0EA5E9] text-white py-2 rounded-lg font-bold hover:bg-[#0284C7]">
                تم التوصيل
              </button>
            )}
          </div>
        </article>
        );
      })}
    </div>
  );
}
