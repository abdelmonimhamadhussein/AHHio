import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

export default function VendorLogin() {
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) return alert("املأ البريد وكلمة المرور");

    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      setLoading(false);
      alert("بيانات الدخول غير صحيحة");
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    const { data, error } = cleanSlug
      ? await supabase.from("tenants").select("*").eq("owner_id", authData.user.id).eq("slug", cleanSlug).maybeSingle()
      : await supabase.from("tenants").select("*").eq("owner_id", authData.user.id).maybeSingle();

    setLoading(false);

    if (error || !data) {
      await supabase.auth.signOut();
      setLoading(false);
      alert("اسم المتجر أو كلمة السر غير صحيحة");
      return;
    }

    localStorage.setItem("tenant", JSON.stringify(data));
    navigate("/vendor");
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-10">
      <h1 className="mb-6 text-2xl font-bold text-black">دخول التجار</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="mb-3 w-full rounded-lg border border-black bg-white p-3 text-black outline-none focus:border-sky-500" />
      <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="اسم المتجر" className="mb-3 w-full rounded-lg border border-black bg-white p-3 text-black outline-none focus:border-sky-500" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة السر" className="mb-3 w-full rounded-lg border border-black bg-white p-3 text-black outline-none focus:border-sky-500" />
      <button onClick={handleLogin} disabled={loading} className="w-full rounded-lg bg-[#0EA5E9] py-3 text-white hover:bg-[#0284C7]">
        {loading ? "...جاري الدخول" : "دخول"}
      </button>
      <p className="mt-4 text-center text-sm text-slate-600">
        ليس لديك حساب تاجر؟ <Link to="/register?type=vendor" className="font-bold text-black">سجّل متجرك</Link>
      </p>
    </div>
  );
}