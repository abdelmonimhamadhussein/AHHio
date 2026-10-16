import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function Register() {
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    if(password.length < 6) return setError("كلمة السر اقل من 6")
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password
      })
      if(error) throw error

      await supabase.from("merchants").insert({
        id: data.user.id,
        email: email.trim(),
        whatsapp
      })

      navigate("/vendor/settings")
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleRegister} className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-center text-[#00AEEF]">انشاء حساب تاجر</h2>
        
        <div>
          <label className="block mb-1">الايميل</label>
          <input className="w-full border p-3 rounded" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="block mb-1">واتساب</label>
          <input className="w-full border p-3 rounded" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="2499xxxxxxx" required />
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