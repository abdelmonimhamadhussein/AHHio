
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../supabase/client"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(error.message)
    else navigate("/")
    setLoading(false)
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


