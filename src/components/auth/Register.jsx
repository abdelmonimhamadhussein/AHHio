import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { PACKAGES } from "../../lib/Package";

export default function Register() {
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState(() => searchParams.get("type") === "vendor" ? "vendor" : "customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUpCustomer } = useAuth();
  const navigate = useNavigate();
  const selectedPlan = PACKAGES[searchParams.get("plan")];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (accountType === "customer") {
        await signUpCustomer(email.trim(), password, fullName.trim());
        alert("تم إنشاء الحساب بنجاح");
        navigate("/");
        return;
      }

      const cleanSlug = slug.trim().toLowerCase();
      if (password.length < 6 || !/[0-9]/.test(password)) {
        throw new Error("كلمة السر يجب أن تكون 6 أحرف على الأقل وتحتوي على رقم");
      }
      if (cleanSlug.length < 3 || !/^[a-z0-9]+$/.test(cleanSlug)) {
        throw new Error("رابط المتجر يجب أن يحتوي على 3 أحرف أو أرقام إنجليزية على الأقل دون مسافات");
      }
      if (whatsapp.trim().length < 10) {
        throw new Error("رقم الواتساب غير صحيح");
      }

      const { data: existingTenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (existingTenant) throw new Error("رابط المتجر مستخدم بالفعل");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: "vendor",
            store_name: storeName.trim(),
            slug: cleanSlug,
            whatsapp: whatsapp.trim(),
            plan_id: selectedPlan?.id || "basic",
          },
        },
      });
      if (authError){
        if (authError.message.includes("already register") || authError.message.includes("User already register")){

          const {data: loginData, error: loginError} = await supabase.signInWithPassword({
            email: email.trim(),
            password
          });
          if (loginError){
            alert("الايميل ده مسجل من قبل ,اعمل تسجيل دخول");
            navigate("/login");
            return;
          }
          navigate(`/store/${cleanSlug}`);
          return;
        }
        throw authError;
      }
      if (!authData.user) throw new Error("تعذر إنشاء الحساب");

      if (!authData.session) {
        navigate("/login");
        return;
      }
      navigate(`/store/${cleanSlug}`)

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: email.trim(),
        role: "vendor",
      });
      if (profileError) throw profileError;

      let { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", authData.user.id)
        .maybeSingle();
      if (tenantError) throw tenantError;

      if (!tenantData) {
        const { data, error } = await supabase.from("tenants").insert({
          owner_id: authData.user.id,
          owner_name: storeName.trim(),
          store_name: storeName.trim(),
          slug: cleanSlug,
          phone: whatsapp.trim(),
          whatsapp_number: whatsapp.trim(),
          status: "active",
          theme_color: "#E91E63",
          city: "امدرمان",
          is_verified: false,
          rating: 0,
        }).select().single();
        if (error) throw error;
        tenantData = data;
      }

      localStorage.setItem("tenant", JSON.stringify(tenantData));
      navigate("/vendor/dashboard");
    } catch (registrationError) {
      setError(registrationError.message || "تعذر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="mx-auto min-h-[70vh] max-w-md py-8">
      <section className="rounded-2xl border border-sky-100 bg-white p-6 text-slate-900 shadow-sm sm:p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-sky-800">إنشاء حساب</h1>
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="نوع الحساب">
          <button
            type="button"
            aria-pressed={accountType === "customer"}
            onClick={() => setAccountType("customer")}
            className={`rounded-lg px-3 py-2 font-bold ${accountType === "customer" ? "bg-sky-600 text-white" : "text-slate-600"}`}
          >
            عميل
          </button>
          <button
            type="button"
            aria-pressed={accountType === "vendor"}
            onClick={() => setAccountType("vendor")}
            className={`rounded-lg px-3 py-2 font-bold ${accountType === "vendor" ? "bg-sky-600 text-white" : "text-slate-600"}`}
          >
            تاجر
          </button>
        </div>

        {error && <p role="alert" className="mb-4 rounded bg-red-100 p-3 text-center text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {accountType === "customer" ? (
            <label className="block font-bold">
              الاسم الكامل
              <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-sky-500" placeholder="الاسم الكامل" />
            </label>
          ) : (
            <>
              <label className="block font-bold">
                اسم المتجر
                <input required value={storeName} onChange={(event) => setStoreName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-sky-500" placeholder="اسم المتجر" />
              </label>
              <label className="block font-bold">
                رابط المتجر
                <input required value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-sky-500" placeholder="أحرف إنجليزية وأرقام فقط" />
              </label>
              <label className="block font-bold">
                رقم الواتساب
                <input required value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-sky-500" placeholder="رقم الواتساب" />
              </label>
            </>
          )}

          <label className="block font-bold">
            البريد الإلكتروني
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-sky-500" placeholder="البريد الإلكتروني" />
          </label>
          <label className="block font-bold">
            كلمة المرور
            <input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal outline-none focus:border-sky-500" placeholder="6 أحرف على الأقل" />
          </label>
          {accountType === "vendor" && <p className="text-xs text-slate-500">يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.</p>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-sky-600 py-3 font-bold text-white hover:bg-sky-700 disabled:opacity-50">
            {loading ? "جارٍ إنشاء الحساب..." : accountType === "vendor" ? "إنشاء حساب تاجر" : "إنشاء حساب عميل"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          لديك حساب بالفعل؟ <Link to="/Login" className="font-bold text-sky-700">تسجيل الدخول</Link>
        </p>
      </section>
    </div>
  );
}