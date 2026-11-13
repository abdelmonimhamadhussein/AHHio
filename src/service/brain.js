import { supabase } from '../lib/supabase'

export const brain = {
  name: 'منعم',
  async remember(user_id, key, value) {
    await supabase.from('ai_memory').insert({ user_id, key, value })
  },
  async recall(user_id) {
    const { data } = await supabase.from('ai_memory').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(10)
    return data || []
  },
  async saveChat(user_id, question, answer) {
    await supabase.from('ai_conversations').insert({ user_id, question, answer })
  },
  understand(q) {
    const text = q.toLowerCase()
    if (text.includes('سلام') || text.includes('اهلا') || text.includes('كيفك')) return 'greeting'
    if (text.includes('سعر') || text.includes('كم')) return 'price'
    if (text.includes('توصيل') || text.includes('رايدر')) return 'delivery'
    if (text.includes('متجر') || text.includes('اسمي') || text.includes('بتتذكر')) return 'memory'
    return 'product'
  },
  reply(type) {
    if (type === 'greeting') return `هلا والله 👋 أنا منعم، مساعدك في Ahhio.\nكيفك انت؟ داير تفتش عن شنو الليلة؟`
    if (type === 'delivery') return `التوصيل عندنا شغال يا استاذ 🛵\nاكتب لي اسم المنتج وأنا أجهزو ليك.`
    return null
  }
}