import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const cityOptions = ["الخرطوم", "امدرمان", "الخرطوم بحري", "بورتسودان", "مدني", "كسلا", "القضارف"];
const themeColors = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function StoreBranding({ tenant }) {
  const [slugStatus, setSlugStatus] = useState("idle");
  const [form, setForm] = useState({
    store_name: tenant?.store_name || "",
    slug: tenant?.slug || "",
    description: tenant?.description || "",
    city: tenant?.city || "الخرطوم بحري",
    bank_account: tenant?.bank_account || "",
    delivery_fee: String(tenant?.delivery_fee?? 0),
    whatsapp_number: tenant?.whatsapp_number || "",
    instagram: tenant?.instagram || "",
    theme_color: tenant?.theme_color || "#0EA5E9",
    logo_url: tenant?.logo_url || "",
    banner_url: tenant?.banner_url || "",
  });
  const [saving, setSaving] = useState(false);
  const logoInput = useRef(null);
  const bannerInput = useRef(null);

  useEffect(() => {
    if (!form.slug || form.slug === tenant?.slug) { setSlugStatus("idle"); return; }
    const clean = form.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (clean!== form.slug) setForm(p => ({...p, slug: clean}));
    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      const { data } = await supabase.from("tenants").select("id").eq("slug", clean).neq("id", tenant.id).maybeSingle();
      setSlugStatus(data? "taken" : "available");
    }, 600);
    return () => clearTimeout(timer);
  }, [form.slug, tenant?.slug, tenant?.id]);

  const previewUrl = useMemo(() => `/store/${form.slug || tenant?.slug || "shop"}`, [form.slug, tenant?.slug]);

  const uploadFile = async (type, file) => {
    if (!file) return;
    if (file.size > (type === "logo"? 2 : 5) * 1024 * 1024) {
      alert(type === "logo"? "حد الملف 2MB" : "حد الملف 5MB"); return;
    }
    const ext = file.name.split(".").pop();
    const path = `${tenant.id}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { alert(error.message); return; }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    setForm((prev) => ({...prev, [type === "logo"? "logo_url" : "banner_url"]: data?.publicUrl || "" }));
  };

  const save = async () => {
    const deliveryFee = Number(form.delivery_fee);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) { alert("رسوم التوصيل يجب أن تكون رقماً"); return; }
    if (form.whatsapp_number &&!/^249\d{9}$/.test(form.whatsapp_number)) { alert("الواتساب لازم 2499xxxxxxx - 12 رقم"); return; }
    if (slugStatus === "taken") { alert("الرابط مستخدم"); return; }
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      store_name: form.store_name, slug: form.slug, description: form.description, city: form.city,
      bank_account: form.bank_account, delivery_fee: deliveryFee, whatsapp_number: form.whatsapp_number,
      instagram: form.instagram, theme_color: form.theme_color, logo_url: form.logo_url, banner_url: form.banner_url,
    }).eq("id", tenant.id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    alert("تم الحفظ ✅"); window.location.reload();
  };

  return (
    <div dir="rtl" className="mx-auto max-w-4xl py-2">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black">تخصيص المتجر</h2>
        <button onClick={() => window.open(previewUrl, "_blank")} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">معاينة</button>
      </div>
      <div className="rounded-lg border bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.store_name} onChange={e => setForm({...form, store_name: e.target.value})} placeholder="اسم المتجر" className="rounded-lg border p-3 outline-none" />
          <div className="rounded-lg border p-3">
            <div className="mb-1 text-sm">رابط المتجر (slug)</div>
            <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase()})} placeholder="store-name" className="w-full outline-none" dir="ltr" />
            <div className="mt-1 text-xs">{slugStatus === "taken"? "❌ مستخدم" : slugStatus === "available"? "✅ متاح" : slugStatus === "checking"? "فحص..." : ""}</div>
          </div>
          <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="rounded-lg border p-3 outline-none">{cityOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <input value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})} placeholder="رقم الحساب البنكي" className="rounded-lg border p-3 outline-none" />
          <input value={form.whatsapp_number} onChange={e => setForm({...form, whatsapp_number: e.target.value})} placeholder="2499xxxxxxx" className="rounded-lg border p-3 outline-none" dir="ltr" />
          <input value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="Instagram" className="rounded-lg border p-3 outline-none" dir="ltr" />
        </div>
        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="وصف المتجر" className="mt-4 w-full rounded-lg border p-3 outline-none" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm">شعار (2MB)</div>
            <input ref={logoInput} type="file" accept="image/*" onChange={e => uploadFile("logo", e.target.files?.[0])} className="hidden" />
            <button onClick={() => logoInput.current?.click()} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">رفع الشعار</button>
            {form.logo_url && <img src={form.logo_url} className="mt-2 h-16 w-16 rounded-full object-cover" />}
          </div>
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm">بانر (5MB)</div>
            <input ref={bannerInput} type="file" accept="image/*" onChange={e => uploadFile("banner", e.target.files?.[0])} className="hidden" />
            <button onClick={() => bannerInput.current?.click()} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">رفع البانر</button>
            {form.banner_url && <img src={form.banner_url} className="mt-2 h-20 w-full rounded object-cover" />}
          </div>
        </div>
        <div className="mt-4"><div className="mb-2 text-sm">لون السمة</div><div className="flex gap-2">{themeColors.map(c => <button key={c} onClick={() => setForm({...form, theme_color: c})} className={`h-10 w-10 rounded-full border-2 ${form.theme_color===c? "border-black" : "border-transparent"}`} style={{background:c}} />)}</div></div>
        <div className="mt-4"><label className="text-sm">رسوم التوصيل<input type="number" min="0" value={form.delivery_fee} onChange={e => setForm({...form, delivery_fee: e.target.value})} className="mt-1 w-full rounded-lg border p-3 outline-none" /></label></div>
        <button onClick={save} disabled={saving} className="mt-6 w-full rounded-lg bg-[#0EA5E9] py-3 font-black text-white disabled:opacity-50">{saving? "جاري..." : "حفظ التغييرات"}</button>
      </div>
    </div>
  );
}