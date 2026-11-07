import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function OnboardingCheckList() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [hasProduct, setHasProduct] = useState(false);
  const [hasPayout, setHasPayout] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. جيب بيانات profiles - نفس الحقول الانت ذكرتها
      const { data: profileData } = await supabase
        .from("profiles")
        .select("store_name, store_slug, store_logo_url, store_banner_url, phone, city")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      // 2. هل عندو منتج واحد على الأقل؟
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      setHasProduct((productCount || 0) > 0);

      // 3. هل ربط بنكك؟ - بنعتبر رقم التلفون موجود = ربط بنكك
      // لو عندك جدول payouts خاص، بدلو بالاستعلام حقو هنا
      setHasPayout(!!profileData?.phone);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-2 bg-gray-100 rounded w-full" />
      </div>
    );
  }

  if (!profile) return null;

  const items = [
    {
      id: 1,
      title: "انشئ متجرك",
      desc: profile.store_slug ? `${profile.store_slug}.ahhio.com` : "mystore.ahhio.com",
      done: !!profile.store_name && !!profile.store_slug,
      link: "/create-store",
    },
    {
      id: 2,
      title: "اضف شعار لمتجرك",
      desc: "خلي متجرك احترافي",
      done: !!profile.store_logo_url,
      link: "/settings/branding",
    },
    {
      id: 3,
      title: "اضف اول منتج",
      desc: "صورة + سعر + وصف",
      done: hasProduct,
      link: "/addproduct/new",
    },
    {
      id: 4,
      title: "اربط بنكك",
      desc: "عشان تستلم قروشك",
      done: hasPayout,
      link: "/settings/payouts",
    },
    {
      id: 5,
      title: "انشر متجرك",
      desc: "شارك الرابط في الواتساب",
      done: hasProduct && !!profile.store_logo_url,
      link: "/",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  if (progress === 100) {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center justify-between">
        <p className="text-green-700 font-medium text-sm">
          متجرك جاهز 100% - شارك رابطك وابدأ البيع
        </p>
        <button
          onClick={() => {
            const link = `https://${profile.store_slug}.ahhio.com`;
            navigator.clipboard.writeText(link);
            alert("تم نسخ الرابط!");
          }}
          className="bg-green-600 text-white text-xs px-4 py-2 rounded-full"
        >
          انسخ الرابط
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between mb-3">
        <h3 className="font-bold">جهز متجرك للبيع</h3>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full mb-5 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
                className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
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
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-full shrink-0"
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
