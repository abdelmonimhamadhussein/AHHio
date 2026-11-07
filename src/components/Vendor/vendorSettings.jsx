import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function SettingsPage() {
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    phone: "",
    avatar_url: "",
    city: "",
    store_name: "",
    store_slug: "",
    store_description: "",
    store_address: "",
    store_logo_url: "",
    store_banner_url: "",
    // حقول إضافية - خليها في profiles لو ما عندك جدول payouts
    whatsapp_number: "",
    bank_account: "",
    instagram: "",
    delivery_fee: 0,
    theme_color: "#E91E63",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [msg, setMsg] = useState("");

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // بنقرا من profiles بس - ما tenants ولا store
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setForm((prev) => ({ ...prev, ...data }));
      setLoading(false);
    }
    load();
  }, []);

  // رفع الشعار / البانر
  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    const { data: { user } } = await supabase.auth.getUser();
    const fileName = `${user.id}/${field}-${Date.now()}.${file.name.split(".").pop()}`;

    const { error: upErr } = await supabase.storage
      .from("store-assets")
      .upload(fileName, file, { upsert: true });

    if (upErr) {
      setMsg(upErr.message);
      setUploading("");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("store-assets")
      .getPublicUrl(fileName);

    update(field, urlData.publicUrl);
    setUploading("");
    setMsg("تم رفع الصورة، دوس حفظ عشان تثبت ✅");
  };

  async function save() {
    setSaving(true);
    setMsg("");
    const { data: { user } } = await supabase.auth.getUser();

    // بنحفظ في profiles بس، بنفس أسماء الحقول
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        username: form.username,
        phone: form.phone,
        avatar_url: form.avatar_url,
        city: form.city,
        store_name: form.store_name,
        store_description: form.store_description,
        store_address: form.store_address,
        store_logo_url: form.store_logo_url,
        store_banner_url: form.store_banner_url,
        // لو الحقول دي ما موجودة في profiles عندك، اعمل ليها عمود
        whatsapp_number: form.whatsapp_number,
        bank_account: form.bank_account,
        instagram: form.instagram,
        delivery_fee: Number(form.delivery_fee) || 0,
        theme_color: form.theme_color,
      })
      .eq("id", user.id);

    setSaving(false);
    if (!error) setMsg("تم الحفظ بنجاح ✅");
    else setMsg(error.message);
  }

  if (loading) return <p className="p-5">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">اعدادات المتجر</h1>
        {form.store_slug && (
          <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
            {form.store_slug}.ahhio.com
          </span>
        )}
      </div>

      {msg && (
        <p className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-200">{msg}</p>
      )}

      {/* 1. بيانات صاحب المتجر */}
      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h2 className="font-bold">بياناتك</h2>
        <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="الاسم الكامل" value={form.full_name || ""} onChange={e => update("full_name", e.target.value)} />
        <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="اسم المستخدم" value={form.username || ""} onChange={e => update("username", e.target.value)} />
        <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="رقم الهاتف" value={form.phone || ""} onChange={e => update("phone", e.target.value)} />
        <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="المدينة" value={form.city || ""} onChange={e => update("city", e.target.value)} />
      </div>

      {/* 2. معلومات المتجر */}
      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h2 className="font-bold">معلومات المتجر</h2>
        <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="اسم المتجر" value={form.store_name || ""} onChange={e => update("store_name", e.target.value)} />
        <textarea className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="وصف المتجر" rows={3} value={form.store_description || ""} onChange={e => update("store_description", e.target.value)} />
        <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="عنوان المتجر" value={form.store_address || ""} onChange={e => update("store_address", e.target.value)} />
      </div>

      {/* 3. الشعار والبانر - دي كانت null عندك */}
      <div className="bg-white p-5 rounded-2xl border space-y-4">
        <h2 className="font-bold">الشعار والبانر</h2>
        <div className="flex items-center gap-4">
          {form.store_logo_url ? (
            <img src={form.store_logo_url} alt="logo" className="w-16 h-16 rounded-full object-cover border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🏪</div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">شعار المتجر</p>
            <label className="text-sm bg-gray-100 px-4 py-2 rounded-full cursor-pointer inline-block">
              {uploading === "store_logo_url" ? "جاري الرفع..." : "ارفع الشعار"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "store_logo_url")} />
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">بانر المتجر</p>
          {form.store_banner_url && (
            <img src={form.store_banner_url} alt="banner" className="w-full h-32 object-cover rounded-xl mb-2" />
          )}
          <label className="text-sm bg-gray-100 px-4 py-2 rounded-full cursor-pointer inline-block">
            {uploading === "store_banner_url" ? "جاري الرفع..." : "ارفع البانر"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, "store_banner_url")} />
          </label>
        </div>
      </div>

      {/* 4. الدفع والتوصيل */}
      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h2 className="font-bold">الدفع والتوصيل</h2>
        <input className="w-full border p-3 rounded-xl" placeholder="رقم الواتساب" value={form.whatsapp_number || ""} onChange={e => update("whatsapp_number", e.target.value)} />
        <input className="w-full border p-3 rounded-xl" placeholder="حساب بنكك" value={form.bank_account || ""} onChange={e => update("bank_account", e.target.value)} />
        <input className="w-full border p-3 rounded-xl" placeholder="انستقرام" value={form.instagram || ""} onChange={e => update("instagram", e.target.value)} />
        <input type="number" className="w-full border p-3 rounded-xl" placeholder="رسوم التوصيل" value={form.delivery_fee || 0} onChange={e => update("delivery_fee", e.target.value)} />
        <div className="flex items-center gap-3">
          <label className="text-sm">لون المتجر</label>
          <input type="color" value={form.theme_color || "#E91E63"} onChange={e => update("theme_color", e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
        </div>
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-full font-bold sticky bottom-4">
        {saving ? "جاري الحفظ..." : "حفظ الاعدادات"}
      </button>
    </div>
  );
}

