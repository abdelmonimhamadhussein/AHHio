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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // --- 1. لو زبون ---
      if (accountType === "customer") {
        await signUpCustomer(email.trim(), password, fullName.trim());
        alert("تم إنشاء حساب الزبون بنجاح");
        navigate("/");
        return;
      }

      // --- 2. لو تاجر ---
      const cleanSlug = slug.trim().toLowerCase();
      if (password.length < 6 || !/[0-9]/.test(password)) throw new Error("كلمة السر 6 أحرف على الأقل وفيها رقم");
      if (cleanSlug.length < 3 || !/^[a-z0-9]+$/.test(cleanSlug)) throw new Error("رابط المتجر انجليزي فقط بدون مسافات");

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

      // 2. ALWAYS profile
      const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, email: email.trim(), role: "vendor" }, { onConflict: 'id' });
      if (profileError) throw profileError;

      // 3. ALWAYS check tenant by owner_id
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
          theme_color: "#E91E63",
          city: "",
          is_verified: false,
          rating: 0,
        }).select().single();
        if (tenantError) throw tenantError;
        tenantData = newTenant;
      }

      // 4. subscription
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      await supabase.from("subscriptions").upsert({
        tenant_id: tenantData.id,
        plan_id: searchParams.get("plan") || "basic",
        status: "active",
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        amount: 0
      }, { onConflict: "tenant_id" });

      // 5. localStorage
      localStorage.setItem("tenant", JSON.stringify(tenantData));

      // 6. ONLY ONE navigate
      navigate("/vendor/dashboard");

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };