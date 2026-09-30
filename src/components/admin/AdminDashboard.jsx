import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const { data: tenantsData } = await supabase.from("tenants").select("*");
    const { data: ordersData } = await supabase.from("orders").select("*, tenant:tenants(store_name, slug)").order("id", { ascending: false });
    const { data: productsData } = await supabase.from("products").select("*");
    const { data: paymentsData } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    const paymentsWithReceipts = await Promise.all((paymentsData || []).map(async (payment) => {
      const { data } = await supabase.storage
        .from("payment_proofs")
        .createSignedUrl(payment.screenshot_url, 300);
      return { ...payment, receiptUrl: data?.signedUrl || "" };
    }));
    setTenants(tenantsData || []);
    setOrders(ordersData || []);
    setProducts(productsData || []);
    setPayments(paymentsWithReceipts);
  }

  const reviewPayment = async (paymentId, approvePayment) => {
    const action = approvePayment ? "اعتماد" : "رفض";
    if (!confirm(`تأكيد ${action} طلب الدفع؟`)) return;
    const { error } = await supabase.rpc("review_vendor_payment", {
      target_payment: paymentId,
      approve_payment: approvePayment,
    });
    if (error) {
      alert(error.message);
      return;
    }
    await loadAll();
  };

  const deleteTenant = async (id) => {
    if (!confirm("متاكد تمسح المتجر؟")) return;
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadAll();
  };

  return (
    <div className="min-h-screen bg-[#111111] p-4 text-white">
      <h1 className="mb-6 text-3xl font-black text-[#D4AF37]">Admin - لوحة التحكم</h1>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">المتاجر</p><p className="text-2xl font-bold text-[#E91E63]">{tenants.length}</p></div>
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">المنتجات</p><p className="text-2xl font-bold text-[#E91E63]">{products.length}</p></div>
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">الطلبات</p><p className="text-2xl font-bold text-[#E91E63]">{orders.length}</p></div>
      </div>

      <section className="mb-6 rounded-xl bg-[#171717] p-4">
        <h2 className="mb-3 text-lg font-bold text-[#D4AF37]">طلبات الدفع للمراجعة</h2>
        {payments.length === 0 && <p className="text-sm text-white/60">لا توجد طلبات معلقة</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {payments.map((payment) => {
            const tenant = tenants.find((item) => item.id === payment.tenant_id);
            return (
              <article key={payment.id} className="rounded-lg border border-white/10 p-3">
                <p className="font-bold">{tenant?.store_name || "متجر"} · {payment.requested_plan_id}</p>
                <p className="mt-1 text-sm text-white/70">رقم العملية: {payment.txn_number}</p>
                <p className="text-sm text-white/70">المبلغ المبلغ عنه: {Number(payment.amount).toLocaleString()} جنيه</p>
                {payment.receiptUrl && (
                  <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                    <img src={payment.receiptUrl} alt={`إيصال ${payment.txn_number}`} className="h-40 w-full rounded object-contain" />
                  </a>
                )}
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => reviewPayment(payment.id, true)} className="rounded bg-emerald-700 px-3 py-2 text-sm font-bold">اعتماد الدفع</button>
                  <button type="button" onClick={() => reviewPayment(payment.id, false)} className="rounded bg-red-800 px-3 py-2 text-sm font-bold">رفض</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="mb-6 rounded-xl bg-[#171717] p-4">
        <h2 className="mb-3 text-lg font-bold text-[#D4AF37]">كل المتاجر</h2>
        {tenants.map((tenant) => (
          <div key={tenant.id} className="flex items-center justify-between border-b border-white/10 py-2">
            <div className="flex items-center gap-2">
              <img src={tenant.logo_url || "https://placehold.co/40x40/111/D4AF37?text=AH"} alt={tenant.store_name} className="h-8 w-8 rounded-full bg-gray-200" />
              <div>
                <p className="font-bold text-white">{tenant.store_name}<span className="text-xs text-white/50"> @{tenant.slug}</span></p>
                <p className="text-xs text-white/50">{tenant.whatsapp_number || "-"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/store/${tenant.slug}`} className="text-sm text-[#E91E63]">عرض</Link>
              <button onClick={() => deleteTenant(tenant.id)} className="text-sm text-red-400">حذف</button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[#171717] p-4">
        <h2 className="mb-3 text-lg font-bold text-[#D4AF37]">كل الطلبات</h2>
        {orders.map((order) => (
          <div key={order.id} className="border-b border-white/10 py-2 text-sm">
            <div className="flex justify-between">
              <span className="font-bold text-white">{order.tenant?.store_name || "متجر"}</span>
              <span className="rounded bg-[#D4AF37]/15 px-2 text-[#D4AF37]">{order.status}</span>
            </div>
            <p className="text-white/70">{order.customer_name} - {Number(order.total || 0).toLocaleString()} SDG</p>
          </div>
        ))}
      </div>
    </div>
  );
}