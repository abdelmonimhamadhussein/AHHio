export const PACKAGES = {
  basic: {
    id: 'basic',
    limit: 10,
    price: 0,
    name: 'مجانية',
    features: ['10 صور', 'منتجات غير محدودة', 'دعم عادي']
  },
  pro: {
    id: 'pro',
    limit: 100,
    price: 15000,
    name: 'باقة التاجر',
    features: ['100 صورة', 'ظهور أعلى', 'دعم سريع']
  },
  vip: {
    id: 'vip',
    limit: 999999,
    price: 35000,
    name: 'باقة VIP',
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