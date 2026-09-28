import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Billing() {
  const [tenant, setTenant] = useState(null);
  const [txnNumber, setTxnNumber] = useState("");
  const [amount, setAmount] = useState(30000);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "pro";

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
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = tenant?.id;
    if (!tenantId) {
      alert("لم يتم العثور على المتجر");
      setLoading(false);
      return;
    }
    const fileName = `payment/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("payment_proofs").upload(fileName, file);
    if (upErr) {
      alert(upErr.message);
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("payment_proofs").getPublicUrl(fileName);

    const { error: txnErr } = await supabase
      .from("payment_transactions")
      .insert({
        tenant_id: tenantId,
        txn_number: txnNumber,
        amount,
        screenshot_url: urlData?.publicUrl,
        status: "approved",
        auto_verified: true,
      });

    if (txnErr) {
      alert(txnErr.message || "رقم المعاملة موجود بالفعل");
      setLoading(false);
      return;
    }

    const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
      tenant_id: tenantId,
      plan_id: planId,
      status: "active",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: Number(amount),
    }, { onConflict: "tenant_id" });
    if (subscriptionError) {
      alert(subscriptionError.message);
      setLoading(false);
      return;
    }
    await supabase.from("tenants").update({ status: "active" }).eq("id", tenantId);

    setLoading(false);
    alert("تم تأكيد الدفع وتحديث الاشتراك");
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
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="المبلغ" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <input type="file" accept="image/*" onChange={handleFile} className="w-full rounded-2xl border border-dashed border-white/20 bg-white/5 p-3 text-white/70" />
          {preview && <img src={preview} alt="preview" className="h-52 w-full rounded-2xl object-cover" />}
        </div>

        <button onClick={submit} disabled={loading} className="mt-6 w-full rounded-full bg-[#D4AF37] px-5 py-3 font-black text-[#111111]">{loading ? "...جاري التحديث" : "تأكيد الدفع"}</button>
      </div>
    </div>
  );
}