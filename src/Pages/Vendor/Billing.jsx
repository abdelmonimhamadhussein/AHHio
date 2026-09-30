import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PACKAGES } from "../../lib/Package";

export default function Billing() {
  const [tenant, setTenant] = useState(null);
  const [txnNumber, setTxnNumber] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "pro";
  const plan = PACKAGES[planId] || PACKAGES.pro;

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("tenants").select("*").eq("owner_id", user.id).maybeSingle();
      setTenant(data || null);
    }
    load();
  }, []);

  const handleFile = (e) => {
    const image = e.target.files?.[0];
    if (!image) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      alert("يرجى اختيار صورة JPG أو PNG أو WebP");
      return;
    }
    if (image.size > 2 * 1024 * 1024) {
      alert("احفظ حجم الصورة أقل من 2MB");
      return;
    }
    setFile(image);
    setPreview(URL.createObjectURL(image));
  };

  const submit = async () => {
    if (!txnNumber || !file) {
      alert("ادخل رقم المعاملة وصورة الإيصال");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!tenant?.id || !user?.id) throw new Error("لم يتم العثور على حساب التاجر");

      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { error: transactionError } = await supabase.from("payment_transactions").insert({
        tenant_id: tenant.id,
        requested_plan_id: plan.id,
        txn_number: txnNumber.trim(),
        amount: plan.price,
        screenshot_url: uploadData.path,
        status: "pending",
        auto_verified: false,
      });
      if (transactionError) throw transactionError;

      setMessage("تم إرسال إثبات الدفع للمراجعة. سيُفعّل الاشتراك بعد موافقة الإدارة.");
      setTxnNumber("");
      setFile(null);
      setPreview("");
    } catch (error) {
      setMessage(error.message || "تعذر إرسال إثبات الدفع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="mx-auto max-w-xl px-4 py-8">
      <div className="rounded-[28px] border border-white/10 bg-[#171717] p-6">
        <h1 className="text-3xl font-black text-[#D4AF37]">الفوترة</h1>
        <div className="mt-4 rounded-[24px] border border-[#D4AF37]/25 bg-[#111111] p-4">
          <div className="text-sm text-white/70">رقم الحساب</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xl font-black text-white">{tenant?.bank_account || "3496179"}</div>
            <button onClick={() => navigator.clipboard?.writeText(tenant?.bank_account || "3496179")}
             className="rounded-full bg-[#E91E63] px-4 py-2 text-sm font-bold text-white">نسخ</button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input value={txnNumber} onChange={(e) => setTxnNumber(e.target.value)} placeholder="رقم المعاملة" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <p className="text-white/70">الباقة: {plan.name}، المبلغ المطلوب: {plan.price.toLocaleString()} جنيه</p>
          <input type="file" accept="image/*" onChange={handleFile} className="w-full rounded-2xl border border-dashed border-white/20 bg-white/5 p-3 text-white/70" />
          {preview && <img src={preview} alt="preview" className="h-52 w-full rounded-2xl object-cover" />}
        </div>

        {message && <p role="status" className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white">{message}</p>}
        <button onClick={submit} disabled={loading} className="mt-6 w-full rounded-full bg-[#D4AF37] px-5 py-3 font-black text-[#111111]">{loading ? "...جاري التحديث" : "تأكيد الدفع"}</button>
      </div>
    </div>
  );
}