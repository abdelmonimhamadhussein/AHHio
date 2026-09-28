import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PACKAGES } from "../../lib/Package";

export default function VendorRegister() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = PACKAGES[searchParams.get("plan")];

  const validate = () => {
    if (password.length < 6) return "كلمة السر أقل شيء 6 أحرف";
    if (!/[0-9]/.test(password)) return "كلمة السر لازم فيها رقم";
    if (slug.length < 3) return "الاسم المختصر أقل شيء 3 أحرف";
    if (!/^[a-z0-9]+$/.test(slug)) return "الرابط انجليزي وأرقام فقط بدون مسافات";
    if (whatsapp.length < 10) return "رقم الواتساب غلط";
    return null;
  };

  const handleRegister = async () => {
    const errorMessage = validate();
    if (errorMessage) return alert(errorMessage);
    if (!name || !email || !slug || !whatsapp || !password) return alert("املا كل الحقول");

    setLoading(true);
    const cleanSlug = slug.toLowerCase().trim();

    const { data: exists } = await supabase.from("tenants").select("id").eq("slug", cleanSlug).maybeSingle();
    if (exists) {
      alert("الاسم دا مستخدم");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: "vendor",
          store_name: name.trim(),
          slug: cleanSlug,
          whatsapp: whatsapp.trim(),
        },
      },
    });
    if (authError || !authData.user) {
      setLoading(false);
      alert(authError?.message || "تعذر إنشاء الحساب");
      return;
    }

    if (!authData.session) {
      alert("تم إنشاء الحساب. راجع بريدك الإلكتروني لتفعيل الحساب ثم سجّل الدخول.");
      navigate("/vendor");
      setLoading(false);
      return;
    }

    await supabase.from("profiles").upsert({ id: authData.user.id, email: email.trim(), role: "vendor" });
    let { data: tenantData } = await supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", authData.user.id)
      .maybeSingle();

    if (!tenantData) {
      const { data, error: tenantError } = await supabase.from("tenants").insert({
        owner_id: authData.user.id,
        owner_name: name.trim(),
        store_name: name.trim(),
        slug: cleanSlug,
        phone: whatsapp.trim(),
        whatsapp_number: whatsapp.trim(),
        status: "active",
        theme_color: "#E91E63",
        city: "امدرمان",
        is_verified: false,
        rating: 0,
      }).select().single();
      tenantData = data;
      if (tenantError) {
        setLoading(false);
        alert(tenantError.message || "تعذر إنشاء المتجر");
        return;
      }
    }

    if (!tenantData) {
      setLoading(false);
      alert("تعذر إنشاء المتجر");
      return;
    }

    const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
      tenant_id: tenantData.id,
      plan_id: selectedPlan?.id || "basic",
      status: selectedPlan?.price ? "trial" : "active",
      end_date: selectedPlan?.price ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
      amount: selectedPlan?.price || 0,
    }, { onConflict: "tenant_id" });

    setLoading(false);

    if (subscriptionError) {
      alert(subscriptionError.message || "تعذر إنشاء الاشتراك");
      return;
    }

    localStorage.setItem("tenant", JSON.stringify(tenantData));
    navigate("/vendor/dashboard");
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:p-6">
      <h1 className="text-2xl font-black text-sky-800">سجل متجرك</h1>
      <div className="space-y-4 mt-6">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المتجر" className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
        <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="انجليزي فقط" className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="الواتساب" className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="كلمة السر - 6 حروف + رقم" className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
        <p className="text-xs text-sky-600">* 6 أحرف على الأقل + رقم واحد</p>
        <button onClick={handleRegister} disabled={loading} className="w-full rounded-xl bg-sky-500 py-4 font-bold text-white hover:bg-sky-600">
          {loading ? "...جاري التسجيل" : "تسجيل"}
        </button>
      </div>
    </div>
  );
}