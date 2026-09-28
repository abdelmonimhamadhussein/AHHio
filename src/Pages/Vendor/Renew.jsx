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

      showMessage("جارٍ التحقق من رقم العملية...", "info");

      const { data: existing } = await supabase
        .from("renew_requests")
        .select("id")
        .eq("transaction_no", trx)
        .maybeSingle();

      if (existing) {
        showMessage("رقم العملية مستخدم من قبل", "error");
        return;
      }

      showMessage("جارٍ رفع صورة الإيصال...", "info");

      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file, { upsert: false });

      if (uploadError || !uploadData?.path) {
        throw uploadError || new Error("فشل رفع الإيصال");
      }

      const { data: publicUrlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(uploadData.path);

      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) {
        throw new Error("تعذر الحصول على رابط الإيصال");
      }

      const { error: requestError } = await supabase
        .from("renew_requests")
        .insert({
          tenant_id: tenantId,
          vendor_id: user.id,
          transaction_no: trx,
          screenshot_url: imageUrl,
        });

      if (requestError) throw requestError;

      const { data: oldSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      let base = new Date();
      if (oldSubscription?.end_date) {
        const currentEnd = new Date(oldSubscription.end_date);
        if (!Number.isNaN(currentEnd.getTime()) && currentEnd > base) {
          base = currentEnd;
        }
      }

      base.setDate(base.getDate() + 30);

      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .upsert(
          {
            tenant_id: tenantId,
            vendor_id: user.id,
            status: "active",
            end_date: base.toISOString(),
            rent_amount: plan.price,
          },
          { onConflict: "tenant_id" }
        );

      if (subscriptionError) throw subscriptionError;

      const { error: planError } = await supabase.from("tenants").update({ plan: plan.id }).eq("owner_id", user.id);
      if (planError) throw planError;

      showMessage("تم تجديد الاشتراك بنجاح، جارٍ redirect...", "success");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 1200);
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