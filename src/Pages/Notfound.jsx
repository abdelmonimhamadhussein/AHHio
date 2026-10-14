export default function Notfound() {
  return (
    <div className="min-h-screen bg-white px-4 py-20 text-center text-black">
      <div className="mx-auto max-w-xl rounded-lg border border-sky-100 bg-white p-10">
        <h1 className="text-6xl font-black text-black">404</h1>
        <p className="mt-4 text-lg text-black">الصفحة غير موجودة</p>
        <a href="/" className="mt-6 inline-block rounded-lg bg-[#0EA5E9] px-5 py-3 font-medium text-white hover:bg-[#0284C7]">
          الرجوع للرئيسية
        </a>
      </div>
    </div>
  );
}