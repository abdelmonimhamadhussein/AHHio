import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PACKAGES } from "../../lib/Package";

export default function CreateStore() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedPlanId, setSavedPlanId] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedPlanId = searchParams.get("plan");
  const planId = requestedPlanId || savedPlanId || "pro";
  const plan = PACKAGES[planId] || PACKAGES.pro;

  useEffect(() => {
    let active = true;
    const checkExisting = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;

        const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("store_name, store_slug, requested_plan_id")
        .eq("id", user.id)
        .maybeSingle();
        if (profileError) throw profileError;
        if (!active) return;

        if (!requestedPlanId && profile?.requested_plan_id) {
          setSavedPlanId(profile.requested_plan_id);
        }
        if (profile?.store_name) {
          navigate(`/vendor/billing?plan=${requestedPlanId || profile.requested_plan_id || planId}`, { replace: true });
        }
      } catch (error) {
        if (active) setErrorMsg(error.message || "تعذر التحقق من بيانات المتجر");
      }
    };
    checkExisting();
    return () => { active = false; };
  }, [navigate, requestedPlanId, planId]);

  const handleNameChange = (val) => {
    setName(val);
    // تحويل الاسم لرابط نظيف: Hejzy Store -> hejzy-store
    // بنسمح بالإنجليزي والأرقام بس، عشان الرابط يشتغل صح
    setSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const handleCreate = async () => {
    if (!name || !slug) return;
    // الـ slug لازم يكون إنجليزي، لو التاجر كتب عربي، حيكون فاضي
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setErrorMsg("رابط المتجر لازم يكون بالإنجليزي والأرقام بس، مثلاً: mo-store");
      return;
    }
    if (slug.length < 3) {
      setErrorMsg("رابط المتجر قصير شديد، خليهو 3 حروف على الأقل");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { error: createError } = await supabase.rpc("create_vendor_store", {
        p_store_name: name.trim(),
        p_store_slug: slug.trim(),
        p_store_description: description,
        p_plan_id: plan.planId,
      });
      if (createError) throw createError;

      navigate(`/vendor/billing?plan=${plan.id}`);
    } catch (err) {
      setErrorMsg(err.message || "حصل خطأ، حاول تاني");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-sm border">
        <h1 className="text-xl font-bold mb-1">انشئ متجرك</h1>
        <p className="text-sm text-gray-500 mb-6">15 دقيقة ومتجرك يكون جاهز</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center text-sm mb-4">
          الباقة المختارة: <span className="font-bold">{plan.name}</span> - {plan.price === 0 ? "مجاناً" : `${plan.price.toLocaleString()} جنيه / ${plan.durationDays} يوم`}
        </div>

        {errorMsg && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {errorMsg}
          </p>
        )}

        <label className="text-sm font-medium">اسم المتجر</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="مثلا: HejzyStore"
          className="w-full border rounded-xl p-3 mt-1 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="text-sm font-medium">رابط متجرك (بالإنجليزي)</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="mo-store"
            className="flex-1 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">.ahhio.com</span>
        </div>

        <label className="text-sm font-medium block mt-4">وصف المتجر</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="بتقدم شنو في متجرك؟"
          className="w-full border rounded-xl p-3 mt-1 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />

        <button
          onClick={handleCreate}
          disabled={!name || !slug || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 mt-2 font-medium disabled:opacity-30"
        >
          {loading ? "جاري انشاء متجرك..." : "انشاء متجرك"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          بالضغط على انشاء، انت بتوافق على شروط ahhio
        </p>
      </div>
    </div>
  );
}