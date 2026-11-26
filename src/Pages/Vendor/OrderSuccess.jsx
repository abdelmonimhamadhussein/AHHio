import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { readLastOrder } from "../../lib/lastOrder";

export default function OrderSuccess() {
    const { state } = useLocation();
    const [savedOrder] = useState(readLastOrder);
    const orderData = state?.orders?.length ? state : savedOrder;
    const orders = orderData?.orders || [];
    const customer = orderData?.customer || {};

    return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-white p-4 text-black">
            <div className="w-full max-w-md rounded-lg border border-sky-100 bg-white p-8 text-center">
                {orders.length > 0 ? (
                    <>
                        <div className="mb-4 flex justify-center">
                            <CheckCircle size={80} className="text-sky-500" />
                        </div>
                        <h1 className="mb-2 text-2xl font-bold">تم استلام طلبك بنجاح!</h1>
                        <p className="mb-6">شكراً لتسوقك من AHHio</p>
                        {orderData.storageWarning && <p role="alert" className="mb-4 text-sm text-amber-700">{orderData.storageWarning}</p>}

                        <div className="mb-6 space-y-4 text-right">
                            {orders.map((order) => {
                                const rawPhone = String(order.whatsapp_number || "249910070934").replace(/\D/g, "");
                                const whatsappPhone = rawPhone.startsWith("249") ? rawPhone : `249${rawPhone.replace(/^0+/, "")}`;
                                const message = `طلب جديد ${order.id}\nالعميل: ${customer.name || ""}\nرقم الهاتف: ${customer.phone || ""}\nالمدينة: ${customer.city || ""}\nالعنوان: ${customer.address || ""}\nالإجمالي: ${formatCurrency(order.total)}`;
                                return (
                                    <article key={order.id} className="rounded-lg border border-gray-200 p-4">
                                        <h2 className="font-bold">رقم الطلب: #{order.id}</h2>
                                        <p className="mt-1 text-sm">المتجر: {order.store_name || "المتجر"}</p>
                                        <div className="my-3 space-y-2 border-y border-gray-100 py-3">
                                            {order.items?.map((item) => (
                                                <div key={item.id} className="flex justify-between gap-3 text-sm">
                                                    <span>{item.name} × {item.qty}</span>
                                                    <span>{formatCurrency(item.price * item.qty)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mb-3 font-bold">الإجمالي: {formatCurrency(order.total)}</p>
                                        <a
                                            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-lg bg-[#0EA5E9] px-4 py-3 text-center font-bold text-white hover:bg-[#0284C7]"
                                        >
                                            مراسلة {order.store_name || "المتجر"}
                                        </a>
                                    </article>
                                );
                            })}
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link to="/orders" className="rounded-lg border border-black py-3 font-bold text-black">عرض طلباتي</Link>
                            <Link to="/shop" className="rounded-lg bg-[#0EA5E9] py-3 font-bold text-white hover:bg-[#0284C7]">متابعة التسوق</Link>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="mb-3 text-2xl font-bold">لا توجد بيانات طلب محفوظة</h1>
                        <p className="mb-6 text-gray-600">يمكنك مراجعة طلباتك أو العودة للمتجر.</p>
                        <Link to="/orders" className="block rounded-lg bg-[#0EA5E9] py-3 font-bold text-white hover:bg-[#0284C7]">الانتقال إلى طلباتي</Link>
                    </>
                )}
            </div>
        </div>
    );
}