import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/')
        },5000)
        return () => clearTimeout(timer)
    }, [navigate]);

    return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm">
             
             <div className="flex justify-center mb-4">
                <CheckCircle size={80} className="text-sky-500"/>
             </div>

             <h1 className="mb-2 text-2xl font-bold text-sky-700">تم استلام طلبك بنجاح!</h1>
             <p className="text-gray-600 mb-6">شكرا لتسوقك من AHHio</p>


             <div className="mb-6 rounded-xl bg-sky-50 p-4 text-right">
                <p className="font-bold mb-2">ماذا سيحدث الان</p>
                <ul>
                    <li>تم ارسال طلبك لكل التجار</li>
                    <li>سيتواصل معك التاجر عبر الواتساب</li>
                    <li>حالة الطلب: قيد الانتظار</li>
                </ul>
             </div>

             <div className="flex flex-col gap-3">
                          <Link 
                          to="/"
                          className="rounded-xl bg-sky-500 py-3 font-bold text-white hover:bg-sky-600"
                          >
                            العودة للمتجر
                          </Link>

                          <Link
                          to="/shop"
                          className="rounded-xl border border-sky-200 py-3 font-bold text-sky-700 hover:bg-sky-50"
                          >
                            تتبع طلباتي
                          </Link>
                          </div>
                          <p className="text-xs text-gray-400 mt-4">سيتم تحويلك تلقائيا بعد 5 ثواني</p>
            </div>
        </div>
    )
}