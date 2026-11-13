
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import useSubscription from "../../hooks/useSubscription";
import OnboardingCheckList from "../../components/Vendor/OnboardingChecklist";
import StoreSettings from "../../components/Vendor/vendorSettings";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get("tab");
    return ["products", "branding", "settings"].includes(t) ? t : "products";
  });
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, city, store_name, store_slug, store_description, store_logo_url, store_banner_url, role, vendor_status, is_vendor_approved")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        navigate("/vendor/create-store", { replace: true });
        return;
      }

      if (!profileData.store_name || !profileData.store_slug) {
        navigate("/vendor/create-store", { replace: true });
        return;
      }

      setProfile(profileData);

      const { data: items } = await supabase
        .from("products")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      setProducts(items || []);
      setLoading(false);
    }
    load();
  }, [navigate]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (["products", "branding", "settings"].includes(t)) setActiveTab(t);
  }, [searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const subscription = useSubscription(profile?.id);

  if (loading) return <div className="p-10 text-center">جاري التحميل...</div>;
  if (!profile) return null;

  // --- 1. حالة انتظار الموافقة - بنعتمد على vendor_status بس ---
  // لو الأدمن وافق (approved)، حتى لو is_vendor_approved = false، بنخليه يدخل
  if (profile.vendor_status === "pending") {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-2xl border bg-white p-8 text-center">
        <div className="text-4xl mb-3">⏳</div>
        <h1 className="text-2xl font-black">متجرك في انتظار الموافقة</h1>
        <p className="mt-3 text-gray-600 text-sm">
          متجر <b>{profile.store_name}</b> ({profile.store_slug}.ahhio.com) تم انشاؤه بنجاح.
          <br /> فريقنا حيراجعو وحنوافق عليهو خلال 24 ساعة.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/vendor/billing" className="rounded-lg bg-[#0EA5E9] px-6 py-3 font-bold text-white">حالة الدفع / الفواتير</Link>
          <a href="https://wa.me/249910070934" target="_blank" rel="noreferrer" className="rounded-lg border px-6 py-3 font-bold">واتساب الإدارة</a>
        </div>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-right">
          <p className="text-sm font-bold mb-2">في الوقت ده، جهز متجرك:</p>
          <OnboardingCheckList />
        </div>
      </div>
    );
  }

  if (profile.vendor_status === "blocked" || subscription.isBlocked) {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-lg border bg-white p-8 text-center">
        <h1 className="text-3xl font-black">المتجر محظور</h1>
        <p className="mt-3">تم منع المتجر، يرجى التواصل مع الإدارة لمعرفة السبب.</p>
        <a href="https://wa.me/249910070934" target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-lg bg-[#0EA5E9] px-6 py-3 font-bold text-white">واتساب الإدارة</a>
      </div>
    );
  }

  const isSubscriptionExpired =
    subscription.isExpired ||
    (!subscription.loading && subscription.subscription?.end_date && subscription.daysLeft <= 0);

  if (isSubscriptionExpired) {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-lg border bg-white p-8 text-center">
        <h1 className="text-3xl font-black">انتهت الباقة</h1>
        <p className="mt-3">اشتراكك انتهى. جدد الآن عشان متجرك يرجع يشتغل.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/vendor/billing" className="rounded-lg bg-[#0EA5E9] px-6 py-3 font-bold text-white">تجديد</Link>
          <Link to="/vendor/renew" className="rounded-lg border px-6 py-3 font-bold">صفحة التجديد</Link>
        </div>
        <a href="https://wa.me/249910070934" target="_blank" rel="noreferrer" className="mt-6 inline-block text-sm text-gray-500 underline">واتساب الإدارة</a>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* تنبيه قرب الانتهاء */}
        {subscription.daysLeft > 0 && subscription.daysLeft <= 3 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="text-sm font-bold">⚠️ تبقى لك {subscription.daysLeft} {subscription.daysLeft === 1 ? "يوم" : "أيام"} على انتهاء الباقة - جدد الآن</p>
            <Link to="/vendor/billing" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">تجديد</Link>
          </div>
        )}

        {/* الهيدر */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-5">
          <div className="flex items-center gap-3">
            {profile.store_logo_url ? (
              <img src={profile.store_logo_url} className="w-14 h-14 rounded-full object-cover border" alt="logo" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🏪</div>
            )}
            <div>
              <div className="text-sm text-gray-500">لوحة المتجر • {profile.vendor_status}</div>
              <h1 className="text-3xl font-black">{profile.store_name}</h1>
              <p className="text-xs text-gray-400">{profile.store_slug}.ahhio.com</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/store/${profile.store_slug}`} className="rounded-lg border px-4 py-2 text-sm font-bold">عرض المتجر</Link>
            <Link to="/vendor/add-product" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">إضافة منتج</Link>
            <Link to="/vendor/orders" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">الطلبات</Link>
            <Link to="/vendor/delivery" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">مندوبين التوصيل</Link>
            <button onClick={() => changeTab("branding")} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">إعدادات</button>
          </div>
        </div>

        <div className="mb-6">
          <OnboardingCheckList />
        </div>

        <div className="mb-6 flex gap-2 border-b" role="tablist">
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
              className={`border-b-2 px-4 py-3 text-sm font-bold ${activeTab === tab ? "border-sky-500" : "border-transparent text-gray-500"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "branding" ? (
          <StoreSettings />
        ) : activeTab === "settings" ? (
          <div className="rounded-lg border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm">الباقة الحالية</div>
                <div className="text-xl font-black">{subscription.plan?.name || "مجانية"}</div>
                <div className="mt-2 text-sm">الحد الأقصى للمنتجات: {subscription.plan?.max_products || 5}</div>
              </div>
              {subscription.daysLeft > 0 && subscription.daysLeft <= 3 && (
                <div className="text-left">
                  <div className="text-sm">متبقي</div>
                  <div className="text-xl font-black">{subscription.daysLeft} يوم</div>
                </div>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/vendor/billing" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">الفواتير والاشتراك</Link>
              <Link to="/vendor/delivery" className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white">إدارة مندوبي التوصيل</Link>
            </div>
          </div>
        ) : (
          products.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white p-12 text-center">
              <p className="font-bold">لا توجد منتجات حتى الآن.</p>
              <Link to="/vendor/add-product" className="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-sm">اضف أول منتج</Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="bg-white border overflow-hidden rounded-lg">
                  <img src={product.images?.[0] || product.image_url || "https://placehold.co/600x400/fff/000?text=AHHio"} alt={product.name} className="h-48 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="mt-2 text-lg font-black">{Number(product.price || 0).toLocaleString()} SDG</p>
                    <p className="mt-2 text-sm">المخزون: {product.stock || 0}</p>
                    <Link to={`/vendor/edit-product/${product.id}`} className="mt-3 inline-block rounded-lg border px-3 py-1 text-sm font-bold">تعديل</Link>
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