import { useState } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { PACKAGES } from "../../lib/Package"

export default function Register() {
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // الباقة الجاي منها من Plans - لو ما جاي من Plans، افتراضي pro
  const planId = searchParams.get("plan") || "pro"
  const plan = PACKAGES[planId] || PACKAGES.pro

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    if (password.length < 6) return setError("كلمة السر اقل من 6 احرف")
    if (!whatsapp.trim()) return setError("ادخل رقم الواتساب")
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (error) throw error

      // لو الإيميل محتاج تأكيد، data.user ممكن يكون null
      // في الحالة دي، بنوديهو لصفحة تسجيل الدخول عشان يأكد
      let userId = data.user?.id

      // لو مافي user لسه (email confirmation)، جرب نجيبو من الجلسة
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      }

      if (userId) {
        // بنكتب في profiles - نفس الجدول البتستعملو Billing و Admin و useSubscription
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          email: email.trim(),
          whatsapp: whatsapp.trim(),
          role: "vendor",
          vendor_status: "pending", // لسه ما عمل متجر ولا دفع
          // بنحفظ الباقة الاخترها عشان CreateStore و Billing يلقوها
          requested_plan_id: plan.id,
        }, { onConflict: "id" })
        if (profileError) throw profileError
      }

      // بنحول لـ CreateStore ومعانا الباقة، عشان ما تضيع
      navigate(`/vendor/Create-Store?plan=${plan.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleRegister} className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-center text-[#00AEEF]">انشاء حساب تاجر</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center text-sm">
          الباقة المختارة: <span className="font-bold">{plan.name}</span> - {plan.price === 0 ? "مجاناً" : `${plan.price.toLocaleString()} جنيه / ${plan.durationDays} يوم`}
        </div>
        
        <div>
          <label className="block mb-1">الايميل</label>
          <input className="w-full border p-3 rounded" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="block mb-1">واتساب</label>
          <input className="w-full border p-3 rounded" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="0912345678" required />
        </div>

        <div>
          <label className="block mb-1">كلمة السر</label>
          <input className="w-full border p-3 rounded" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button disabled={loading} className="w-full bg-[#00AEEF] text-white p-3 rounded font-bold">
          {loading ? "جاري..." : "انشاء حساب"}
        </button>
        
        <p className="text-center text-sm">عندك حساب؟ <Link to="/login" className="text-[#00AEEF]">دخول</Link></p>
      </form>
    </div>
  )
}
