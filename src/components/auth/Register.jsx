import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase.js"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (password.length < 6) throw new Error("كلمة السر لا تقل عن 6 أحرف")

      // 1. انشاء الحساب
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error("فشل انشاء الحساب")

      // 2. الربط العام - ده هو التدفق بتاع كل المتجر
      const { error: merchantError } = await supabase.from("vendors").insert({
        id: data.user.id,
        email: email.trim(),
        whatsapp: whatsapp,
        created_at: new Date()
      })
      if (merchantError) throw merchantError

      // 3. وديه يكمل بيانات المتجر
      navigate("/vendor/settings")

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="الايميل" />
      <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="واتساب" />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="كلمة السر" />
      {error && <p>{error}</p>}
      <button disabled={loading}>{loading ? "جاري..." : "انشاء حساب"}</button>
    </form>
  )
}