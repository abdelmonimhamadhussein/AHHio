import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (loading) return <div className="p-10 text-center text-black">...جاري التحميل</div>;
  if (!product) return <div className="p-10 text-center text-black">المنتج غير موجود</div>;

  return (
    <div className="min-h-screen bg-white p-4 text-black">
      <div className="mx-auto max-w-5xl py-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-black bg-white p-4">
          <img src={product.image_url || product.images?.[0]} alt={product.name} className="w-full h-[420px] object-cover rounded-xl" />
        </div>

        <div className="space-y-4">
          <p className="text-sm text-black">{store?.store_name || "المتجر"}</p>
          <h1 className="text-3xl font-bold text-black">{product.name}</h1>
          <p className="text-2xl font-bold text-black">{product.price} جنيه</p>
          <p className="text-black">{product.description || product.desc}</p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                addToCart({ ...product, tenant_id: product.tenant_id || product.vendor_id, seller: store });
                navigate("/cart");
              }}
              className="rounded-lg bg-[#0EA5E9] px-5 py-3 font-bold text-white hover:bg-[#0284C7]"
            >
              أضف للسلة
            </button>
            <button
              type="button"
              onClick={() => {
                addToCart({ ...product, tenant_id: product.tenant_id || product.vendor_id, seller: store });
                navigate("/checkout");
              }}
              className="rounded-lg bg-[#0EA5E9] px-5 py-3 font-bold text-white hover:bg-[#0284C7]"
            >
              شراء الآن
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}