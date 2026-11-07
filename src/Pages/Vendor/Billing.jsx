import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PACKAGES } from "../../lib/Package";
import useSubscription from "../../hooks/useSubscription";

const BANK_ACCOUNT = "3496179";

export default function Billing() {
  const [userId, setUserId] = useState(null);
  const [txnNumber, setTxnNumber] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");

  const [selectedPlanId, setSelectedPlanId] = useState(planIdFromUrl || "pro");
  const plan = PACKAGES[selectedPlanId] || PACKAGES.pro;

  // اشتراكو الحالي - عشان نعرف دي أول مرة ولا تجديد
  const { subscription, plan: currentPlan, daysLeft, loading: subLoading } = useSubscription(userId);
  const isFirstPayment = !subscription;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (planIdFromUrl && PACKAGES[planIdFromUrl]) setSelectedPlanId(planIdFromUrl);
  }, [planIdFromUrl]);

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
    if (plan.price === 0) {
      setMessage("الباقة المجانية لا تحتاج دفع - متجرك حيتفعل بعد موافقة الإدارة.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.id) throw new Error("سجل دخول أولاً");

      // tenant_id = user.id من profiles
      const tenantId = user.id;

      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { error: transactionError } = await supabase.from("payment_transactions").insert({
        tenant_id: tenantId,
        requested_plan_id: plan.id,
        txn_number: txnNumber.trim(),
        amount: plan.price,
        screenshot_url: uploadData.path,
        status: "pending",
        auto_verified: false,
      });
      if (transactionError) throw transactionError;

      setMessage(`تم إرسال إثبات الدفع للمراجعة. بعد موافقة الإدارة، حيتفعل اشتراك ${plan.name} لمدة ${plan.durationDays} يوم.`);
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
      <div className="rounded-lg border border-black bg-white p-6 text-black">
        <h1 className="text-3xl font-black text-black">{isFirstPayment ? "الفوترة - أول دفع" : "الفوترة - تجديد"}</h1>
        <p className="text-sm text-gray-600 mt-1">{isFirstPayment ? "ادفع أول مرة عشان متجرك يتفعل" : `اشتراكك الحالي: ${currentPlan?.name} • فضل ليك ${daysLeft} يوم`}</p>

        {/* اختيار الباقة */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {Object.values(PACKAGES).map(p => (
            <button key={p.id} type="button" onClick={() => setSelectedPlanId(p.id)} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${selectedPlanId === p.id ? "bg-[#0EA5E9] text-white border-[#0EA5E9]" : "bg-white text-black border-gray-300"}`}>
              {p.name} - {p.price === 0 ? "مجاناً" : `${p.price.toLocaleString()} ج`}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-black bg-white p-4">
          <div className="text-sm text-black">رقم الحساب - حول فيهو {plan.price.toLocaleString()} جنيه</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xl font-black text-black">{BANK_ACCOUNT}</div>
            <button onClick={() => navigator.clipboard?.writeText(BANK_ACCOUNT)} className="rounded-lg bg-[#0EA5E9] px-4 py-2 text-sm font-bold text-white hover:bg-[#0284C7]">نسخ</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">الباقة: {plan.name} • المدة: {plan.durationDays} يوم • {plan.max_products === 9999 ? "منتجات لا محدودة" : `${plan.max_products} منتج`}</p>
        </div>

        <div className="mt-5 space-y-3">
          <input value={txnNumber} onChange={(e) => setTxnNumber(e.target.value)} placeholder="رقم المعاملة" className="w-full rounded-lg border border-black bg-white p-3 text-black outline-none" />
          <p className="text-black">الباقة: {plan.name}، المبلغ المطلوب: {plan.price.toLocaleString()} جنيه</p>
          <input type="file" accept="image/*" onChange={handleFile} className="w-full rounded-lg border border-dashed border-black bg-white p-3 text-black" />
          {preview && <img src={preview} alt="preview" className="h-52 w-full rounded-lg object-cover" />}
        </div>

        {message && <p role="status" className="mt-4 rounded-lg border border-black bg-white p-3 text-sm text-black">{message}</p>}
        <button onClick={submit} disabled={loading} className="mt-6 w-full rounded-lg bg-[#0EA5E9] px-5 py-3 font-black text-white hover:bg-[#0284C7]">{loading ? "...جاري التحديث" : `تأكيد الدفع - ${plan.price.toLocaleString()} جنيه`}</button>

        <p className="text-xs text-center text-gray-500 mt-3">بعد التأكيد، انتظر موافقة الإدارة، وبعدها متجرك حيتفعل أوتوماتيك.</p>
      </div>
    </div>
  );
}