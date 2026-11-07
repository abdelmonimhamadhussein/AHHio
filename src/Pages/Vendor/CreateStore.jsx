import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function CreateStore() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleNameChange = (val) => {
    setName(val);
    // تحويل الاسم لرابط نظيف: Hejzy Store -> hejzy-store
    setSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const handleCreate = async () => {
    if (!name || !slug) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. جيب المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // 2. تأكد ان الرابط ما مستخدم قبل كده
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("store_slug", slug)
        .maybeSingle();

      if (existing) {
        setErrorMsg("الرابط ده مستخدم قبل كده، غير اسم المتجر");
        setLoading(false);
        return;
      }

      // 3. انشاء المتجر في جدول store
      const { error: storeError } = await supabase
        .from("store")
        .insert([
          {
            name,
            slug,
            owner_id: user.id,
            description: description || null,
          },
        ]);

      if (storeError) throw storeError;

      // 4. تحديث profiles بنفس الحقول الانت ذكرتها - دي النقطة المهمة
      // هنا بنملى كل الـ null الكانت بتجيك
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          store_name: name,
          store_slug: slug,
          store_description: description || null,
          role: "vendor",
          vendor_status: "pending",
          is_vendor_approved: false,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 5. نجاح - وديه للداشبورد
      navigate("/vendor/dashboard");

    } catch (err) {
      console.log(err);
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

        <label className="text-sm font-medium">رابط متجرك</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="hejzystore"
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
