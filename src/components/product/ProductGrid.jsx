import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../../lib/currency";

export function ProductGrid({ products = [], showSeller = true }) {
  const { addToCart } = useCart();

  if (!products.length) {
    return <div className="bg-white border border-sky-100 text-black rounded-lg p-10 text-center">لا توجد منتجات</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} className="bg-white border border-sky-100 text-black flex flex-col rounded-lg p-3">
          <Link to={`/product/${product.id}`}>
            <img
              src={product.images?.[0] || product.image_url}
              alt={product.name}
              className="mb-2 h-40 w-full rounded-lg bg-white object-cover"
            />
          </Link>

          <Link to={`/product/${product.id}`}>
            <h3 className="mb-1 line-clamp-2 text-sm font-bold text-black md:text-base">{product.name}</h3>
          </Link>

          {showSeller && (
            <p className="mb-2 text-xs text-black">بواسطة: {product.tenant?.store_name || product.sellers?.store_name || "المتجر"}</p>
          )}

          <p className="mb-2 text-lg font-bold text-black">{formatCurrency(product.price)}</p>
          <p className="mb-6 text-sm text-amber-600">
            ⭐ {Number(product.rating ?? product.tenant?.rating ?? product.sellers?.rating ?? 0).toFixed(1)}
          </p>

          <div className="mt-auto flex gap-2">
            <button
              onClick={() => addToCart({ ...product, seller: product.tenant || product.sellers })}
              className="flex-1 rounded-lg bg-[#0EA5E9] py-2 text-sm text-white hover:bg-[#0284C7]"
            >
              اضف للسلة
            </button>

            <Link to={`/product/${product.id}`} className="rounded-lg border border-black px-3 py-2 text-sm text-black">
              عرض التفاصيل
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;

