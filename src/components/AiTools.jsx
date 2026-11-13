import { useState, useEffect } from 'react'
import { supabase } from '.../lib/supabase'
import { brain } from '../service/brain'

export default function AiTools() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [ans, setAns] = useState('أهلا بيك 👋 أنا منعم، مساعدك في Ahhio.\nاكتب لي اسم المنتج وأنا بجيبو ليك طوالي.')
  const [memory, setMemory] = useState([])

  useEffect(() => {
    const loadMemory = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const m = await brain.recall(user.id)
        setMemory(m)
        if (m.length) setAns(`هلا بيك تاني يا استاذ 👋 أنا منعم، بتذكرك والله.\nآخر مرة سألت عن: ${m[0].value}\nداير شنو الليلة؟`)
      }
    }
    if (open) loadMemory()
  }, [open])

  const ask = async () => {
    if (!q.trim()) return
    setAns('منعم بفتش ليك...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const type = brain.understand(q)

      let result = brain.reply(type, q)
      if (!result) {
        if (type === 'memory') {
          result = memory.length ? `أيوا بتذكرك يا استاذ 🧠\n` + memory.map(m => `• ${m.value}`).join('\n') : 'لسه ما حفظت عنك حاجة، اسألني عن منتج وأنا بحفظك طوالي'
        } else {
          const { data, error } = await supabase.from('products').select('name, price').ilike('name', `%${q.trim()}%`).limit(5)
          if (error) throw error
          if (!data?.length) result = `والله يا استاذ فتشت ليك، ما لقيت منتج اسمو "${q}"\nجرب اسم تاني؟`
          else result = `لقيتهم ليك يا استاذ 👌\n` + data.map((p) => `📦 ${p.name} - ${p.price} SDG`).join('\n') + `\n\nداير واحد فيهم؟`
        }
      }

      setAns(result)
      if (user) {
        await brain.saveChat(user.id, q, result)
        await brain.remember(user.id, 'last_search', q)
      }
    } catch (e) {
      setAns('معليش يا استاذ، حصلت مشكلة: ' + e.message)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-label="فتح منعم" className="fixed bottom-20 right-4 z-50 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#facc15] text-[28px] text-[#111] shadow-xl hover:scale-105">
        {open ? '✕' : '🧑🏾‍💼'}
      </button>
      {open && (
        <section dir="rtl" className="fixed bottom-[150px] right-4 z-50 flex h-[400px] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-[#111] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#facc15] text-lg">🧑🏾‍💼</span>
              <div>
                <span className="block font-bold leading-4">منعم</span>
                <span className="block text-[11px] text-green-400">● متاح الآن - مساعد Ahhio</span>
              </div>
            </div>
            <span className="rounded-full bg-[#facc15] px-2 py-0.5 text-xs font-bold text-[#111]">AI</span>
          </header>
          <div className="flex-1 overflow-y-auto whitespace-pre-line bg-gray-50 p-4 text-sm leading-6 text-gray-800">{ans}</div>
          <form onSubmit={(e) => { e.preventDefault(); ask() }} className="flex items-center gap-2 border-t p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب لمنعم..." className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:border-[#facc15]" />
            <button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#facc15] text-xl font-bold">↑</button>
          </form>
        </section>
      )}
    </>
  )
}