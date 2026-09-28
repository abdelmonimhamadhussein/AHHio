import { Link } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { PACKAGES } from "../lib/Package";

export default function Plans() {
  const { user } = useAuth();
  const plans = Object.values(PACKAGES);
  return (
    <main className="min-h-screen bg-slate-50 p-8" dir="rtl"><header className="mb-10 text-center">
      <h1 className="text-3xl font-black">اختر الباقة المناسبة لك</h1>
      <p className="mt-3 text-slate-500">باقات تساعدك على تنمية متجرك وإدارة طلباتك.</p>
    </header><section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <article key={plan.id} className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{plan.name}</h2>
          <p className="my-4 text-3xl font-black">{plan.price} <small className="text-sm">جنيه / شهر</small></p>
          <ul className="mb-6 space-y-3">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
          <Link to={user?.role === "vendor" ? `/vendor/billing?plan=${plan.id}` : `/vendor/register?plan=${plan.id}`} className="block rounded-lg bg-blue-600 p-3 text-center font-bold text-white">اشترك الآن</Link>
        </article>
      ))}
    </section></main>
  );
}