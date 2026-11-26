export default function LoadMore({ count, total, hasMore, loading, onLoadMore }) {
  return (
    <div dir="rtl" className="mt-8 w-full text-center">
      <p className="mb-4 text-sm text-gray-600">
        عرضت {count} من {total} منتج
      </p>

      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {loading ? "جاري التحميل..." : "عرض المزيد"}
        </button>
      ) : (
        <p className="rounded-xl bg-gray-50 px-5 py-3 text-gray-600">لا توجد منتجات أخرى</p>
      )}
    </div>
  );
}
