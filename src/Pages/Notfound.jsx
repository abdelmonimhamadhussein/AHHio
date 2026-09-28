export default function Notfound() {
  return (
    <div className="min-h-screen bg-sky-50 px-4 py-20 text-center">
      <div className="mx-auto max-w-xl rounded-3xl border border-sky-100 bg-white p-10 shadow-sm">
        <h1 className="text-6xl font-black text-sky-700">404</h1>
        <p className="mt-4 text-lg text-slate-600">الصفحة غير موجودة</p>
        <a href="/" className="mt-6 inline-block rounded-xl bg-sky-500 px-5 py-3 font-medium text-white hover:bg-sky-600">
          الرجوع للرئيسية
        </a>
      </div>
    </div>
  );
}