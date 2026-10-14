import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { PACKAGES } from "../../lib/Package";

export default function Register() {
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState(() => searchParams.get("type") === "vendor"? "vendor" : "customer");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (accountType === "customer") {
        await signUpCustomer(email.trim(), password, fullName.trim());
        alert("تم إنشاء حساب الزبون بنجاح");
        navigate("/");
        return;
      }

      const cleanSlug = slug.trim().toLowerCase();
      if (password.length < 6 ||!/[0-9]/.test(password)) throw new Error("كلمة السر 6 أحرف على الأقل وفيها رقم");
      if (cleanSlug.length < 3 ||!/^[a-z0-9]+$/.test(cleanSlug)) throw new Error("رابط المتجر انجليزي فقط بدون مسافات");

      const { data: existingSlug } = await supabase.from("tenants").select("id").eq("slug", cleanSlug).maybeSingle();
      if (existingSlug) throw new Error("رابط المتجر مستخدم بالفعل");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role: "vendor", store_name: storeName.trim(), slug: cleanSlug, whatsapp: whatsapp.trim() } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("تعذر إنشاء الحساب");

      const userId = authData.user.id;

      const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, email: email.trim(), role: "vendor" }, { onConflict: 'id' });
      if (profileError) throw profileError;

      let { data: existingTenant } = await supabase.from("tenants").select("*").eq("owner_id", userId).maybeSingle();
      let tenantData = existingTenant;

      if (!tenantData) {
        const { data: newTenant, error: tenantError } = await supabase.from("tenants").insert({
          owner_id: userId,
          store_name: storeName.trim(),
          owner_name: storeName.trim(),
          slug: cleanSlug,
          phone: whatsapp.trim(),
          whatsapp_number: whatsapp.trim(),
          status: "active",
          theme_color: "#0EA5E9",
          city: "",
          is_verified: false,
          rating: 0,
        }).select().single();
        if (tenantError) throw tenantError;
        tenantData = newTenant;
      }

      localStorage.setItem("tenant", JSON.stringify(tenantData));
      navigate("/vendor");

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 text-black">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-2">إنشاء حساب جديد</h2>
        {selectedPlan && <p className="text-center text-sm text-black mb-4">الباقة: {selectedPlan.name}</p>}

        <div className="flex gap-2 mb-6 border border-black p-1 rounded-lg">
          <button type="button" onClick={() => setAccountType("customer")} className={`flex-1 py-2 rounded-md text-sm font-medium ${accountType === "customer" ? "bg-[#0EA5E9] text-white hover:bg-[#0284C7]" : "bg-white text-black"}`}>زبون</button>
          <button type="button" onClick={() => setAccountType("vendor")} className={`flex-1 py-2 rounded-md text-sm font-medium ${accountType === "vendor" ? "bg-[#0EA5E9] text-white hover:bg-[#0284C7]" : "bg-white text-black"}`}>تاجر</button>
        </div>

        {error && <div className="border border-black text-black p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {accountType === "customer"? (
            <>
              <input type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)}
               required className="w-full p-3 border rounded-lg text-black" />
              <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} 
              required className="w-full p-3 border rounded-lg text-black" />
              <input type="password" placeholder="كلمة السر" value={password} onChange={(e) => setPassword(e.target.value)}
               required className="w-full p-3 border rounded-lg text-black" />
            </>
          ) : (
            <>
              <input type="text" placeholder="اسم المتجر" value={storeName} onChange={(e) => setStoreName(e.target.value)}
               required className="w-full p-3 border rounded-lg" />
              <input type="text" placeholder="رابط المتجر (انجليزي فقط) مثل: mystore" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())}
               required className="w-full p-3 border rounded-lg text-black" />
              <input type="text" placeholder="رقم الواتساب" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
               required className="w-full p-3 border rounded-lg text-black" />
              <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} 
              required className="w-full p-3 border rounded-lg text-black" />
              <input type="password" placeholder="كلمة السر (6+ وفيها رقم)" value={password} onChange={(e) => setPassword(e.target.value)}
              required className="w-full p-3 border rounded-lg text-black" />
            </>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#0EA5E9] text-white py-3 rounded-lg font-bold hover:bg-[#0284C7] disabled:opacity-50">
            {loading? "جاري الإنشاء..." : "إنشاء حساب"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-black">
          لديك حساب؟ <Link to={accountType === "vendor" ? "/vendor/login" : "/login"} className="text-black font-bold">تسجيل دخول</Link>
        </p>
      </div>
    </div>
  );
}