import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AiTools() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [ans, setAns] = useState('مرحبا 👋 أنا مساعد Ahhio الذكي، اكتب اسم المنتج')

  const ask = async () => {
    if (!q.trim()) return
    setAns('بفتش...')
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name, price')
        .ilike('name', `%${q.trim()}%`)
        .limit(5)
      if (error) throw error
      if (!data?.length) setAns(`ما لقيت منتج اسمو "${q}"`)
      else setAns(data.map((p) => `📦 ${p.name} - ${p.price} SDG`).join('\n'))
    } catch (e) {
      setAns('خطأ: ' + e.message)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'إغلاق مساعد Ahhio' : 'فتح مساعد Ahhio'}
        aria-expanded={open}
        className="fixed bottom-20 right-4 z-50 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#facc15] text-[28px] text-[#111] shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2"
      >
        {open ? '✕' : '✨'}
      </button>

      {open && (
        <section
          dir="rtl"
          aria-label="مساعد Ahhio"
          className="fixed bottom-[150px] right-4 z-50 flex h-[400px] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-[#111] px-4 py-3 text-white">
            <span className="font-semibold">🤖 مساعد Ahhio</span>
            <span className="rounded-full bg-[#facc15] px-2 py-0.5 text-xs font-bold text-[#111]">AI</span>
          </header>

          <div
            role="status"
            aria-live="polite"
            className="flex-1 overflow-y-auto whitespace-pre-line bg-gray-50 p-4 text-sm leading-6 text-gray-800"
          >
            {ans}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              ask()
            }}
            className="flex items-center gap-2 border-t border-gray-200 p-3"
          >
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="اكتب مثلا: تيشيرت"
              aria-label="اسم المنتج"
              className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-[#facc15] focus:ring-2 focus:ring-[#facc15]/40"
            />
            <button
              type="submit"
              aria-label="بحث عن منتج"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#facc15] text-xl font-bold text-[#111] transition-colors hover:bg-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2"
            >
              ↑
            </button>
          </form>
        </section>
      )}
    </>
  )
}