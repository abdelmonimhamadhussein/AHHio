import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AiTools() {
  const [q, setQ] = useState('')
  const [ans, setAns] = useState('مرحبا 👋 اكتب اسم المنتج')

  const ask = async () => {
    if(!q.trim()) return
    setAns('بفتش...')
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name, price')
        .ilike('name', `%${q.trim()}%`)
        .limit(5)
      if(error) throw error
      if(!data || data.length === 0){
        setAns(`ما لقيت منتج اسمو "${q}"`)
      } else {
        setAns(data.map(p => `📦 ${p.name} - ${p.price} SDG`).join('\n'))
      }
    } catch(e){
      setAns('خطأ: ' + e.message)
    }
  }

  return (
    <div style={{padding:'12px', border:'1px solid #ddd', borderRadius:'8px', background:'white'}}>
      <div style={{whiteSpace:'pre-line', marginBottom:'10px', minHeight:'40px', background:'#f5f5f5', padding:'8px', borderRadius:'6px'}}>{ans}</div>
      <div style={{display:'flex', gap:'6px'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key==='Enter' && ask()} placeholder="مثلا: تيشيرت" style={{flex:1, border:'1px solid #ccc', padding:'8px', borderRadius:'6px'}} />
        <button onClick={ask} style={{background:'#111', color:'#fff', padding:'8px 14px', borderRadius:'6px'}}>بحث</button>
      </div>
    </div>
  )
}