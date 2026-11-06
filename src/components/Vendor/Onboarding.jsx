
import { useState } from "react";
import Link from "next/link";

export default function OnboardingCheckList() {
  const [items, setItems] = useState([
    { id: 1, title: "انشئ متجرك", desc: "mystore.ahhio.com", done: true, link: "/settings" },
    { id: 2, title: "اضف شعار لمتجر", desc: "خلي متجرك احترافي", done: false, link: "/settings/branding" },
    { id: 3, title: "اضف اول منتج", desc: "صورة + سعر + وصف", done: false, link: "/addproduct/new" },
    { id: 4, title: "اربط بنكك", desc: "عشان تستلم قروشك", done: false, link: "/settings/payouts" },
    { id: 5, title: "انشر متجرك", desc: "شارك الرابط في الواتساب", done: false, link: "/" },
  ]);

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  if (progress === 100) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded">
        متجرك جاهز 100 % - شارك رابطك وابدا البيع
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between mb-3">
        <h3 className="font-bold">جهز متجرك للبيع</h3>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full mb-5">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              item.done ? "bg-gray-50 opacity-60" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  item.done
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {item.done && "✔"}
              </div>
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            {!item.done && (
              <Link
                href={item.link}
                className="bg-blue-600 text-white text-xs px-4 py-2 rounded-full"
              >
                ابدا
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
