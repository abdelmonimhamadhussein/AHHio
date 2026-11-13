import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { PACKAGES } from "../../lib/Package";

const DAY = 24 * 60 * 60 * 1000;

const VENDOR_COLUMNS = [
  { key: "store_name", label: "اسم المتجر" },
  { key: "store_slug", label: "الرابط" },
  { key: "full_name", label: "صاحب المتجر" },
  { key: "phone", label: "الهاتف" },
  { key: "city", label: "المدينة" },
  { key: "store_description", label: "الوصف" },
];

const STATUS_CONFIG = {
  pending: { label: "في الانتظار", cls: "bg-yellow-500/20 text-yellow-300" },
  approved: { label: "مقبول", cls: "bg-green-500/20 text-green-300" },
  rejected: { label: "مرفوض", cls: "bg-red-500/20 text-red-300" },
  blocked: { label: "محظور", cls: "bg-white/10 text-white" },
  expired: { label: "اشتراك منتهي", cls: "bg-orange-500/20 text-orange-300" },
};

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [vendors, setVendors] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeTab, setActiveTab] = useState("vendors");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkAdmin() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (active) setIsAdmin(profile?.role === "admin");
      } catch (error) {
        if (active) setAdminError(error.message || "تعذر التحقق من صلاحية الإدارة");
      } finally {
        if (active) setCheckingAdmin(false);
      }
    }

    checkAdmin();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  async function loadAll() {
    setLoading(true);
    const fields = ["id","email","vendor_status","is_vendor_approved","role","store_logo_url","created_at", ...VENDOR_COLUMNS.map(c => c.key)].join(",");
    const { data: vendorsData } = await supabase.from("profiles").select(fields).not("store_name", "is", null).order("created_at", { ascending: false });
    const { data: tenantsData } = await supabase.from("tenants").select("id, owner_id, store_name");
    const { data: ordersData } = await supabase.from("orders").select("*").order("id", { ascending: false });
    const { data: productsData } = await supabase.from("products").select("*");
    const { data: paymentsData } = await supabase.from("payment_transactions").select("*").eq("status", "pending").order("created_at", { ascending: false });
    const { data: subsData } = await supabase.from("subscriptions").select("*").order("end_date", { ascending: false });

    const paymentsWithReceipts = await Promise.all((paymentsData || []).map(async (p) => {
      const { data } = await supabase.storage.from("payment_proofs").createSignedUrl(p.screenshot_url, 300);
      return { ...p, receiptUrl: data?.signedUrl || "" };
    }));

    setVendors(vendorsData || []);
    setTenants(tenantsData || []);
    setOrders(ordersData || []);
    setProducts(productsData || []);
    setPayments(paymentsWithReceipts);
    setSubscriptions(subsData || []);
    setLoading(false);
  }

  // helper: جيب اشتراك التاجر + أيامو المتبقية
  const getVendorSub = (vendorId) => {
    const tenantId = tenants.find((tenant) => tenant.owner_id === vendorId)?.id;
    const sub = subscriptions.find((item) => item.tenant_id === tenantId);
    if (!sub) return null;
    const plan = PACKAGES[sub.plan_id] || { name: sub.plan_id, price: 0 };
    const daysLeft = sub.end_date ? Math.max(0, Math.ceil((new Date(sub.end_date) - new Date()) / DAY)) : 0;
    return { ...sub, plan, daysLeft };
  };

  const updateVendorStatus = async (vendor, newStatus) => {
    const msg = newStatus === "approved" ? `تقبل متجر ${vendor.store_name}؟` : newStatus === "rejected" ? `ترفض متجر ${vendor.store_name}؟` : `تحظر متجر ${vendor.store_name}؟`;
    if (!confirm(msg)) return;
    const { error } = await supabase.rpc("update_vendor_status", {
      target_vendor: vendor.id,
      new_status: newStatus,
    });
    if (error) { alert(error.message); return; }
    await loadAll();
  };

  // === ده التعديل الأهم: قبول الدفع بيعمل اشتراك أوتوماتيك ===
  const reviewPayment = async (payment, approve) => {
    if (!confirm(`تأكيد ${approve ? "اعتماد" : "رفض"} طلب الدفع؟`)) return;
    const { error } = await supabase.rpc("review_vendor_payment", { target_payment: payment.id, approve_payment: approve });
    if (error) { alert(error.message); return; }

    if (approve) {
      const planId = payment.requested_plan_id || "pro";
      const plan = PACKAGES[planId] || PACKAGES.pro;
      alert(`تم اعتماد الدفع وتفعيل اشتراك ${plan.name}.`);
    }
    await loadAll();
  };

  const deleteVendor = async (vendor) => {
    if (!confirm(`متاكد تحظر ${vendor.store_name}؟`)) return;
    await updateVendorStatus(vendor, "blocked");
  };

  const stats = useMemo(() => ({
    pending: vendors.filter(v => v.vendor_status === "pending").length,
    approved: vendors.filter(v => v.vendor_status === "approved").length,
    expired: vendors.filter(v => v.vendor_status === "expired").length,
    activeSubs: subscriptions.filter(s => s.status === "active").length,
  }), [vendors, subscriptions]);

  const filteredVendors = useMemo(() => vendors.filter(v => {
    if (filter !== "all" && v.vendor_status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return VENDOR_COLUMNS.some(c => String(v[c.key] || "").toLowerCase().includes(q));
  }), [vendors, filter, search]);

  if (checkingAdmin) return <div className="p-8 text-center">جاري التحقق من صلاحية الإدارة...</div>;

  if (!isAdmin) {
    return (
      <div role="alert" className="p-8 text-center text-red-700">
        {adminError || "لا تملك صلاحية دخول لوحة الإدارة"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] p-4 text-white">
      <h1 className="mb-2 text-3xl font-black text-[#D4AF37]">Admin - لوحة التحكم</h1>
      <p className="text-sm text-white/50 mb-6">في الانتظار: {stats.pending} • مقبولين: {stats.approved} • منتهي: {stats.expired} • اشتراكات نشطة: {stats.activeSubs}</p>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">المتاجر</p><p className="text-2xl font-bold text-[#E91E63]">{vendors.length}</p></div>
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">المنتجات</p><p className="text-2xl font-bold text-[#E91E63]">{products.length}</p></div>
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">الطلبات</p><p className="text-2xl font-bold text-[#E91E63]">{orders.length}</p></div>
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">اشتراكات نشطة</p><p className="text-2xl font-bold text-emerald-400">{stats.activeSubs}</p></div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[["vendors","التجار"],["payments",`الدفع (${payments.length})`],["orders","الطلبات"],["subs","الاشتراكات"]].map(([tab,label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab===tab ? "bg-[#D4AF37] text-black" : "bg-[#171717] text-white"}`}>{label}</button>
        ))}
      </div>

      {activeTab === "vendors" && (
        <section className="rounded-xl bg-[#171717] p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم، الرابط، الهاتف..." className="flex-1 min-w-[200px] rounded border border-white/20 bg-[#111111] px-3 py-2" />
            <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded border border-white/20 bg-[#111111] px-3 py-2">
              <option value="all">كل الحالات</option><option value="pending">في الانتظار</option><option value="approved">مقبول</option><option value="expired">منتهي</option><option value="rejected">مرفوض</option><option value="blocked">محظور</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredVendors.map(v => {
              const sub = getVendorSub(v.id);
              return (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-3">
                <div className="flex items-center gap-3">
                  <img src={v.store_logo_url || "https://placehold.co/40x40/111/D4AF37?text=AH"} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="font-bold">{v.store_name} <span className="text-xs text-white/50">@{v.store_slug}</span></p>
                    <p className="text-xs text-white/50">{v.full_name} • {v.phone || "-"} • {v.city || "-"}</p>
                    {sub ? <p className="text-xs text-emerald-300">باقة {sub.plan.name} • فضل {sub.daysLeft} يوم • بتنتهي {new Date(sub.end_date).toLocaleDateString("ar-SD")}</p> : <p className="text-xs text-red-300">ما عندو اشتراك</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[v.vendor_status]?.cls || "bg-white/10"}`}>{STATUS_CONFIG[v.vendor_status]?.label || v.vendor_status}</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/store/${v.store_slug}`} className="text-sm text-[#E91E63]">عرض</Link>
                  {v.vendor_status === "pending" && <>
                    <button onClick={()=>updateVendorStatus(v,"approved")} className="rounded bg-emerald-700 px-3 py-1 text-sm font-bold">قبول ✅</button>
                    <button onClick={()=>updateVendorStatus(v,"rejected")} className="rounded bg-red-800 px-3 py-1 text-sm font-bold">رفض ❌</button>
                  </>}
                  {v.vendor_status === "approved" && <button onClick={()=>updateVendorStatus(v,"blocked")} className="rounded bg-white/10 px-3 py-1 text-sm">حظر</button>}
                  <button onClick={()=>deleteVendor(v)} className="text-sm text-red-400">حظر</button>
                </div>
              </div>
              );
            })}
            {filteredVendors.length===0 && <p className="text-sm text-white/60 py-6 text-center">لا يوجد تجار</p>}
          </div>
        </section>
      )}

      {activeTab === "payments" && (
        <section className="rounded-xl bg-[#171717] p-4">
          <h2 className="mb-3 text-lg font-bold text-[#D4AF37]">طلبات الدفع للمراجعة</h2>
          {payments.length===0 && <p className="text-sm text-white/60">لا توجد طلبات معلقة</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {payments.map(p => {
              const vendor = vendors.find(v=>v.id===p.tenant_id || v.id===p.owner_id || v.id===p.user_id);
              const plan = PACKAGES[p.requested_plan_id] || { name: p.requested_plan_id, price: p.amount };
              return (
                <article key={p.id} className="rounded-lg border border-white/10 p-3">
                  <p className="font-bold">{vendor?.store_name || "متجر"} · باقة {plan.name}</p>
                  <p className="mt-1 text-sm text-white/70">رقم العملية: {p.txn_number}</p>
                  <p className="text-sm text-white/70">المبلغ: {Number(p.amount).toLocaleString()} جنيه • مدة الباقة: {plan.durationDays || 30} يوم</p>
                  {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer"><img src={p.receiptUrl} className="h-40 w-full rounded object-contain mt-3" alt="" /></a>}
                  <div className="mt-3 flex gap-2">
                    <button onClick={()=>reviewPayment(p,true)} className="rounded bg-emerald-700 px-3 py-2 text-sm font-bold">اعتماد + تفعيل {plan.durationDays || 30} يوم</button>
                    <button onClick={()=>reviewPayment(p,false)} className="rounded bg-red-800 px-3 py-2 text-sm font-bold">رفض</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "subs" && (
        <div className="rounded-xl bg-[#171717] p-4">
          <h2 className="mb-3 text-lg font-bold text-[#D4AF37]">كل الاشتراكات</h2>
          {subscriptions.map(s => {
            const vendor = vendors.find(v=>v.id===s.tenant_id || v.id===s.owner_id);
            const plan = PACKAGES[s.plan_id] || { name: s.plan_id };
            const daysLeft = s.end_date ? Math.max(0, Math.ceil((new Date(s.end_date) - new Date()) / DAY)) : 0;
            return (
              <div key={s.id} className="border-b border-white/10 py-2 text-sm flex justify-between">
                <span><b>{vendor?.store_name || "متجر"}</b> • {plan.name} • {s.status}</span>
                <span className="text-white/60">فضل {daysLeft} يوم • بتنتهي {s.end_date ? new Date(s.end_date).toLocaleDateString("ar-SD") : "-"}</span>
              </div>
            );
          })}
          {subscriptions.length===0 && <p className="text-sm text-white/60">لا توجد اشتراكات</p>}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="rounded-xl bg-[#171717] p-4">
          <h2 className="mb-3 text-lg font-bold text-[#D4AF37]">كل الطلبات</h2>
          {orders.map(o => {
            const vendor = vendors.find(v=>v.id===o.tenant_id || v.id===o.owner_id);
            return (
              <div key={o.id} className="border-b border-white/10 py-2 text-sm">
                <div className="flex justify-between"><span className="font-bold">{vendor?.store_name || "متجر"}</span><span className="rounded bg-[#D4AF37]/15 px-2 text-[#D4AF37]">{o.status}</span></div>
                <p className="text-white/70">{o.customer_name} - {Number(o.total||0).toLocaleString()} SDG</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
