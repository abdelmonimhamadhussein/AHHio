import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function SignIn() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signIn(email, password);
            navigate('/');
        } catch (signInError) {
            setError(signInError.message || 'فشل تسجيل الدخول');

        }
        setLoading(false);
    }

    return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">


                <h1 className="mb-6 text-center text-3xl font-bold text-sky-800">تسجيل الدخول</h1>

                {error && <div className="mb-4 rounded bg-red-100 p-2 text-center text-red-600">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">

                  <div>
                    <label className="block mb-1 font-bold">الايميل</label>
                    <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500 text-black"
                    placeholder="الايميل"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">كلمة المرور</label>
                    <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500 text-black"
                    placeholder="كلمة المرور"
                    />
                  </div>

                  <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-sky-500 py-3 font-bold text-white hover:bg-sky-600 disabled:opacity-50"
                  >
                    {loading? '...جاري تسجيل الدخول' : 'تسجيل دخول'}
                  </button>
                </form>

              <p className="mt-4 text-center text-gray-600">
                ليس لديك حساب؟
                <Link to="/register" className="font-bold text-sky-600">إنشاء حساب</Link>
              </p>
            <p className="text-center mt-2 text-gray-600">
                حساب تاجر؟
                <Link to="/vendor" className="font-bold text-sky-600">دخول التجار</Link>
            </p>
            </div>
        </div>
    )
}

