import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export function ProductGrid({ products = [], showSeller = true }) {
  const { addToCart } = useCart();

  if (!products.length) {
    return <div className="rounded-2xl border border-sky-100 bg-white p-10 text-center text-sky-700">لا توجد منتجات</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div key={product.id} className="flex flex-col rounded-2xl border border-sky-100 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <Link to={`/product/${product.id}`}>
            <img
              src={product.image_url}
              alt={product.name}
              className="h-40 w-full rounded-xl bg-sky-50 object-cover mb-2"
            />
          </Link>

          <Link to={`/product/${product.id}`}>
            <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-2">{product.name}</h3>
          </Link>

          {showSeller && product.sellers && (
            <p className="text-xs text-gray-500 mb-2">بواسطة: {product.sellers.store_name}</p>
          )}

            <p className="mb-6 text-lg font-bold text-emerald-600">{product.price} جنيه</p>

          <div className="mt-auto flex gap-2">
            <button
              onClick={() => addToCart({ ...product, seller: product.sellers })}
              className="flex-1 rounded-xl bg-sky-500 py-2 text-sm text-white hover:bg-sky-600"
            >
              اضف للسلة
            </button>

            <Link to={`/product/${product.id}`} className="rounded-xl bg-sky-100 px-3 py-2 text-sm text-sky-700">
              عرض التفاصيل
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;

