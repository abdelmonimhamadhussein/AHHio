import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PACKAGES } from "../../lib/Package";

const planIds = ["free", "pro", "vip"];

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedPlan = searchParams.get("plan");
  const selectedPlanId = planIds.includes(requestedPlan) ? requestedPlan : "free";
  const selectedPlan = PACKAGES[selectedPlanId];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (password.length < 6) throw new Error("كلمة المرور يجب ألا تقل عن 6 أحرف");

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: "vendor",
            whatsapp: whatsapp.trim(),
            selected_plan: selectedPlanId,
            plan_id: selectedPlan.planId,
          },
        },
      });
      if (signUpError) throw signUpError;

      navigate(`/vendor/settings?onboarding=true&plan=${selectedPlanId}`, { replace: true });
    } catch (submitError) {
      console.error(submitError);
      setError(submitError.message || "تعذر إنشاء الحساب، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "w-full rounded-xl border border-[#e5e7eb] bg-white p-[14px] text-black outline-none focus:border-sky-500";

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-black">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold">إنشاء حساب تاجر</h1>
        <div className="mb-6 flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm">
          <span>الباقة المختارة: <strong>{selectedPlan.name}</strong></span>
          <Link to="/plans" className="font-bold text-sky-700 underline">تغيير</Link>
        </div>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium" htmlFor="merchant-email">
            <span>البريد الإلكتروني</span>
            <input id="merchant-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={inputClassName} />
          </label>
          <label className="block space-y-2 text-sm font-medium" htmlFor="merchant-password">
            <span>كلمة المرور</span>
            <input id="merchant-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required className={inputClassName} />
          </label>
          <label className="block space-y-2 text-sm font-medium" htmlFor="merchant-whatsapp">
            <span>رقم الواتساب</span>
            <input id="merchant-whatsapp" type="tel" autoComplete="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} required className={inputClassName} />
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#0EA5E9] py-3 font-bold text-white hover:bg-[#0284C7] disabled:opacity-50">
            {loading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب تاجر"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          لديك حساب؟ <Link to="/vendor/login" className="font-bold text-sky-700">تسجيل دخول التاجر</Link>
        </p>
      </section>
    </main>
  );
}