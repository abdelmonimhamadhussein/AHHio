import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../components/context/CartContext";
import { supabase } from "../lib/supabase";
import  AiTools  from "../components/AiTools";

export default function StorePage() {
  const { slug } = useParams();
  const { addToCart, items } = useCart();
  const [tenant, setTenant] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(true);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 1), 0),
    [items]
  );

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      const finalTenant = tenantData || null;
      setTenant(finalTenant);

      if (finalTenant) {
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .eq("tenant_id", finalTenant.id)
          .eq("is_active", true);
        setProducts(productData || []);
      } else {
        setProducts([]);
      }

      setLoading(false);
    }

    load();
  }, [slug]);

  if (loading) return <div className="p-10 text-center text-[#D4AF37]">...جاري التحميل</div>;

  if (!tenant) return <div className="p-10 text-center text-[#D4AF37]">المتجر غير موجود</div>;

  if (tenant.status !== "active") {
    return (
      <div dir="rtl" className="mx-auto mt-12 max-w-xl rounded-[28px] border border-[#E91E63]/30 bg-[#171717] p-8 text-center shadow-xl shadow-[#E91E63]/10">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#E91E63]/15 text-3xl text-[#E91E63]">⛔</div>
        <h1 className="text-3xl font-black text-white">المتجر مغلق مؤقتا</h1>
        <p className="mt-3 text-white/70">تم إيقاف المتجر حاليا، يرجى التواصل مع الإدارة.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-[#E91E63] px-6 py-3 font-bold text-white">العودة للرئيسية</Link>
      </div>
    );
  }

  const whatsappUrl = tenant.whatsapp_number ? `https://wa.me/249${String(tenant.whatsapp_number).replace(/^0+/, "")}` : "https://wa.me/249910070934";

  return (
    <div dir="rtl" className="min-h-screen bg-[#111111] text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#111111]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={tenant.logo_url || "https://placehold.co/80x80/111/D4AF37?text=AH"} alt={tenant.store_name} className="h-10 w-10 rounded-full border border-[#D4AF37] object-cover" />
            <span className="text-lg font-black text-white">{tenant.store_name}</span>
          </div>
          <Link to="/cart" className="rounded-full bg-[#E91E63] px-4 py-2 text-sm font-bold text-white">السلة ({cartCount})</Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#171717]">
          <img src={tenant.banner_url || "https://placehold.co/1200x400/111/D4AF37?text=AHHio"} alt={tenant.store_name} className="h-[220px] w-full object-cover md:h-[400px]" />
          <div className="absolute -bottom-8 left-6 flex items-end gap-4">
            <img src={tenant.logo_url || "https://placehold.co/120x120/111/D4AF37?text=AH"} alt={tenant.store_name} className="h-[120px] w-[120px] rounded-full border-4 border-[#111111] object-cover shadow-xl" />
            <div className="mb-3">
              <h1 className="text-2xl font-black text-white md:text-4xl">{tenant.store_name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                <span>{tenant.city || "الخرطوم"}</span>
                <span>⭐ {Number(tenant.rating || 0).toFixed(1)}</span>
                {tenant.is_verified && <span className="rounded-full bg-[#D4AF37]/15 px-2 py-1 text-[#D4AF37]">موثوق</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {['products', 'info'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm font-bold ${activeTab === tab ? "bg-[#E91E63] text-white" : "bg-white/5 text-white/70"}`}>
                {tab === 'products' ? 'المنتجات' : 'المعلومات'}
              </button>
            ))}
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white">واتساب</a>
        </div>

        {activeTab === "products" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#171717]">
                <img src={product.images?.[0] || product.image_url || "https://placehold.co/600x400/111/D4AF37?text=AHHio"} alt={product.name} className="h-52 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-black text-[#E91E63]">{Number(product.price || 0).toLocaleString()} SDG</span>
                    <button onClick={() => addToCart({ ...product, tenant_id: tenant.id, seller: tenant })} className="rounded-full bg-[#D4AF37] px-3 py-2 text-sm font-bold text-[#111111]">أضف للسلة</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#171717] p-6">
            <h3 className="text-xl font-black text-[#D4AF37]">عن المتجر</h3>
            <p className="mt-3 text-white/70">{tenant.description || "متجر يقدم منتجات متنوعة واهتماما كبيرا بالجودة والخدمة."}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-white/50">المدينة</div>
                <div className="mt-2 font-bold text-white">{tenant.city || "الخرطوم"}</div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="text-sm text-white/50">رقم الواتساب</div>
                <div className="mt-2 font-bold text-white">{tenant.whatsapp_number || "-"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mx-auto mt-12 max-w-6xl px-4">
        <AiTools storeId={tenant?.id} tenantName={tenant?.name} />
      </div>
    </div>
  );
}