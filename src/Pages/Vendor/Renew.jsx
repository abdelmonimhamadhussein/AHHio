import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PACKAGES } from "../../lib/Package";

export default function Renew() {
  const [load, setLoad] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [searchParams] = useSearchParams();
  const [plan, setPlan] = useState(null);
  const planId = searchParams.get("plan");

  useEffect(() => {
    if (PACKAGES[planId]) {
      setPlan(PACKAGES[planId]);
      return;
    }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const { data } = await supabase.from("tenants").select("plan").eq("owner_id", user?.id).maybeSingle();
      setPlan(PACKAGES[data?.plan] || PACKAGES.pro);
    });
  }, [planId]);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const pay = async (e) => {
    e.preventDefault();
    if (load) return;

    setLoad(true);
    showMessage("جاري تجهيز الطلب...", "info");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        showMessage("يجب تسجيل الدخول أولاً", "error");
        return;
      }

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      const tenantId = tenant?.id;
      if (!tenantId) {
        showMessage("لم يتم العثور على المتجر", "error");
        return;
      }

      if (!plan?.price) {
        showMessage("الباقة المجانية لا تحتاج إلى تجديد مدفوع", "error");
        return;
      }

      const trx = e.target.trx.value.trim();
      const file = e.target.file.files[0];

      if (!trx || !file) {
        showMessage("يرجى إدخال رقم العملية وإرفاق صورة الإيصال", "error");
        return;
      }

      if (!file.type.startsWith("image/")) {
        showMessage("يرجى إرفاق صورة فقط", "error");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showMessage("حجم الصورة كبير، الحد الأقصى 5 ميجابايت", "error");
        return;
      }

      showMessage("جارٍ رفع صورة الإيصال...", "info");

      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const fileName = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(fileName, file, { upsert: false });

      if (uploadError || !uploadData?.path) {
        throw uploadError || new Error("فشل رفع الإيصال");
      }

      const { error: requestError } = await supabase.from("payment_transactions").insert({
        tenant_id: tenantId,
        requested_plan_id: plan.id,
        txn_number: trx,
        amount: plan.price,
        screenshot_url: uploadData.path,
        status: "pending",
        auto_verified: false,
      });

      if (requestError) throw requestError;

      showMessage("تم إرسال طلب التجديد للمراجعة. سيُحدّث الاشتراك بعد موافقة الإدارة.", "success");
    } catch (error) {
      console.error(error);
      showMessage(error.message || "حدث خطأ أثناء تجديد الاشتراك", "error");
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="vendor-page">
      <form onSubmit={pay} className="vendor-card mx-auto max-w-4xl space-y-4 p-5 sm:p-6">
        <div>
          <p className="vendor-subtitle">تجديد الاشتراك</p>
          <h1 className="vendor-title">تجديد {plan?.name || "الباقة"} لمدة 30 يوم</h1>
          <p className="mt-2 text-sm text-slate-600">المبلغ: {plan?.price ?? "..."} جنيه - الحساب البنكي: 3496179</p>
        </div>

        <div>
          <label className="vendor-label" htmlFor="trx">
            رقم العملية
          </label>
          <input
            id="trx"
            name="trx"
            required
            placeholder="رقم العملية"
            className="vendor-input"
          />
        </div>

        <div>
          <label className="vendor-label" htmlFor="file">
            صورة الإيصال
          </label>
          <input
            id="file"
            name="file"
            accept="image/*"
            type="file"
            required
            className="vendor-input file:mr-4 file:rounded file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>

        {message ? (
          <div
            className={`rounded-xl border px-3 py-2 text-sm ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : messageType === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <button type="submit" disabled={load} className="vendor-btn">
          {load ? "جاري الرفع والتجديد..." : "تجديد 30 يوم"}
        </button>
      </form>
    </div>
  );
}