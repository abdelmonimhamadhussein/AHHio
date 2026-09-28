import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSubscription from "../../hooks/useSubscription";
import { supabase } from "../../lib/supabase";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        navigate("/vendor", { replace: true });
        return;
      }

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      const finalTenant = tenantData || null;
      setTenant(finalTenant);

      if (finalTenant) {
        const { data: items } = await supabase
          .from("products")
          .select("*")
          .eq("tenant_id", finalTenant.id)
          .order("id", { ascending: false });
        setProducts(items || []);
      }

      setLoading(false);
    }
    load();
  }, [navigate]);

  const subscription = useSubscription(tenant?.id);

  if (loading) return <div className="p-10 text-center text-[#D4AF37]">...جاري التحميل</div>;
  if (!tenant) return null;

  if (subscription.isBlocked) {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-[28px] border border-red-500/30 bg-[#171717] p-8 text-center">
        <h1 className="text-3xl font-black text-red-400">المتجر محظور</h1>
        <p className="mt-3 text-white/70">تم منع المتجر بسبب انتهاء الاشتراك، يرجى التواصل مع الإدارة.</p>
      </div>
    );
  }

  if (subscription.isExpired) {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-[28px] border border-[#E91E63]/30 bg-[#171717] p-8 text-center">
        <h1 className="text-3xl font-black text-[#E91E63]">انتهت فترتك</h1>
        <p className="mt-3 text-white/70">ادفع خلال 3 أيام لاستمرار المتجر.</p>
        <a href="https://wa.me/249910070934" target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-full bg-[#25D366] px-6 py-3 font-bold text-white">واتساب الإدارة</a>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#111111] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-[#171717] p-5">
          <div>
            <div className="text-sm text-[#D4AF37]">لوحة المتجر</div>
            <h1 className="text-3xl font-black">{tenant.store_name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/store/${tenant.slug}`} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white">عرض المتجر</Link>
            <Link to="/vendor/add-product" className="rounded-full bg-[#E91E63] px-4 py-2 text-sm font-bold text-white">إضافة منتج</Link>
            <Link to="/vendor/settings" className="rounded-full border border-[#D4AF37]/50 px-4 py-2 text-sm font-bold text-[#D4AF37]">إعدادات</Link>
          </div>
        </div>

        <div className="mb-6 rounded-[24px] border border-[#D4AF37]/25 bg-[#171717] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-white/60">الباقة</div>
              <div className="text-xl font-black text-[#D4AF37]">{subscription.plan?.name || "مخصصة"}</div>
            </div>
            <div className="text-left">
              <div className="text-sm text-white/60">متبقي</div>
              <div className="text-xl font-black text-[#E91E63]">{subscription.daysLeft || 0} يوم</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-white/70">الحد الأقصى للمنتجات: {subscription.plan?.max_products || 0}</div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-[#171717] p-12 text-center text-white/70">
            لا توجد منتجات حتى الآن.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#171717]">
                <img src={product.images?.[0] || product.image_url || "https://placehold.co/600x400/111/D4AF37?text=AHHio"} alt={product.name} className="h-48 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <p className="mt-2 text-lg font-black text-[#E91E63]">{Number(product.price || 0).toLocaleString()} SDG</p>
                  <p className="mt-2 text-sm text-white/60">المخزون: {product.stock || 0}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
