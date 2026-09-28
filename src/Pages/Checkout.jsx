import { useState } from "react";
import { useCart } from "../components/context/CartContext";
import { supabase } from "../lib/supabase";

export default function Checkout() {
  const { items, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const grouped = items.reduce((acc, item) => {
    const tenantId = item.tenant_id || item.vendor_id || "unknown";
    if (!acc[tenantId]) acc[tenantId] = [];
    acc[tenantId].push(item);
    return acc;
  }, {});

  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

  const handleOrder = async () => {
    if (!name || !phone || !city || !address) return alert("يرجى تعبئة البيانات كاملة");

    for (const tenantId of Object.keys(grouped)) {
      const list = grouped[tenantId];
      const subtotal = list.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

      const { data: tenant } = await supabase.from("tenants").select("id, store_name, whatsapp_number, slug").eq("id", tenantId).maybeSingle();
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*, plan:plans(commission_percent)")
        .eq("tenant_id", tenantId)
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const commission = Number(subtotal * ((subscription?.plan?.commission_percent || 15) / 100));
      const tenantEarning = subtotal - commission;

      await supabase.from("orders").insert({
        tenant_id: tenantId,
        customer_name: name,
        phone,
        city,
        address,
        items: list,
        total: subtotal,
        status: "pending",
        commission,
        tenant_earning: tenantEarning,
        payment_txn: `cash-${Date.now()}`,
      });

      const message = `طلب جديد من ${name}\nرقم: ${phone}\nالمدينة: ${city}\nالعنوان: ${address}\nالمتجر: ${tenant?.store_name || "متجر"}\nالمنتجات:\n${list.map((p) => `- ${p.name} x${p.qty}`).join("\n")}\nالإجمالي: ${subtotal} SDG`;
      const whatsapp = tenant?.whatsapp_number ? `https://wa.me/249${String(tenant.whatsapp_number).replace(/^0+/, "")}?text=${encodeURIComponent(message)}` : "https://wa.me/249910070934";
      window.open(whatsapp, "_blank");
    }

    clearCart();
    alert("تم إرسال الطلبات بنجاح");
  };

  if (items.length === 0) return <div className="p-20 text-center text-[#D4AF37]">السلة فارغة</div>;

  return (
    <div dir="rtl" className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-[28px] border border-white/10 bg-[#171717] p-6">
        <h1 className="mb-5 text-3xl font-black text-[#D4AF37]">إتمام الطلب</h1>

        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العميل" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white outline-none" />
        </div>

        <div className="mt-5 rounded-[20px] bg-[#111111] p-4 text-white/80">
          <div>عدد المتاجر: {Object.keys(grouped).length}</div>
          <div className="mt-2 text-2xl font-black text-[#E91E63]">الإجمالي: {total.toLocaleString()} SDG</div>
        </div>

        <button onClick={handleOrder} className="mt-6 w-full rounded-full bg-[#E91E63] px-5 py-3 text-lg font-black text-white">إرسال الطلب</button>
      </div>
    </div>
  );
}