import { useState } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get("next")

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error

      const userId = data.user.id

      // نجيب ملفو من profiles - ده هو مصدر الحقيقة
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, vendor_status, store_name, store_slug")
        .eq("id", userId)
        .maybeSingle()

      // 1. لو أدمن -> وديهو لوحة الأدمن
      // الأدمن ما بنوديهو لـ next، لأنه next حق التجار
      if (profile?.role === "admin") {
        navigate("/admin")
        return
      }

      // 2. لو تاجر لكن لسه ما عمل متجر -> وديهو CreateStore
      if (!profile?.store_name) {
        navigate("/vendor/create-store")
        return
      }

      // 3. لو تاجر وعندو متجر لكن لسه ما اتوافق عليهو (pending) -> وديهو Billing
      // عشان يدفع أو يشوف حالة الدفع
      if (profile?.vendor_status === "pending") {
        navigate("/vendor/billing")
        return
      }

      // 4. لو محظور -> وديهو الداشبورد، والداشبورد هو البيوريهو رسالة الحظر
      // ما بنمنعو من الدخول هنا، عشان يعرف ليه محظور

      // 5. لو كان جاي من PrivateRoute وعندو next، وديهو ليها
      // بس نتأكد إنها مسار آمن وجوّا /vendor أو /admin
      if (next && (next.startsWith("/vendor/") || next.startsWith("/admin"))) {
        navigate(next)
        return
      }

      // 6. لو كل شي تمام -> الداشبورد
      navigate("/vendor/dashboard")
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">تسجيل الدخول</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
          <label>الايميل</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
             required className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl 
             text-black bg-blue focus:border-blue-500 outline-none" placeholder="" />
          </div>
          <div>
          <label>كلمة المرور</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
             required className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-black bg-blue
              focus:border-blue-500 outline-none" placeholder="" />
          </div>
          {msg && <p className="text-sm text-center text-red-500 bg-red-50 py-2 rounded">{msg}</p>}
          <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg"> {loading ? "جاري..." : "تسجيل دخول"} </button>
        </form>
        <div className="text-center mt-6 text-sm">
          <p>ليس لديك حساب؟ <Link to="/register" className="text-blue-600 font-bold">إنشاء حساب</Link></p>
        </div>
      </div>
    </div>
  )
}