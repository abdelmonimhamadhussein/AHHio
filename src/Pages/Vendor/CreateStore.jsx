import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const cityOptions = ["الخرطوم", "امدرمان", "الخرطوم بحري", "بورتسودان", "مدني", "كسلا", "القضارف"];

export default function CreateStore() {
  const navigate = useNavigate();
  const [slugStatus, setSlugStatus] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    slug: "",
    city: "الخرطوم بحري",
    bank_account: "",
    whatsapp_number: "",
  });

  // تحويل اسم المتجر ل slug تلقائيا
  useEffect(() => {
    if (form.store_name && !form.slug.includes("-")) {
      // لا نعدل لو المستخدم بيكتب يدويا
    }
  }, []);

  const handleNameChange = (name) => {
    const autoSlug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
    setForm((p) => ({ ...p, store_name: name, slug: p.slug ? p.slug : autoSlug }));
  };

  useEffect(() => {
    if (!form.slug) { setSlugStatus("idle"); return; }
    const clean = form.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (clean !== form.slug) setForm((p) => ({ ...p, slug: clean }));
    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      const { data } = await supabase.from("tenants").select("id").eq("slug", clean).maybeSingle();
      setSlugStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [form.slug]);

  const create = async () => {
    if (!form.store_name.trim()) { alert("اكتب اسم المتجر"); return; }
    if (form.slug.length < 3) { alert("الرابط قصير جدا - 3 حروف على الأقل"); return; }
    if (slugStatus === "taken") { alert("هذا الرابط مستخدم"); return; }
    if (form.whatsapp_number && !/^249\d{9}$/.test(form.whatsapp_number)) { alert("الواتساب لازم 2499xxxxxxx"); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("سجل دخول اولا"); setSaving(false); return; }

    const { data, error } = await supabase.from("tenants").insert({
      owner_id: user.id,
      store_name: form.store_name.trim(),
      slug: form.slug.toLowerCase().trim(),
      city: form.city,
      bank_account: form.bank_account.trim(),
      whatsapp_number: form.whatsapp_number.trim(),
      delivery_fee: 0,
    }).select().single();

    setSaving(false);
    if (error) { alert(error.message); return; }
    alert("تم انشاء المتجر بنجاح ✅");
    navigate(`/vendor/store?tenant=${data.id}`);
  };

  return (
    <div dir="rtl" className="mx-auto max-w-xl py-6">
      <h2 className="mb-6 text-2xl font-black">إنشاء متجر جديد</h2>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-bold">اسم المتجر *</label>
            <input value={form.store_name} onChange={(e) => handleNameChange(e.target.value)} placeholder="مثلا: متجر النور" className="w-full rounded-lg border p-3 outline-none focus:border-black" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">رابط المتجر *</label>
            <div className="flex items-center gap-2 rounded-lg border p-2 focus-within:border-black">
              <span className="text-sm text-gray-500" dir="ltr">/store/</span>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="alnoor-store" className="w-full outline-none" dir="ltr" />
            </div>
            <div className="mt-1 text-xs">{slugStatus === "taken" ? "❌ هذا الرابط مستخدم" : slugStatus === "available" ? "✅ متاح" : slugStatus === "checking" ? "يتم الفحص..." : "سيكون رابط متجرك: ahhio.com/store/..."}</div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold">المدينة</label>
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border p-3 outline-none">
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">رقم الحساب البنكي (اختياري)</label>
              <input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} placeholder="1234567" className="w-full rounded-lg border p-3 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm">واتساب (بدون 0)</label>
              <input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="2499xxxxxxx" className="w-full rounded-lg border p-3 outline-none" dir="ltr" />
            </div>
          </div>
        </div>

        <button onClick={create} disabled={saving || slugStatus === "taken"} className="mt-6 w-full rounded-lg bg-black py-3 font-black text-white hover:bg-gray-800 disabled:opacity-50">
          {saving ? "جاري الإنشاء..." : "إنشاء المتجر"}
        </button>

        <p className="mt-3 text-center text-xs text-gray-500">بعد الإنشاء حتقدر تضيف الشعار والبانر من صفحة تخصيص المتجر</p>
      </div>
    </div>
  );
}