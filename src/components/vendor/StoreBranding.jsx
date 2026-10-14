import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const cityOptions = ["امدرمان", "الخرطوم بحري", "بورتسودان", "مدني", "كسلا", "القضارف"];
const themeColors = ["#0EA5E9"];

export default function StoreBranding({ tenant }) {
  const [slugStatus, setSlugStatus] = useState("idle");
  const [form, setForm] = useState({
    store_name: tenant.store_name || "",
    slug: tenant.slug || "",
    description: tenant.description || "",
    city: tenant.city || "الخرطوم بحري",
    bank_account: tenant.bank_account || "",
    delivery_fee: String(tenant.delivery_fee ?? 0),
    whatsapp_number: tenant.whatsapp_number || "",
    instagram: tenant.instagram || "",
    theme_color: "#0EA5E9",
    logo_url: tenant.logo_url || "",
    banner_url: tenant.banner_url || "",
  });
  const [saving, setSaving] = useState(false);
  const logoInput = useRef(null);
  const bannerInput = useRef(null);

  useEffect(() => {
    if (!form.slug || form.slug === tenant.slug) return;
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("tenants").select("id").eq("slug", form.slug).maybeSingle();
      setSlugStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [form.slug, tenant.slug]);

  const previewUrl = useMemo(() => `/store/${form.slug || tenant.slug || "shop"}`, [form.slug, tenant.slug]);

  const uploadFile = async (type, file) => {
    if (!file) return;
    if (file.size > (type === "logo" ? 2 : 5) * 1024 * 1024) {
      alert(type === "logo" ? "حد الملف 2MB" : "حد الملف 5MB");
      return;
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const bucket = type === "logo" ? "logos" : "banners";
    const path = `${type}s/${fileName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setForm((previous) => ({ ...previous, [type === "logo" ? "logo_url" : "banner_url"]: data?.publicUrl || "" }));
  };

  const save = async () => {
    const deliveryFee = Number(form.delivery_fee);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      alert("رسوم التوصيل يجب أن تكون رقماً يساوي صفراً أو أكبر");
      return;
    }

    setSaving(true);
    const updates = {
      store_name: form.store_name,
      slug: form.slug,
      description: form.description,
      city: form.city,
      bank_account: form.bank_account,
      delivery_fee: deliveryFee,
      whatsapp_number: form.whatsapp_number,
      instagram: form.instagram,
      theme_color: form.theme_color,
      logo_url: form.logo_url,
      banner_url: form.banner_url,
    };
    const { error } = await supabase.from("tenants").update(updates).eq("id", tenant.id);
    setSaving(false);
    if (error) {
      alert(error.message || "حدث خطأ أثناء الحفظ");
      return;
    }
    alert("تم حفظ إعدادات المتجر بنجاح");
  };

  return (
    <div dir="rtl" className="mx-auto max-w-4xl py-2 text-black">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-black">تخصيص المتجر</h2>
        <button type="button" onClick={() => window.open(previewUrl, "_blank")} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">معاينة</button>
      </div>

      <div className="rounded-lg border border-black bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.store_name} onChange={(event) => setForm({ ...form, store_name: event.target.value })} placeholder="اسم المتجر" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <div className="rounded-lg border border-black bg-white p-3">
            <div className="mb-2 text-sm text-black">slug</div>
            <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="store-name" className="w-full bg-white text-black outline-none" />
            <div className="mt-2 text-xs text-black">
              {slugStatus === "taken" ? "هذا الرابط مستخدم" : slugStatus === "available" ? "الرابط متاح" : "يتم فحص الرابط..."}
            </div>
          </div>
          <select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="rounded-lg border border-black bg-white p-3 text-black outline-none">
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <input value={form.bank_account} onChange={(event) => setForm({ ...form, bank_account: event.target.value })} placeholder="رقم الحساب البنكي" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <input value={form.whatsapp_number} onChange={(event) => setForm({ ...form, whatsapp_number: event.target.value })} placeholder="واتساب بدون 0" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <input value={form.instagram} onChange={(event) => setForm({ ...form, instagram: event.target.value })} placeholder="Instagram" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />
        </div>

        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} placeholder="وصف المتجر" className="mt-4 w-full rounded-lg border border-black bg-white p-3 text-black outline-none" />

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black bg-white p-4">
            <div className="mb-3 text-sm text-black">شعار المتجر (2MB)</div>
            <input ref={logoInput} type="file" accept="image/*" onChange={(event) => uploadFile("logo", event.target.files?.[0])} className="hidden" />
            <button type="button" onClick={() => logoInput.current?.click()} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">رفع الشعار</button>
            {form.logo_url && <img src={form.logo_url} alt="شعار المتجر" className="mt-3 h-20 w-20 rounded-full object-cover" />}
          </div>
          <div className="rounded-lg border border-black bg-white p-4">
            <div className="mb-3 text-sm text-black">بانر المتجر (5MB)</div>
            <input ref={bannerInput} type="file" accept="image/*" onChange={(event) => uploadFile("banner", event.target.files?.[0])} className="hidden" />
            <button type="button" onClick={() => bannerInput.current?.click()} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">رفع البانر</button>
            {form.banner_url && <img src={form.banner_url} alt="بانر المتجر" className="mt-3 h-24 w-full rounded-2xl object-cover" />}
          </div>
        </div>

        <label className="mb-5 mt-5 block rounded-lg border border-black bg-white p-3 text-sm text-black">
          رسوم التوصيل (جنيه)
          <input type="number" min="0" step="0.01" value={form.delivery_fee} onChange={(event) => setForm({ ...form, delivery_fee: event.target.value })} className="mt-2 w-full bg-white text-black outline-none" />
        </label>

        <div className="mt-5">
          <div className="mb-3 text-sm text-black">لون السمة</div>
          <div className="flex gap-3">
            {themeColors.map((color) => (
              <button key={color} type="button" aria-label={`اختيار اللون ${color}`} onClick={() => setForm({ ...form, theme_color: color })} className={`h-10 w-10 rounded-full border-2 ${form.theme_color === color ? "border-white" : "border-transparent"}`} style={{ background: color }} />
            ))}
          </div>
        </div>

        <button type="button" onClick={save} className="mt-6 w-full rounded-lg bg-[#0EA5E9] px-5 py-3 font-black text-white hover:bg-[#0284C7]">{saving ? "...جار الحفظ" : "حفظ التغييرات"}</button>
      </div>
    </div>
  );
}