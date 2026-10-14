const freePlan = {
  id: 'free',
  planId: 'basic',
  limit: 10,
  price: 0,
  name: 'مجاناً',
  features: ['10 صور', 'منتجات غير محدودة', 'دعم عادي']
}

export const PACKAGES = {
  free: freePlan,
  basic: { ...freePlan, id: 'basic' },
  pro: {
    id: 'pro',
    planId: 'pro',
    limit: 100,
    price: 99,
    name: 'Pro',
    features: ['100 صورة', 'ظهور أعلى', 'دعم سريع']
  },
  vip: {
    id: 'vip',
    planId: 'vip',
    limit: 999999,
    price: 199,
    name: 'VIP',
    features: ['صور غير محدودة', 'توثيق متجرك', 'إعلانات ممولة']
  }
}

export function checkLimit(vendor){
  const plan = PACKAGES[vendor.plan] || PACKAGES.basic
  const imageCount = Number(vendor.image_count) || 0
  const remaining = Math.max(0, plan.limit - imageCount)
  const canUpload = remaining > 0
  return { canUpload, remaining, plan }
}