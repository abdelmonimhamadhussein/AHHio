import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { brain } from '../service/brain'
import { formatCurrency } from '../lib/currency'

function getErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && error.message) {
    return String(error.message)
  }
  return 'Something went wrong'
}

export default function AiTools({ storeId }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [ans, setAns] = useState('أهلا بيك 👋 أنا منعم، مساعدك في Ahhio.\nاكتب لي اسم المنتج وأنا بجيبو ليك طوالي.')
  const [memory, setMemory] = useState([])
  const [isSending, setIsSending] = useState(false)
  const requestController = useRef(null)

  useEffect(() => {
    setMemory([])
    setAns('أهلا بيك 👋 أنا منعم، مساعدك في Ahhio.\nاكتب لي اسم المنتج وأنا بجيبو ليك طوالي.')
  }, [storeId])

  useEffect(() => {
    let active = true
    const loadMemory = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const m = await brain.recall(user.id, storeId)
        if (!active) return
        setMemory(m)
        if (m.length) setAns(`هلا بيك تاني يا استاذ 👋 أنا منعم، بتذكرك والله.\nآخر مرة سألت عن: ${m[0].value}\nداير شنو الليلة؟`)
      }
    }
    if (open && storeId) loadMemory().catch((error) => {
      if (active) console.error('AiTools failed to load memory:', error)
    })
    return () => {
      active = false
    }
  }, [open, storeId])

  useEffect(() => () => requestController.current?.abort(), [])

  const ask = async () => {
    if (!q.trim()) return
    requestController.current?.abort()
    const controller = new AbortController()
    requestController.current = controller
    setIsSending(true)
    setAns('منعم بفتش ليك...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const type = brain.understand(q)

      let result = brain.reply(type, q)
      if (!result) {
        if (type === 'memory') {
          result = memory.length ? `أيوا بتذكرك يا استاذ 🧠\n` + memory.map(m => `• ${m.value}`).join('\n') : 'لسه ما حفظت عنك حاجة، اسألني عن منتج وأنا بحفظك طوالي'
        } else if (!storeId) {
          result = 'عذراً، ما قدرت أحدد المتجر للبحث عن المنتجات.'
        } else {
          const { data, error } = await supabase
            .from('products')
            .select('name, price')
            .eq('tenant_id', storeId)
            .eq('is_active', true)
            .eq('status', 'active')
            .ilike('name', `%${q.trim()}%`)
            .limit(5)
            .abortSignal(controller.signal)
          if (error) throw error
          if (!data?.length) result = `والله يا استاذ فتشت ليك، ما لقيت منتج اسمو "${q}"\nجرب اسم تاني؟`
          else result = `لقيتهم ليك يا استاذ 👌\n` + data.map((p) => `📦 ${p.name} - ${formatCurrency(p.price)}`).join('\n') + `\n\nداير واحد فيهم؟`
        }
      }

      if (requestController.current !== controller) return
      setAns(result)
      if (user && storeId) {
        await brain.saveChat(user.id, q, result)
        await brain.remember(user.id, 'last_search', q, storeId)
      }
    } catch (e) {
      console.error('AiTools request failed:', e)
      if (requestController.current === controller && !controller.signal.aborted) {
        setAns('معليش يا استاذ، حصلت مشكلة: ' + getErrorMessage(e))
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null
        setIsSending(false)
      }
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
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isSending) {
                  e.preventDefault()
                  ask()
                }
              }}
              placeholder="اكتب لمنعم..."
              className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:border-[#facc15]"
            />
            <button type="submit" disabled={isSending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#facc15] text-xl font-bold disabled:cursor-not-allowed disabled:opacity-50">↑</button>
          </form>
        </section>
      )}
    </>
  )
}