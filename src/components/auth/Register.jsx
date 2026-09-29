import {useState} from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState('');
    const { signUpCustomer } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if(password.length < 6){
            setError('كلمة السر لازم 6 أحرف على الأقل');
            setLoading(false);
            return;
        }
        try {
            await signUpCustomer(email, password, fullName);
            alert('تم انشاء الحساب بنجاح');
            navigate('/');
        } catch (signUpError){
            setError(signUpError.message || 'فشل إنشاء الحساب');

        }
        setLoading(false);
    }

    return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">


                <h1 className="mb-6 text-center text-3xl font-bold text-sky-800">انشاء حساب جديد</h1>

                {error && <div className="mb-4 rounded bg-red-100 p-2 text-center text-red-600">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label className="block mb-1 font-bold">الاسم كامل</label>
                    <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500 text-black"
                    placeholder="الاسم كامل"
                    />
                </div>

                  <div>
                    <label className="block mb-1 font-bold">الايميل</label>
                    <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50 p-3 outline-none focus:border-sky-500 black"
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
                    placeholder="6 احرف علي الاقل"
                    />
                  </div>

                  <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-sky-500 py-3 font-bold text-white hover:bg-sky-600 disabled:opacity-50"
                  >
                    {loading? 'انشاء حساب' : '...جاري الانشاء'}
                  </button>
                </form>

                <p className="text-center mt-4 text-gray-600">
                     عندك حساب بالفعل؟
                    <Link to="/login" className="font-bold text-sky-600">سجل دخول</Link>
                </p>

            <p className="text-center mt-2 text-gray-600">
                عايز تبيع معانا؟
                <Link to="/vendor/register" className="font-bold text-sky-600">
                سجل كتاجر
                </Link>
            </p>
            </div>
        </div>
    )
}

