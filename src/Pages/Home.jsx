import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("*")
        .eq("status", "active")
        .order("rating", { ascending: false })
        .limit(8);

      const { data: items } = await supabase
        .from("products")
        .select("*, tenant:tenants(store_name, slug, logo_url, rating)")
        .eq("is_active", true)
        .order("id", { ascending: false })
        .limit(12);

      setStores((tenants || []).slice(0, 6));
      setProducts(items || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-20 text-center text-black">...جاري التحميل</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-white text-black">
      <section className="border-b border-sky-100 bg-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-bold text-black">AHHio Market</p>
          <h1 className="max-w-2xl text-4xl font-black text-black sm:text-5xl">متجرك الرقمي يبدأ من هنا</h1>
          <p className="mt-4 max-w-xl text-base text-black">اكتشف منتجات التجار المحليين أو ابدأ متجرك الخاص عبر AHHio.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/shop" className="rounded-lg bg-sky-500 px-6 py-3 font-bold text-white hover:bg-[#0284C7]">تسوق الآن</Link>
            <Link to="/register" className="rounded-lg bg-sky-500 px-6 py-3 font-bold text-white hover:bg-[#0284C7]">ابدأ متجرك</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-black text-black">المتاجر</h2>
          <Link to="/shop" className="text-sm text-black">عرض الكل</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link key={store.id} to={`/store/${store.slug || store.store_name}`} className="bg-white border border-sky-100 text-black rounded-lg p-4">
              <div className="flex items-center gap-3">
                <img src={store.logo_url || "https://placehold.co/80x80/fff/000?text=AH"} alt={store.store_name} className="h-14 w-14 rounded-full border border-black object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-black">{store.store_name}</div>
                  <div className="text-sm text-black">{store.city || "الخرطوم"}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-black">
                <span>⭐ {Number(store.rating || 0).toFixed(1)}</span>
                <span>{store.is_verified ? "موثوق" : "متجر"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-black">منتجات مختارة</h2>
          <Link to="/shop" className="text-sm text-black">كل المنتجات</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="bg-white border border-sky-100 text-black overflow-hidden rounded-lg">
              <img src={product.images?.[0] || product.image_url || "https://placehold.co/600x400/fff/000?text=AHHio"} alt={product.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="text-sm text-black">{product.tenant?.store_name || "متجر"}</div>
                <h3 className="mt-2 truncate font-bold text-black">{product.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-black text-black">{Number(product.price || 0).toLocaleString()} SDG</span>
                  <span className="text-xs text-black">{product.stock || 0} في المخزن</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="bg-white border border-sky-100 text-black rounded-lg flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-2xl font-black text-black">خطط تناسب متجرك</h2>
            <p className="mt-2 text-black">ابدأ ووسّع تجارتك بخطة تناسب احتياجاتك.</p>
          </div>
          <Link to="/plans" className="rounded-lg bg-sky-500 px-5 py-3 font-bold text-white hover:bg-[#0284C7]">استعرض الخطط</Link>
        </div>
      </section>
    </div>
  );
}