import { useEffect, useRef, useState } from "react";
import { ProductGrid } from "../product/ProductGrid";
import LoadMore from "../LoadMore";
import { getShopProducts } from "../../lib/shopProducts";
import { useLocation } from "react-router-dom";

export default function ShopPage() {
  const { state: navigationState } = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);
  const loadingMoreRequest = useRef(null);
  const pageSize = 12;

  // Changing a filter invalidates pending requests and starts from page one.
  useEffect(() => {
    const activeRequest = ++requestId.current;
    setProducts([]);
    setPage(1);
    setTotal(0);
    setHasMore(false);
    setLoading(true);
    loadingMoreRequest.current = null;
    setLoadingMore(false);
    setError("");

    async function loadFirstPage() {
      try {
        const result = await getShopProducts({ page: 1, limit: pageSize, search, category });
        if (requestId.current !== activeRequest) return;
        setProducts(result.products);
        setTotal(result.total);
        setHasMore(result.hasMore);
      } catch (loadError) {
        if (requestId.current !== activeRequest) return;
        console.error("Failed to load shop products:", loadError);
        setError("تعذر تحميل المنتجات. يرجى المحاولة مرة أخرى.");
      } finally {
        if (requestId.current === activeRequest) setLoading(false);
      }
    }

    loadFirstPage();
    return () => {
      if (requestId.current === activeRequest) requestId.current += 1;
    };
  }, [search, category, reloadKey]);

  async function handleLoadMore() {
    if (loadingMoreRequest.current !== null || !hasMore) return;
    const activeRequest = requestId.current;
    const nextPage = page + 1;
    loadingMoreRequest.current = activeRequest;
    setLoadingMore(true);

    try {
      const result = await getShopProducts({
        page: nextPage,
        limit: pageSize,
        search,
        category,
      });
      if (requestId.current !== activeRequest) return;

      // Merge by ID so overlapping pages cannot render duplicate products.
      setProducts((current) => [
        ...current,
        ...result.products.filter((product) => !current.some((item) => item.id === product.id)),
      ]);
      setPage(nextPage);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setError("");
    } catch (loadError) {
      if (requestId.current !== activeRequest) return;
      console.error("Failed to load more shop products:", loadError);
      setError("تعذر تحميل المزيد من المنتجات. يرجى المحاولة مرة أخرى.");
    } finally {
      if (loadingMoreRequest.current === activeRequest) {
        loadingMoreRequest.current = null;
        setLoadingMore(false);
      }
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white px-4 py-8 text-black">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-black text-black">AHHio</h1>
        {navigationState?.registrationMessage && (
          <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">
            {navigationState.registrationMessage}
          </p>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <input
            type="search"
            placeholder="ابحث عن منتج"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black outline-none focus:border-sky-500"
          />
          <input
            type="search"
            placeholder="التصنيف"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black outline-none focus:border-sky-500"
          />
        </div>

        {loading ? (
          <p role="status" className="py-8 text-center">جاري البحث...</p>
        ) : (
          <>
            {error && (
              <div role="alert" className="mb-4 text-center text-red-600">
                <p>{error}</p>
                {products.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="mt-2 underline"
                  >
                    إعادة المحاولة
                  </button>
                )}
              </div>
            )}
            <ProductGrid products={products} />
            <LoadMore
              count={products.length}
              total={total}
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={handleLoadMore}
            />
          </>
        )}
      </div>
    </div>
  );
}