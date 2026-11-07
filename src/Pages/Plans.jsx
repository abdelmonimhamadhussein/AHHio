import { Link } from "react-router-dom";
import { PACKAGES } from "../lib/Package";

export default function Plans() {
  // بنجيب الباقات من PACKAGES أوتوماتيك - لو ضفت باقة جديدة، بتظهر هنا براها
  const plans = Object.values(PACKAGES);

  return (
    <main className="min-h-screen bg-white p-8 text-black" dir="rtl">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-black">اختر الباقة المناسبة لك</h1>
        <p className="mt-3">باقات تساعدك على تنمية متجرك وإدارة طلباتك.</p>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className={`relative rounded-lg border bg-white p-6 ${plan.color}`}>
            {plan.isPopular && <span className="absolute -top-3 right-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">الأكثر طلباً</span>}
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="my-4 text-3xl font-black">
              {plan.price === 0 ? "مجاناً" : `${plan.price.toLocaleString()} جنيه`}
              <small className="text-sm font-normal text-gray-500"> {plan.price === 0 ? "" : plan.durationDays === 365 ? "/ سنة" : "/ شهر"}</small>
            </p>
            <p className="text-xs text-gray-500 mb-4">المدة: {plan.durationDays} يوم • {plan.max_products === 9999 ? "منتجات لا محدودة" : `${plan.max_products} منتج`}</p>
            <ul className="mb-6 space-y-3">{plan.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
            <Link to={`/register?plan=${plan.id}`} className="block rounded-lg bg-[#0EA5E9] p-3 text-center font-bold text-white hover:bg-[#0284C7]">ابدأ بهذه الباقة</Link>
          </article>
        ))}
      </section>
    </main>
  );
}
