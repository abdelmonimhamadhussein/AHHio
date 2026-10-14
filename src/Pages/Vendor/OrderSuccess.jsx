import { Link, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderSuccess() {
    const { state } = useLocation();
    const orders = state?.orders || [];
    const customer = state?.customer || {};

    return (
        <div dir="rtl" className="flex items-center justify-center bg-white p-4 text-black">
            <div className="w-full max-w-md rounded-lg border border-sky-100 bg-white p-8 text-center">
             
             <div className="flex justify-center mb-4">
                <CheckCircle size={80} className="text-sky-500"/>
             </div>

             <h1 className="mb-2 text-2xl font-bold text-black">تم استلام طلبك بنجاح!</h1>
             <p className="mb-6 text-black">شكرا لتسوقك من AHHio</p>

             {orders.length > 0 && <div className="mb-6 grid gap-2">
                <p className="font-bold text-black">تواصل مع المتجر لمتابعة طلبك:</p>
                {orders.map((order) => {
                    const rawPhone = String(order.whatsapp_number || "249910070934").replace(/\D/g, "");
                    const whatsappPhone = rawPhone.startsWith("249") ? rawPhone : `249${rawPhone.replace(/^0+/, "")}`;
                    const message = `طلب جديد ${order.id}\nالعميل: ${customer.name || ""}\nرقم الهاتف: ${customer.phone || ""}\nالمدينة: ${customer.city || ""}\nالعنوان: ${customer.address || ""}\nالإجمالي: ${Number(order.total).toLocaleString()} SDG`;
                    return <a key={order.id} href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-[#0EA5E9] px-4 py-3 font-bold text-white hover:bg-[#0284C7]">مراسلة {order.store_name}</a>;
                })}
             </div>}

             <div className="flex flex-col gap-3">
                          <Link 
                          to="/"
                                                    className="rounded-lg bg-[#0EA5E9] py-3 font-bold text-white hover:bg-[#0284C7]"
                          >
                                                        العودة للرئيسية
                          </Link>

                          <Link
                          to="/shop"
                          className="rounded-lg border border-black py-3 font-bold text-black"
                          >
                            تتبع طلباتي
                          </Link>
                          </div>
            </div>
        </div>
    )
}