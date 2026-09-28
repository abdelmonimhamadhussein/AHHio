import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {supabase} from "../../lib/supabase.js"
 
const banners = [
  {
    id: 1,
    title: "عروض الصيف 🔥",
    subtitle: "خصم حتى 50% على التشكيلة الجديدة",
    image: "https://images.unsplash.com/photo-1445205172300-053b585c9fcd?w=1200",
    color: "from-purple-600 to-pink-500"
  },
  {
    id: 2,
    title: "توصيل مجاني",
    subtitle: "للطلبات فوق 100 الف جنيه داخل الخرطوم",
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200",
    color: "from-blue-600 to-cyan-500"
  },
  {
    id: 3,
    title: "وصل حديثا",
    subtitle: "تشكيلة الشتاء 2026 الان في المتجر",
    image: "https://images.unsplash.com/photo-1489987707025-afc2323e351e?w=1200",
    color: "from-green-600 to-emerald-500"
  }
]

    export function BannerCarouselDialog({ onShopNow }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const next = () => setCurrent((prev) => (prev + 1) % banners.length)
  const prev = () => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-2xl mb-8">
      {/* البانرات */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute w-full h-full transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-70`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
            <h2 className="text-3xl md:text-5xl font-bold">{banner.title}</h2>
            <p className="text-lg md:text-xl mt-2">{banner.subtitle}</p>
            {onShopNow && <Button className="mt-4 bg-white text-black" onClick={onShopNow}>تسوق الان</Button>}
          </div>
        </div>
      ))}

      {/* الاسهم */}
      <Button
        onClick={prev}
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <Button
        onClick={next}
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      {/* النقاط تحت - هنا كان الخطأ */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all ${current === index ? 'bg-white w-6' : 'bg-white/50' // <-- صلحت القوس هنا
              }`}
          />
        ))}
      </div>
    </div>
  )
}
