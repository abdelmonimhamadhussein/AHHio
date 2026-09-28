import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { checkLimit, PACKAGES } from "../../lib/Package";

const BANNED_WORD = [
  "حشيش",
  "بنقو",
  "سلاح",
  "مسدس",
  "كلاش",
  "مخدر",
  "ترامدول",
  "ايس",
  "دعارة",
  "قمار",
  "تزوير",
  "بنكك مزور",
];

export default function AddProduct() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remainingImages, setRemainingImages] = useState(0);
  const [form, setForm] = useState({ name: "", price: "", desc: "" });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    checkSub();
  }, []);

  async function checkSub() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      window.location.href = "/vendor";
      return;
    }

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("plan, id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (tenantError || !tenant) {
      window.location.href = "/vendor";
      return;
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_id, plan:plans(*)")
      .eq("tenant_id", tenant.id)
      .in("status", ["trial", "active"])
      .order("end_date", { ascending: false, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    const planId = subscription?.plan_id || tenant.plan || "basic";
    const plan = PACKAGES[planId] || PACKAGES.basic;
    if (plan.price > 0) {
      const endDate = subscription?.end_date ? new Date(subscription.end_date) : null;
      if (!subscription || (endDate && endDate < new Date())) {
        alert("اشتراكك منتهي - جدد الاشتراك");
        window.location.href = `/vendor/renew?plan=${plan.id}`;
        return;
      }
    }

    const { data: products } = await supabase.from("products").select("images").eq("tenant_id", tenant.id);
    const imageCount = (products || []).reduce((count, product) => count + (Array.isArray(product.images) ? product.images.length : 0), 0);
    setRemainingImages(checkLimit({ plan: planId, image_count: imageCount }).remaining);
    setAllowed(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) {
      alert("اختار صورة واحدة على الأقل");
      return;
    }

    if (files.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
      alert("يرجى اختيار صور فقط، وحجم كل صورة لا يتجاوز 5 ميجابايت");
      return;
    }

    setLoading(true);

    try {
      const fullText = `${form.name} ${form.desc}`.toLowerCase();
      const isBanned = BANNED_WORD.some((word) => fullText.includes(word.toLowerCase()));
      const status = isBanned ? "pending_review" : "active";

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        alert("يجب تسجيل الدخول كمتجر أولاً");
        return;
      }

      const { data: tenant, error: tenantError } = await supabase.from("tenants").select("plan, id").eq("owner_id", user.id).maybeSingle();
      if (tenantError || !tenant) throw new Error("المتجر غير موجود");
      const { data: subscription } = await supabase.from("subscriptions").select("plan_id").eq("tenant_id", tenant.id).in("status", ["trial", "active"]).order("end_date", { ascending: false, nullsFirst: true }).limit(1).maybeSingle();
      const planId = subscription?.plan_id || tenant.plan || "basic";
      const { data: products, error: productsError } = await supabase.from("products").select("images").eq("tenant_id", tenant.id);
      if (productsError) throw productsError;
      const imageCount = (products || []).reduce((count, product) => count + (Array.isArray(product.images) ? product.images.length : 0), 0);
      const remaining = checkLimit({ plan: planId, image_count: imageCount }).remaining;
      if (files.length > remaining) {
        setRemainingImages(remaining);
        alert(`الباقة تسمح برفع ${remaining} صورة إضافية فقط`);
        return;
      }

      const imageUrls = [];
      for (const file of files.slice(0, 5)) {
        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("products").upload(fileName, file);
        if (uploadError) throw uploadError;

        const publicUrl = supabase.storage.from("products").getPublicUrl(uploadData.path).data.publicUrl;
        imageUrls.push(publicUrl);
      }

      const { error } = await supabase.from("products").insert({
        tenant_id: tenant.id,
        vendor_id: user.id,
        name: form.name,
        description: form.desc,
        price: Number(form.price),
        images: imageUrls,
        status,
        is_active: !isBanned,
      });

      if (error) throw error;

      alert(
        isBanned
          ? "تم ارسال المنتج للمراجعة لأن فيه كلمة ممنوعة"
          : "تم نشر المنتج بنجاح"
      );
      window.location.href = "/vendor/dashboard";
    } catch (error) {
      alert(error.message || "حدث خطأ أثناء رفع المنتج");
    } finally {
      setLoading(false);
    }
  }

  if (!allowed) {
    return <div className="vendor-page text-center text-slate-600">...جاري التحقق من الاشتراك</div>;
  }

  return (
    <div className="vendor-page">
      <form onSubmit={handleSubmit} className="vendor-card mx-auto max-w-2xl space-y-4 p-5 sm:p-6">
        <div>
          <p className="vendor-subtitle">إدارة المنتجات</p>
          <h1 className="vendor-title">إضافة منتج جديد</h1>
        </div>

        <div>
          <label className="vendor-label">اسم المنتج</label>
          <input
            required
            placeholder="اسم المنتج"
            className="vendor-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="vendor-label">الوصف</label>
          <textarea
            required
            placeholder="الوصف"
            rows={4}
            className="vendor-input min-h-[120px] resize-none"
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </div>

        <div>
          <label className="vendor-label">السعر (SDG)</label>
          <input
            required
            type="number"
            placeholder="السعر SDG"
            className="vendor-input"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>

        <div>
          <label className="vendor-label">صور المنتج (المتبقي في باقتك: {remainingImages})</label>
          <input
            type="file"
            accept="image/*"
            multiple
            required
            disabled={remainingImages === 0}
            onChange={(e) => setFiles(Array.from(e.target.files).slice(0, Math.min(5, remainingImages)))}
            className="vendor-input mt-1"
          />
          <p className="mt-2 text-xs text-slate-500">يقبل الصور فقط، ويمكنك اختيار أكثر من صورة.</p>
          {remainingImages === 0 && <a href="/plans" className="text-sm font-bold text-blue-600">ترقية الباقة</a>}
        </div>

        <button type="submit" disabled={loading} className="vendor-btn">
          {loading ? "...جاري الرفع" : "نشر المنتج"}
        </button>
      </form>
    </div>
  );
}