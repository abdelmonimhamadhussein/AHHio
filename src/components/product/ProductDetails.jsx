import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (!productData) {
        setLoading(false);
        return;
      }

      setProduct(productData);

      const { data: storeData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", productData.tenant_id || productData.vendor_id)
        .maybeSingle();

      setStore(storeData || null);
      setLoading(false);
    }

    if (id) loadProduct();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-sky-700">...جاري التحميل</div>;
  if (!product) return <div className="p-10 text-center text-sky-700">المنتج غير موجود</div>;

  return (
    <div className="min-h-screen bg-sky-50 p-4">
      <div className="mx-auto max-w-5xl py-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <img src={product.image_url || product.images?.[0]} alt={product.name} className="w-full h-[420px] object-cover rounded-xl" />
        </div>

        <div className="space-y-4">
          <p className="text-sm text-sky-600">{store?.store_name || "المتجر"}</p>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-bold text-emerald-600">{product.price} جنيه</p>
          <p className="text-gray-700">{product.description || product.desc}</p>

          <div className="flex gap-3">
            <button
              onClick={() => addToCart({ ...product, tenant_id: product.tenant_id || product.vendor_id, seller: store })}
              className="rounded-xl bg-sky-500 px-5 py-3 text-white hover:bg-sky-600"
            >
              اضافة للسلة
            </button>
            <Link to="/" className="rounded-xl border border-sky-200 px-5 py-3 text-sky-700">العودة</Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}