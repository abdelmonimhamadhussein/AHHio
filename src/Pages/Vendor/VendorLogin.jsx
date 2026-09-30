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
    navigate(`/vendor/dashboard`);
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-10">
      <h1 className="mb-6 text-2xl font-bold text-sky-800">دخول التجار</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="mb-3 w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
      <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="اسم المتجر" className="mb-3 w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة السر" className="mb-3 w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500" />
      <button onClick={handleLogin} disabled={loading} className="w-full rounded-xl bg-sky-500 py-3 text-white hover:bg-sky-600">
        {loading ? "...جاري الدخول" : "دخول"}
      </button>
      <p className="mt-4 text-center text-sm text-slate-600">
        ليس لديك حساب تاجر؟ <Link to="/register?type=vendor" className="font-bold text-sky-700">سجّل متجرك</Link>
      </p>
    </div>
  );
}