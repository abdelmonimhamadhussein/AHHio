import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminOrders() {

{/*دالة الصناديق*/}
    const [orders,   setorders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setsearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {

     const  fetchOrders = async () => {
        setLoading(true);
        const {data, error} = await supabase.from('orders').select("*");
        if(error) console.error(error)
            else setorders(data)
        setLoading(false)
     }
        fetchOrders();

      const channel = supabase
     .channel('orders')
    .on('postgres_changes', {event: "*", schema: 'public', table: 'orders'} , () => fetchOrders()
    )
    .subscribe();

    return () => {supabase.removeChannel(channel)}

    },[]);//يعني اشتغل مرة واحدة

       const fetchOrders = async () => {
        setLoading(true)
        const {data, error} = await supabase.from('orders')
        .select("*")
        .order('created_at', {ascending:false});

        if(error) console.error(error);
        else setorders(data);
        setLoading(false);
       }
    //فلتر + بحث سوا عشان الاداء
    const filterOrders = useMemo(() => {
        let result = orders;

        if(filter !=="all"){   //اول فلتر الحالة
            result = result.filter(order => order.status === filter);
        }

        if(search){ //تاني بحث برقم الهاتف
            result = result.filter(order => String(order.customer_phone || order.phone || "").includes(search));
        }

        return result;
    },[orders, filter,search]);

{/* دالة تحديث الحالة*/}
    const updateStatus = async (orderId, newStatus) => {
const {error} = await supabase.rpc('update_order_status', {
    target_order: orderId,
    new_status: newStatus,
})

if(error) alert(error.message || 'فشل التحديث')
    }

{/*دالة الالغاء مع تاكيد*/}
    const cancelOrder = async (orderId) =>{
    if( window.confirm('متاكد انك عايز تلغي الطلب دا')) {
        await updateStatus(orderId, 'cancelled')
    }
     
    }
{/*دالة الطباعة*/}
    const printInvoice = (order) => {
        const printWindow = window.open("", "",'height = 600,width = 800');
        printWindow.document.write(`
        <h1>فاتوةAHHio - ${order.id}</h1>
        <p>العميل:${order.customer_name || order.customer || "-"}</p>
        <p>التلفون:${order.customer_phone || order.phone || "-"}</p>
        <p>المبلغ:${order.total || 0} جنيه</p>
    `);
    printWindow.document.close();
    printWindow.print();
    }
    if(loading)return <p>جاري التحميل...</p>

    return (
        <div className="p-6">

    <h1 className="text-2xl font-bold mb-4">دارة الطلبات</h1>
    {/*البحث + الفلترة*/}
    <div className="flex text-2xl gap-6">
    <input
    type="text"
    placeholder="ابحث برقم التلفون..."
    value={search}
    onChange={(e) => setsearch(e.target.value)}
    className="border p-2 rounded w-1/2"
    />
    <div className="flex gap-2">
    {[['all', 'الكل'], ['pending', 'جديد'], ['shipped', 'قيد الشحن'], ['delivered', 'تم التوصيل'], ['cancelled', 'ملغي']].map(([value, label]) => (
        <button key={value} onClick={() => setFilter(value)}
        className={`px-4 py-2 rounded ${filter === value ? 'bg-black text-white' : 'bg-gray-200'}`}>
            {label}
        </button>
    ))}
    </div>
    </div>
      
      {/* الجداول*/}
      <table className="w-full border">
        <thead><tr className="bg-gray-100">
         <th>رقم الطلب</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>تحكم</th>
            </tr></thead>

            <tbody>
                {filterOrders.map(order => (
                    <tr key={order.id} className="border-t text-center">
                        <td>{order.id}</td>
                        <td>{order.customer_name || order.customer} <br/><span>{order.customer_phone || order.phone}</span></td>
                        <td>{order.total}جنيه</td>
                        <td>{order.status}</td>

                        <td className="flex gap-2 justify-center p-2">
                           <button onClick={() => updateStatus(order.id, 'shipped')} className="bg-blue-500 text-white px-2 py-1 rounded">اشحن</button>
                           <button onClick={() => updateStatus(order.id, 'delivered')} className="bg-green-500 text-white px-2 py-1 rounded">تم</button>
                           <button onClick={() => printInvoice(order)} className="bg-purple-500 text-white px-2 py-1 rounded">طباعة</button>
                           <button onClick={() => cancelOrder(order.id)} className="bg-red-500 text-white px-2 py-1 rounded">الغاء</button>
                        </td>
                    </tr>
                ))}
            </tbody>
      </table>

        </div>
    )
}