import { Link } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { PACKAGES } from "../lib/Package";

export default function Plans() {
  const { user } = useAuth();
  const plans = Object.values(PACKAGES);
  return (
    <main className="min-h-screen bg-white p-8 text-black" dir="rtl"><header className="mb-10 text-center">
      <h1 className="text-3xl font-black text-black">اختر الباقة المناسبة لك</h1>
      <p className="mt-3 text-black">باقات تساعدك على تنمية متجرك وإدارة طلباتك.</p>
    </header><section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <article key={plan.id} className="bg-white border border-sky-100 text-black rounded-lg p-6">
          <h2 className="text-xl font-bold text-black">{plan.name}</h2>
          <p className="my-4 text-3xl font-black text-black">{plan.price} <small className="text-sm text-black">جنيه / شهر</small></p>
          <ul className="mb-6 space-y-3">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
          <Link to={user?.role === "vendor" ? `/vendor/billing?plan=${plan.id}` : `/register?type=vendor&plan=${plan.id}`} className="block rounded-lg bg-[#0EA5E9] p-3 text-center font-bold text-white hover:bg-[#0284C7]">اشترك الآن</Link>
        </article>
      ))}
    </section></main>
  );
}