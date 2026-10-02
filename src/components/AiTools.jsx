import { useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"

const defaultSuggestions = ["ايفون", "سماعة", "تي شيرت", "حقيبة"]

export default function AiTools({ storeId, tenantName }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { role: "ai", text: `مرحبا في ${tenantName || "المتجر"} 👋 اكتب اسم المنتج` }
  ])
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const ask = async () => {
    const q = input.trim()
    if (loading || !q) return

    setMessages(m => [...m, { role: "user", text: q }])
    setInput("")
    setLoading(true)
    console.log("Searching for:", q, "in store:", storeId)

    try {
      const pattern = q.replace(/[\\%_]/g, "\\$&")
      let query = supabase.from("products").select("name, price, description").limit(5)

      if (storeId) query = query.eq("store_id", storeId)

      query = query.or(`name.ilike.%${pattern}%,description.ilike.%${pattern}%`)

      const { data, error } = await query
      console.log("Result:", data, error)
      if (error) throw error

      let reply = ""
      if (!data || data.length === 0) {
        reply = `ما لقيت "${q}" 😕\nجرب كلمة تانية. المنتجات العندنا: ${defaultSuggestions.join("، ")}`
      } else {
        reply = data
          .map(product => {
            const name = product?.name || "منتج"
            const price = Number(product?.price ?? 0)
            const description = product?.description || "لا يوجد وصف"
            return `📦 ${name}\n💰 ${Number.isFinite(price) ? `${price} جنيه` : "السعر غير متوفر"}\n${description}`
          })
          .join("\n\n---\n\n")
      }

      setMessages(m => [...m, { role: "ai", text: reply }])
    } catch (e) {
      console.error(e)
      setMessages(m => [...m, { role: "ai", text: "في مشكلة في الاتصال بـ Supabase - اتأكد من الـ RLS" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-6 left-6 z-[999] w-14 h-14 rounded-full bg-[#D4AF37] text-black text-2xl font-bold shadow-xl flex items-center justify-center">
        {open ? "✕" : "AI"}
      </button>
      {open && (
        <div className="fixed bottom-24 left-6 z-[999] w-[90vw] max-w-[360px] h-[420px] rounded-[24px] border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 bg-white/5 border-b border-white/10">
            <h3 className="text-[#D4AF37] font-black">مساعد {tenantName || "المتجر"}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "ml-auto bg-[#D4AF37] text-black" : "bg-white/10 text-white"}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-white/50 text-xs">بفتش...</div>}
            <div ref={endRef} />
          </div>

          <div className="px-3 pt-3 pb-2 border-t border-white/10">
            <div className="mb-2 flex flex-wrap gap-2">
              {defaultSuggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setInput(item)}
                  className="rounded-full border border-[#D4AF37]/60 px-2 py-1 text-[10px] text-[#D4AF37] bg-[#D4AF37]/10"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && ask()}
                placeholder="اسأل..."
                disabled={loading}
                className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm text-white outline-none disabled:opacity-50"
              />
              <button
                onClick={ask}
                disabled={loading || !input.trim()}
                className="bg-[#D4AF37] text-black w-10 h-10 rounded-full font-bold disabled:opacity-50"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}