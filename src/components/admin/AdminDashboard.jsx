import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";

// ==========================================
// 1. هنا بس بتضيف أي حقل جديد لقدام
// لو بكرة داير تضيف حقل، ضيف سطر هنا + العمود في Supabase
// ==========================================
const VENDOR_COLUMNS = [
  { key: "store_name", label: "اسم المتجر" },
  { key: "store_slug", label: "الرابط" },
  { key: "full_name", label: "صاحب المتجر" },
  { key: "phone", label: "الهاتف" },
  { key: "city", label: "المدينة" },
  { key: "store_description", label: "الوصف" },
  // لقدام:
  // { key: "store_category", label: "التصنيف" },
  // { key: "id_number", label: "الرقم الوطني" },
];

const STATUS_CONFIG = {
  pending: { label: "في الانتظار", cls: "bg-yellow-500/20 text-yellow-300" },
  approved: { label: "مقبول", cls: "bg-green-500/20 text-green-300" },
  rejected: { label: "مرفوض", cls: "bg-red-500/20 text-red-300" },
  blocked: { label: "محظور", cls: "bg-white/10 text-white" },
};

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("admin_pass") === "AHHioTest2026");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [vendors, setVendors] = useState([]); // بدل tenants - هسع من profiles
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("vendors");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  function unlockAdmin(e) {
    e.preventDefault();
    if (password !== "AHHioTest2026") { setPasswordError(true); return; }
    localStorage.setItem("admin_pass", password);
    setIsAdmin(true);
  }

  async function loadAll() {
    setLoading(true);
    // 1. التجار من profiles - بنفس الحقول
    const fields = ["id","email","vendor_status","is_vendor_approved","role","store_logo_url","created_at", ...VENDOR_COLUMNS.map(c => c.key)].join(",");
    const { data: vendorsData } = await supabase.from("profiles").select(fields).not("store_name", "is", null).order("created_at", { ascending: false });

    // 2. الطلبات - بنربطها بـ owner_id بدل tenant_id
    const { data: ordersData } = await supabase.from("orders").select("*").order("id", { ascending: false });
    const { data: productsData } = await supabase.from("products").select("*");
    const { data: paymentsData } = await supabase.from("payment_transactions").select("*").eq("status", "pending").order("created_at", { ascending: false });

    const paymentsWithReceipts = await Promise.all((paymentsData || []).map(async (p) => {
      const { data } = await supabase.storage.from("payment_proofs").createSignedUrl(p.screenshot_url, 300);
      return { ...p, receiptUrl: data?.signedUrl || "" };
    }));

    setVendors(vendorsData || []);
    setOrders(ordersData || []);
    setProducts(productsData || []);
    setPayments(paymentsWithReceipts);
    setLoading(false);
  }

  // --- قبول / رفض / حظر التاجر - دي كانت ناقصة عندك ---
  const updateVendorStatus = async (vendor, newStatus) => {
    const msg = newStatus === "approved" ? `تقبل متجر ${vendor.store_name}؟` : newStatus === "rejected" ? `ترفض متجر ${vendor.store_name}؟` : `تحظر متجر ${vendor.store_name}؟`;
    if (!confirm(msg)) return;
    const { error } = await supabase.from("profiles").update({
      vendor_status: newStatus,
      is_vendor_approved: newStatus === "approved",
      role: newStatus === "approved" ? "vendor" : "user",
    }).eq("id", vendor.id);
    if (error) { alert(error.message); return; }
    await loadAll();
  };

  const reviewPayment = async (paymentId, approve) => {
    if (!confirm(`تأكيد ${approve ? "اعتماد" : "رفض"} طلب الدفع؟`)) return;
    const { error } = await supabase.rpc("review_vendor_payment", { target_payment: paymentId, approve_payment: approve });
    if (error) { alert(error.message); return; }
    await loadAll();
  };

  const deleteVendor = async (vendor) => {
    // ما بنمسح نهائي - بنعمل حظر عشان البيانات ما تضيع
    if (!confirm(`متاكد تحظر ${vendor.store_name}؟ الحظر أفضل من الحذف عشان الطلبات ما تضيع.`)) return;
    await updateVendorStatus(vendor, "blocked");
  };

  const stats = useMemo(() => ({
    pending: vendors.filter(v => v.vendor_status === "pending").length,
    approved: vendors.filter(v => v.vendor_status === "approved").length,
  }), [vendors]);

  const filteredVendors = useMemo(() => vendors.filter(v => {
    if (filter !== "all" && v.vendor_status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return VENDOR_COLUMNS.some(c => String(v[c.key] || "").toLowerCase().includes(q));
  }), [vendors, filter, search]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111] p-4 text-white">
        <form onSubmit={unlockAdmin} className="w-full max-w-sm rounded-xl bg-[#171717] p-6">
          <h1 className="mb-4 text-xl font-bold text-[#D4AF37]">دخول الإدارة</h1>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }} placeholder="كلمة المرور" className="mb-3 w-full rounded border border-white/20 bg-[#111111] px-3 py-2 text-white" />
          {passwordError && <p className="mb-3 text-sm text-red-400">كلمة المرور غير صحيحة</p>}
          <button type="submit" className="w-full rounded bg-[#D4AF37] px-3 py-2 font-bold text-black">دخول</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] p-4 text-white">
      <h1 className="mb-2 text-3xl font-black text-[#D4AF37]">Admin - لوحة التحكم</h1>
      <p className="text-sm text-white/50 mb-6">في الانتظار: {stats.pending} • مقبولين: {stats.approved} • كل المتاجر: {vendors.length}</p>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">المتاجر</p><p className="text-2xl font-bold text-[#E91E63]">{vendors.length}</p></div>
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">المنتجات</p><p className="text-2xl font-bold text-[#E91E63]">{products.length}</p></div>
        <div className="rounded-xl bg-[#171717] p-4"><p className="text-white/60">الطلبات</p><p className="text-2xl font-bold text-[#E91E63]">{orders.length}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[["vendors","التجار"],["payments",`الدفع (${payments.length})`],["orders","الطلبات"]].map(([tab,label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab===tab ? "bg-[#D4AF37] text-black" : "bg-[#171717] text-white"}`}>{label}</button>
        ))}
      </div>

      {activeTab === "vendors" && (
        <section className="rounded-xl bg-[#171717] p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم، الرابط، الهاتف..." className="flex-1 min-w-[200px] rounded border border-white/20 bg-[#111111] px-3 py-2" />
            <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded border border-white/20 bg-[#111111] px-3 py-2">
              <option value="all">كل الحالات</option><option value="pending">في الانتظار</option><option value="approved">مقبول</option><option value="rejected">مرفوض</option><option value="blocked">محظور</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredVendors.map(v => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-3">
                <div className="flex items-center gap-3">
                  <img src={v.store_logo_url || "https://placehold.co/40x40/111/D4AF37?text=AH"} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="font-bold">{v.store_name} <span className="text-xs text-white/50">@{v.store_slug}</span></p>
                    <p className="text-xs text-white/50">{v.full_name} • {v.phone || "-"} • {v.city || "-"}</p>
                    {v.store_description && <p className="text-xs text-white/40 max-w-[300px] truncate">{v.store_description}</p>}
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
                  <button onClick={()=>deleteVendor(v)} className="text-sm text-red-400">حذف / حظر</button>
                </div>
              </div>
            ))}
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
              return (
                <article key={p.id} className="rounded-lg border border-white/10 p-3">
                  <p className="font-bold">{vendor?.store_name || "متجر"} · {p.requested_plan_id}</p>
                  <p className="mt-1 text-sm text-white/70">رقم العملية: {p.txn_number}</p>
                  <p className="text-sm text-white/70">المبلغ: {Number(p.amount).toLocaleString()} جنيه</p>
                  {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer"><img src={p.receiptUrl} className="h-40 w-full rounded object-contain mt-3" alt="" /></a>}
                  <div className="mt-3 flex gap-2">
                    <button onClick={()=>reviewPayment(p.id,true)} className="rounded bg-emerald-700 px-3 py-2 text-sm font-bold">اعتماد الدفع</button>
                    <button onClick={()=>reviewPayment(p.id,false)} className="rounded bg-red-800 px-3 py-2 text-sm font-bold">رفض</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
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
