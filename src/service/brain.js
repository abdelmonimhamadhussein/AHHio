import { supabase } from '../lib/supabase'

export const brain = {
  name: 'منعم',
  async remember(user_id, key, value) {
    try {
      await supabase.from('ai_memory').insert({ user_id, key, value })
    } catch (e) { console.log('memory skip', e.message) }
  },
  async recall(user_id) {
    try {
      const { data } = await supabase.from('ai_memory').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(10)
      return data || []
    } catch { return [] }
  },
  async saveChat(user_id, question, answer) {
    try {
      await supabase.from('ai_conversations').insert({ user_id, question, answer })
    } catch {}
  },
  understand(q) {
    const text = q.toLowerCase()
    if (text.includes('سلام') || text.includes('اهلا') || text.includes('كيفك') || text.includes('هلا')) return 'greeting'
    if (text.includes('توصيل') || text.includes('رايدر') || text.includes('يوصل')) return 'delivery'
    if (text.includes('متجر') || text.includes('اسمي') || text.includes('بتتذكر') || text.includes('ذاكر')) return 'memory'
    if (text.includes('سعر') || text.includes('كم') || text.includes('بكم')) return 'price'
    return 'product'
  },
  reply(type, q) {
    if (type === 'greeting') return `هلا والله 👋 أنا منعم، مساعدك في Ahhio.\nكيفك انت؟ داير تفتش عن شنو الليلة؟`
    if (type === 'delivery') return `التوصيل عندنا شغال يا استاذ 🛵\nاكتب لي اسم المنتج وأنا أجهزو ليك.`
    // مهم: ديل بيرجعو null عشان AiTools يمشي يفتش في جدول products
    if (type === 'price') return null
    if (type === 'memory') return null
    if (type === 'product') return null
    return null
  }
}