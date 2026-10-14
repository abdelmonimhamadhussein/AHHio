import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const cityOptions = ["امدرمان", "الخرطوم بحري", "بورتسودان", "مدني", "كسلا", "القضارف"];
const themeColors = ["#0EA5E9"];
const arabicSlugMap = {
  ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh",
  د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z",
  ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "h",
  و: "w", ي: "y", ى: "a",
};

function createSlug(value) {
  return value
    .toLowerCase()
    .replace(/[\u0621-\u064A]/g, (character) => arabicSlugMap[character] || "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "store";
}

export default function VendorSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "true";
  const requestedPlan = searchParams.get("plan");
  const selectedPlan = ["free", "pro", "vip"].includes(requestedPlan) ? requestedPlan : "free";
  const databasePlan = selectedPlan === "free" ? "basic" : selectedPlan;
  const [tenant, setTenant] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [slugStatus, setSlugStatus] = useState("idle");
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    slug: "",
    description: "",
    city: "",
    bank_account: "",
    delivery_fee: "0",
    whatsapp_number: "",
    instagram: "",
    theme_color: "#0EA5E9",
    logo_url: "",
    banner_url: "",
  });
  const [saving, setSaving] = useState(false);
  const logoInput = useRef(null);
  const bannerInput = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/vendor", { replace: true });
        setPageLoading(false);
        return;
      }

      const { data, error } = await supabase.from("tenants").select("*").eq("owner_id", user.id).maybeSingle();
      if (error) {
        alert(error.message);
        setPageLoading(false);
        return;
      }
      if (!data) {
        if (!onboarding) {
          navigate("/vendor/dashboard", { replace: true });
          setPageLoading(false);
          return;
        }
        setForm((prev) => ({ ...prev, whatsapp_number: user.user_metadata?.whatsapp || "" }));
        setPageLoading(false);
        return;
      }
      setTenant(data);
      setForm({
        store_name: data.store_name || "",
        slug: data.slug || "",
        description: data.description || "",
        city: data.city || "الخرطوم بحري",
        bank_account: data.bank_account || "",
        delivery_fee: String(data.delivery_fee ?? 0),
        whatsapp_number: data.whatsapp_number || "",
        instagram: data.instagram || "",
        theme_color: data.theme_color || "#0EA5E9",
        logo_url: data.logo_url || "",
        banner_url: data.banner_url || "",
      });
      setPageLoading(false);
    }
    load();
  }, [navigate, onboarding]);

  useEffect(() => {
    if (!form.slug || form.slug.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      setSlugStatus(form.slug ? "invalid" : "idle");
      return;
    }
    if (form.slug === tenant?.slug) {
      setSlugStatus("available");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      let query = supabase.from("tenants").select("id").eq("slug", form.slug);
      if (tenant?.id) query = query.neq("id", tenant.id);
      const { data, error } = await query.maybeSingle();
      setSlugStatus(error ? "idle" : data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [form.slug, tenant]);

  const previewUrl = useMemo(() => `/store/${form.slug || tenant?.slug || "shop"}`, [form.slug, tenant]);

  const updateStoreName = (storeName) => {
    setForm((prev) => ({
      ...prev,
      store_name: storeName,
      ...(onboarding && !slugTouched ? { slug: createSlug(storeName) } : {}),
    }));
  };

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
    setForm((prev) => ({ ...prev, [type === "logo" ? "logo_url" : "banner_url"]: data?.publicUrl || "" }));
  };

  const save = async () => {
    if (!form.store_name.trim()) {
      alert("أدخل اسم المتجر");
      return;
    }
    if (form.slug.length < 3 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      alert("الرابط يجب أن يتكون من 3 أحرف أو أكثر باللغة الإنجليزية والأرقام والشرطة فقط");
      return;
    }

    const deliveryFee = Number(form.delivery_fee);
    if (!onboarding && (!Number.isFinite(deliveryFee) || deliveryFee < 0)) {
      alert("رسوم التوصيل يجب أن تكون رقماً يساوي صفراً أو أكبر");
      return;
    }

    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("انتهت الجلسة، سجّل الدخول مرة أخرى");

      const { data: duplicate, error: slugError } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", form.slug)
        .maybeSingle();
      if (slugError) throw slugError;
      if (duplicate && duplicate.id !== tenant?.id) throw new Error("هذا الرابط مستخدم بالفعل");

      const updates = {
        store_name: form.store_name.trim(),
        slug: form.slug,
        description: form.description,
        logo_url: form.logo_url,
      };
      let savedTenant;

      if (tenant) {
        const fullUpdates = onboarding ? updates : {
          ...updates,
          city: form.city,
          bank_account: form.bank_account,
          delivery_fee: deliveryFee,
          whatsapp_number: form.whatsapp_number,
          instagram: form.instagram,
          theme_color: form.theme_color,
          banner_url: form.banner_url,
        };
        const { data, error } = await supabase.from("tenants").update(fullUpdates).eq("id", tenant.id).select().single();
        if (error) throw error;
        savedTenant = data;
      } else {
        const { data, error } = await supabase.from("tenants").insert({
          owner_id: user.id,
          owner_name: user.user_metadata?.full_name || form.store_name.trim(),
          store_name: form.store_name.trim(),
          slug: form.slug,
          description: form.description,
          whatsapp_number: user.user_metadata?.whatsapp || "",
          logo_url: form.logo_url,
          theme_color: "#0EA5E9",
          city: "الخرطوم بحري",
          status: "active",
          is_verified: false,
          plan: databasePlan,
        }).select().single();
        if (error) throw error;
        savedTenant = data;
      }

      setTenant(savedTenant);
      localStorage.setItem("tenant", JSON.stringify(savedTenant));
      if (onboarding) {
        navigate("/vendor/dashboard", { replace: true });
      } else {
        alert("تم حفظ إعدادات المتجر بنجاح");
      }
    } catch (saveError) {
      alert(saveError.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <div className="p-10 text-center text-black">...جاري التحميل</div>;
  if (!tenant && !onboarding) return null;

  return (
    <div dir="rtl" className="mx-auto max-w-4xl px-4 py-8 text-black">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black text-black">{onboarding ? "أكمل إعداد متجرك" : "تخصيص المتجر"}</h1>
        {!onboarding && <button onClick={() => window.open(previewUrl, "_blank")} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">معاينة</button>}
      </div>

      <div className="rounded-lg border border-black bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.store_name} onChange={(e) => updateStoreName(e.target.value)} placeholder="اسم المتجر" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <div className="rounded-lg border border-black bg-white p-3">
            <label htmlFor="store-slug" className="mb-2 block text-sm text-black">الرابط التعريفي (إنجليزي فقط)</label>
            <input id="store-slug" value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-") }); }} placeholder="store-name" className="w-full bg-white text-black outline-none" />
            <div className="mt-2 text-xs text-black">
              {slugStatus === "taken" ? "هذا الرابط مستخدم" : slugStatus === "available" ? "الرابط متاح" : slugStatus === "invalid" ? "أدخل 3 أحرف إنجليزية أو أكثر" : slugStatus === "checking" ? "يتم فحص الرابط..." : ""}
            </div>
          </div>

          {!onboarding && <>
          <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-lg border border-black bg-white p-3 text-black outline-none">
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} placeholder="رقم الحساب البنكي" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />

          <input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="واتساب بدون 0" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="Instagram" className="rounded-lg border border-black bg-white p-3 text-black outline-none" />
          </>}
        </div>

        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="وصف المتجر" className="mt-4 w-full rounded-lg border border-black bg-white p-3 text-black outline-none" />

        {onboarding ? (
          <div className="mt-5 rounded-lg border border-black bg-white p-4">
            <div className="mb-3 text-sm text-black">شعار المتجر (حتى 2MB)</div>
            <input ref={logoInput} type="file" accept="image/*" onChange={(e) => uploadFile("logo", e.target.files?.[0])} className="hidden" />
            <button type="button" onClick={() => logoInput.current?.click()} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">رفع الشعار</button>
            {form.logo_url && <img src={form.logo_url} alt="شعار المتجر" className="mt-3 h-20 w-20 rounded-full object-cover" />}
          </div>
        ) : <>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-black bg-white p-4">
            <div className="mb-3 text-sm text-black">شعار المتجر (2MB)</div>
            <input ref={logoInput} type="file" accept="image/*" onChange={(e) => uploadFile("logo", e.target.files?.[0])} className="hidden" />
            <button onClick={() => logoInput.current?.click()} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">رفع الشعار</button>
            {form.logo_url && <img src={form.logo_url} alt="logo" className="mt-3 h-20 w-20 rounded-full object-cover" />}
          </div>

          <div className="rounded-lg border border-black bg-white p-4">
            <div className="mb-3 text-sm text-black">بانر المتجر (5MB)</div>
            <input ref={bannerInput} type="file" accept="image/*" onChange={(e) => uploadFile("banner", e.target.files?.[0])} className="hidden" />
            <button onClick={() => bannerInput.current?.click()} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">رفع البانر</button>
            {form.banner_url && <img src={form.banner_url} alt="banner" className="mt-3 h-24 w-full rounded-2xl object-cover" />}
          </div>
        </div>

        <label className="mb-5 block rounded-lg border border-black bg-white p-3 text-sm text-black">
          رسوم التوصيل (جنيه)
          <input type="number" min="0" step="0.01" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} className="mt-2 w-full bg-white text-black outline-none" />
        </label>

        <div className="mt-5">
          <div className="mb-3 text-sm text-black">لون السمة</div>
          <div className="flex gap-3">
            {themeColors.map((color) => (
              <button key={color} onClick={() => setForm({ ...form, theme_color: color })} className={`h-10 w-10 rounded-full border-2 ${form.theme_color === color ? "border-white" : "border-transparent"}`} style={{ background: color }} />
            ))}
          </div>
        </div>
        </>}

        <button onClick={save} disabled={saving || slugStatus === "taken" || slugStatus === "checking"} className="mt-6 w-full rounded-lg bg-[#0EA5E9] px-5 py-3 font-black text-white hover:bg-[#0284C7] disabled:opacity-50">{saving ? "...جار الحفظ" : onboarding ? "حفظ وادخل لوحة التحكم" : "حفظ التغييرات"}</button>
      </div>
    </div>
  );
}