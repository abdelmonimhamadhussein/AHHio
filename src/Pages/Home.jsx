import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const categories = [
  "ملابس",
  "الكترونيات",
  "مستحضرات",
  "أجهزة منزلية",
];

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

  if (loading) return <div className="p-20 text-center text-[#D4AF37]">...جاري التحميل</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#111111] text-white">
      <section className="rounded-[28px] bg-gradient-to-r from-[#E91E63] via-[#111111] to-[#D4AF37] p-6 shadow-2xl shadow-[#E91E63]/20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 text-sm font-medium tracking-[0.2em] text-[#D4AF37]">AHHio Market</p>
              <h1 className="text-4xl font-black md:text-5xl">متجرك الرقمي يبدأ من هنا</h1>
              <p className="mt-4 text-base text-white/80">أكبر منصة للتجار المحليين في السودان، مع اشتراكات مرنة وطلبات سريعة.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/vendor/register" className="rounded-full bg-[#E91E63] px-6 py-3 font-bold text-white">ابدأ بيعك الآن</Link>
                <Link to="/shop" className="rounded-full border border-white/35 bg-white/5 px-6 py-3 font-bold text-white">تصفح المتاجر</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center md:w-[320px]">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <div className="text-2xl font-black text-[#D4AF37]">250+</div>
                <div className="text-sm text-white/75">متجر</div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <div className="text-2xl font-black text-[#D4AF37]">12k</div>
                <div className="text-sm text-white/75">طلب</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#D4AF37]">أفضل المتاجر</h2>
          <Link to="/shop" className="text-sm text-[#E91E63]">عرض الكل</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link key={store.id} to={`/store/${store.slug || store.store_name}`} className="rounded-[24px] border border-white/10 bg-[#171717] p-4 transition hover:border-[#D4AF37]/70">
              <div className="flex items-center gap-3">
                <img src={store.logo_url || "https://placehold.co/80x80/111/fff?text=AH"} alt={store.store_name} className="h-14 w-14 rounded-full border-2 border-[#D4AF37] object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-white">{store.store_name}</div>
                  <div className="text-sm text-white/60">{store.city || "الخرطوم"}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-[#D4AF37]">
                <span>⭐ {Number(store.rating || 0).toFixed(1)}</span>
                <span className="rounded-full bg-[#E91E63]/15 px-2 py-1 text-[#E91E63]">{store.is_verified ? "موثوق" : "متجر"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <h2 className="mb-4 text-2xl font-black text-[#D4AF37]">الفئات</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, index) => (
            <div key={cat} className="rounded-[22px] border border-white/10 bg-[#171717] p-5">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E91E63]/15 text-xl text-[#E91E63]">{index + 1}</div>
              <h3 className="text-lg font-bold text-white">{cat}</h3>
              <p className="mt-2 text-sm text-white/60">منتجات مختارة بعناية</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#D4AF37]">آخر المنتجات</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} to={`/product/${product.id}`} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#171717]">
              <img src={product.images?.[0] || product.image_url || "https://placehold.co/600x400/111/D4AF37?text=AHHio"} alt={product.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="text-sm text-[#D4AF37]">{product.tenant?.store_name || "متجر"}</div>
                <h3 className="mt-2 truncate font-bold text-white">{product.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-black text-[#E91E63]">{Number(product.price || 0).toLocaleString()} SDG</span>
                  <span className="rounded-full bg-[#D4AF37]/15 px-2 py-1 text-xs text-[#D4AF37]">{product.stock || 0} في المخزن</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}