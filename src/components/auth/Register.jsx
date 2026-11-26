import { useState } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { PACKAGES } from "../../lib/Package"
import { formatCurrency } from "../../lib/currency"

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
  const selectedPlanId = plan.planId || plan.id

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
        options: {
          data: {
            role: "vendor",
            whatsapp: whatsapp.trim(),
            plan_id: selectedPlanId,
          },
        },
      })
      if (error) throw error

      if (!data.session) {
        navigate("/shop", {
          state: {
            registrationMessage: "تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط على رابط التأكيد، وبعدها سجّل الدخول لإكمال التسجيل.",
          },
        })
        return
      }

      navigate(`/vendor/create-store?plan=${selectedPlanId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleRegister} className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg space-y-5">
        <div>
          <label htmlFor="register-email" className="block mb-1">الايميل</label>
          <input id="register-email" className="w-full border p-3 rounded" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="register-whatsapp" className="block mb-1">واتساب</label>
          <input id="register-whatsapp" className="w-full border p-3 rounded" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="09xxxxxxxx" required />
        </div>

        <div>
          <label htmlFor="register-password" className="block mb-1">كلمة السر</label>
          <input id="register-password" className="w-full border p-3 rounded" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>

        <div className="w-full rounded-2xl border-2 border-[#00AEEF] bg-sky-50 p-6 text-center shadow-sm">
          <p className="mb-2 text-sm font-semibold text-sky-800">الباقة المختارة</p>
          <p className="text-2xl font-extrabold text-[#007eaa]">{plan.name}</p>
          <p className="mt-2 text-base font-semibold text-gray-700">
            {plan.price === 0 ? "مجاناً" : `${formatCurrency(plan.price)} / ${plan.durationDays} يوم`}
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <p className="text-center text-sm">عندك حساب؟ <Link to="/login" className="text-[#00AEEF]">دخول</Link></p>

        <button disabled={loading} className="w-full bg-[#00AEEF] text-white p-3 rounded font-bold">
          {loading ? "جاري..." : "انشاء حساب"}
        </button>
      </form>
    </div>
  )
}
