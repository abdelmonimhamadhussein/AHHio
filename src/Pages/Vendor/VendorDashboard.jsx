import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useSubscription from "../../hooks/useSubscription";
import { supabase } from "../../lib/supabase";
import StoreBranding from "../../components/vendor/StoreBranding";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = searchParams.get("tab");
    return ["products", "branding", "settings"].includes(requestedTab) ? requestedTab : "products";
  });
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

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (["products", "branding", "settings"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const subscription = useSubscription(tenant?.id);

  if (loading) return <div className="p-10 text-center text-black">...جاري التحميل</div>;
  if (!tenant) return null;

  if (subscription.isBlocked) {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-lg border border-black bg-white p-8 text-center text-black">
        <h1 className="text-3xl font-black text-black">المتجر محظور</h1>
        <p className="mt-3 text-black">تم منع المتجر بسبب انتهاء الاشتراك، يرجى التواصل مع الإدارة.</p>
      </div>
    );
  }

  if (subscription.isExpired) {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-lg border border-black bg-white p-8 text-center text-black">
        <h1 className="text-3xl font-black text-black">انتهت فترتك</h1>
        <p className="mt-3 text-black">ادفع خلال 3 أيام لاستمرار المتجر.</p>
        <a href="https://wa.me/249910070934" target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-lg bg-[#0EA5E9] px-6 py-3 font-bold text-white hover:bg-[#0284C7]">واتساب الإدارة</a>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-black bg-white p-5">
          <div>
            <div className="text-sm text-black">لوحة المتجر</div>
            <h1 className="text-3xl font-black text-black">{tenant.store_name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/store/${tenant.slug}`} className="rounded-lg border border-black px-4 py-2 text-sm font-bold text-black">عرض المتجر</Link>
            <Link to="/vendor/add-product" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">إضافة منتج</Link>
            <Link to="/vendor/orders" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">الطلبات</Link>
            <Link to="/vendor/delivery" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">مندوبين التوصيل</Link>
            <button onClick={() => changeTab("branding")} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">إعدادات</button>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-black" role="tablist" aria-label="أقسام لوحة المتجر">
          {[
            ["products", "المنتجات"],
            ["branding", "تخصيص المتجر"],
            ["settings", "الإعدادات"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => changeTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-bold ${activeTab === tab ? "border-sky-500 text-black" : "border-transparent text-black"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "branding" ? (
          <StoreBranding tenant={tenant} />
        ) : activeTab === "settings" ? (
          <div className="rounded-lg border border-black bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-black">الباقة الحالية</div>
                <div className="text-xl font-black text-black">{subscription.plan?.name || "مخصصة"}</div>
                <div className="mt-2 text-sm text-black">الحد الأقصى للمنتجات: {subscription.plan?.max_products || 0}</div>
              </div>
              <div className="text-left">
                <div className="text-sm text-black">متبقي</div>
                <div className="text-xl font-black text-black">{subscription.daysLeft || 0} يوم</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/vendor/billing" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">الفواتير والاشتراك</Link>
              <Link to="/vendor/delivery" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">إدارة مندوبي التوصيل</Link>
            </div>
          </div>
        ) : (
          products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black bg-white p-12 text-center text-black">
              لا توجد منتجات حتى الآن.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="bg-white border border-sky-100 text-black overflow-hidden rounded-lg">
                  <img src={product.images?.[0] || product.image_url || "https://placehold.co/600x400/fff/000?text=AHHio"} alt={product.name} className="h-48 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-black">{product.name}</h3>
                    <p className="mt-2 text-lg font-black text-black">{Number(product.price || 0).toLocaleString()} SDG</p>
                    <p className="mt-2 text-sm text-black">المخزون: {product.stock || 0}</p>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
