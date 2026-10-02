import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const suggestions = ["ايفون", "سماعة", "تي شيرت", "ساعة"];

export default function AiTools({ storeId, tenantName }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([{ role: "ai", text: `أهلا بك في ${tenantName || "المتجر"} 👋`, products: [] }]);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, open]);

  const resetChat = () => setMessages([{ role: "ai", text: `أهلا بك في ${tenantName || "المتجر"} 👋`, products: [] }]);

  const ask = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q, products: [] }]);
    setInput("");
    setLoading(true);

    try {
      if (!storeId) {
        setMessages((m) => [...m, { role: "ai", text: "لا يوجد متجر محدد حاليًا.", products: [] }]);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("name, price, description")
        .eq("store_id", storeId)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(4);

      if (error) throw error;
      if (!data?.length) {
        setMessages((m) => [...m, { role: "ai", text: "ما لقيت منتج مطابق، جرّب كلمة ثانية.", products: [] }]);
        return;
      }

      setMessages((m) => [...m, { role: "ai", text: "هذه المنتجات المناسبة لك:", products: data }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "حدثت مشكلة، حاول مرة أخرى بعد قليل.", products: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} className="fixed bottom-6 left-6 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37] via-[#F5D77A] to-[#B8891A] text-2xl font-black text-black shadow-[0_12px_35px_rgba(212,175,55,0.45)] transition hover:scale-105">
        {open ? "✕" : "AI"}
      </button>

      {open && (
        <div className="fixed bottom-24 left-6 z-[999] flex h-[470px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0B0B]/95 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.48)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
            <div>
              <h3 className="text-base font-black text-[#D4AF37]">مساعد {tenantName || "المتجر"} الذكي</h3>
              <p className="mt-1 text-[11px] text-white/60">بحث فوري داخل منتجات المتجر</p>
            </div>
            <button type="button" onClick={resetChat} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70">مسح</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[86%] ${m.role === "user" ? "ml-auto" : "mr-auto"}`}>
                {m.role === "user" ? (
                  <div className="rounded-2xl rounded-br-md bg-[#D4AF37] px-3 py-2 text-sm font-medium text-black">{m.text}</div>
                ) : (
                  <div className="rounded-2xl rounded-bl-md bg-white/5 p-3 text-sm text-white">
                    {m.text && <p className="mb-2 leading-7">{m.text}</p>}
                    {m.products?.length > 0 && (
                      <div className="space-y-2">
                        {m.products.map((product, idx) => (
                          <div key={`${product.name}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-bold text-[#F1D66B]">{product.name}</span>
                              <span className="rounded-full bg-[#D4AF37]/15 px-2 py-1 text-[10px] font-semibold text-[#F1D66B]">متاح</span>
                            </div>
                            <p className="mt-2 text-xs leading-6 text-white/70">{product.description || "لا يوجد وصف لهذا المنتج حاليًا."}</p>
                            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                              <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">السعر</span>
                              <span className="text-sm font-black text-[#F1D66B]">{Number(product.price) ? `${Number(product.price).toLocaleString("ar-EG")} جنيه` : "السعر غير متوفر"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && <div className="mr-auto max-w-[75%] rounded-2xl rounded-bl-md bg-white/5 px-3 py-2 text-xs text-white/65">أبحث عن أفضل النتائج...</div>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button key={item} type="button" onClick={() => setInput(item)} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/75 transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#F1D66B]">
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="اسأل عن منتج..." disabled={loading} className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#D4AF37]/60 focus:bg-white/7 disabled:opacity-50" />
              <button type="button" onClick={ask} disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37] text-lg font-black text-black shadow-lg shadow-[#D4AF37]/25 transition hover:brightness-110 disabled:opacity-50">↑</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}