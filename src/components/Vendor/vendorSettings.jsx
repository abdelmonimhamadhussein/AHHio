import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function SettingsPage() {
  const [store, setStore] = useState({
    store_name: "",
    description: "",
    city: "",
    phone: "",
    whatsapp_number: "",
    bank_account: "",
    instagram: "",
    delivery_fee: 0,
    theme_color: "#E91E63",
    logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      if (data) setStore(data);
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("tenants")
      .update({
        store_name: store.store_name,
        description: store.description,
        city: store.city,
        phone: store.phone,
        whatsapp_number: store.whatsapp_number,
        bank_account: store.bank_account,
        instagram: store.instagram,
        delivery_fee: store.delivery_fee,
        theme_color: store.theme_color,
      })
      .eq("owner_id", user.id);
    setSaving(false);
    if (!error) alert("تم الحفظ ✅");
    else alert(error.message);
  }

  if (loading) return <p className="p-5">جاري التحميل...</p>;

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-4">
      <h1 className="text-2xl font-bold">اعدادات المتجر</h1>

      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h2 className="font-bold">معلومات المتجر</h2>
        <input className="w-full border p-3 rounded-xl" placeholder="اسم المتجر" value={store.store_name || ""} onChange={e => setStore({...store, store_name: e.target.value})} />
        <textarea className="w-full border p-3 rounded-xl" placeholder="وصف المتجر" value={store.description || ""} onChange={e => setStore({...store, description: e.target.value})} />
        <input className="w-full border p-3 rounded-xl" placeholder="المدينة" value={store.city || ""} onChange={e => setStore({...store, city: e.target.value})} />
        <input className="w-full border p-3 rounded-xl" placeholder="رقم الهاتف" value={store.phone || ""} onChange={e => setStore({...store, phone: e.target.value})} />
      </div>

      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h2 className="font-bold">الدفع والتوصيل</h2>
        <input className="w-full border p-3 rounded-xl" placeholder="رقم الواتساب" value={store.whatsapp_number || ""} onChange={e => setStore({...store, whatsapp_number: e.target.value})} />
        <input className="w-full border p-3 rounded-xl" placeholder="حساب البنك" value={store.bank_account || ""} onChange={e => setStore({...store, bank_account: e.target.value})} />
        <input className="w-full border p-3 rounded-xl" placeholder="انستقرام" value={store.instagram || ""} onChange={e => setStore({...store, instagram: e.target.value})} />
        <input type="number" className="w-full border p-3 rounded-xl" placeholder="رسوم التوصيل" value={store.delivery_fee || 0} onChange={e => setStore({...store, delivery_fee: e.target.value})} />
      </div>

      <button onClick={save} className="w-full bg-blue-600 text-white py-3 rounded-full font-bold">
        {saving ? "جاري الحفظ..." : "حفظ الاعدادات"}
      </button>
    </div>
  );
}