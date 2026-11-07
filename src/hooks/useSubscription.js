import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PACKAGES } from "../lib/Package";

const DAY = 24 * 60 * 60 * 1000;

// Hook نهائي - مصدر الباقات هو PACKAGES فقط
// Plans.jsx + useSubscription + Admin كلهم بيقروا من نفس الملف
export default function useSubscription(tenantId) {
  const [state, setState] = useState({
    plan: null,
    subscription: null,
    daysLeft: 0,
    graceDaysLeft: 0,
    isExpired: false,
    isBlocked: false,
    isExpiringSoon: false,
    isPending: false,
    canAddProduct: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      if (!tenantId) {
        setState((s) => ({ ...s, loading: false, canAddProduct: false }));
        return;
      }

      try {
        // 1. التاجر من profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, store_name, store_slug, vendor_status, is_vendor_approved, role")
          .eq("id", tenantId)
          .maybeSingle();

        const isPendingVendor = profile?.vendor_status === "pending";
        const isBlockedVendor = profile?.vendor_status === "blocked";

        // 2. آخر اشتراك - tenant_id أول، بعدين owner_id للتوافق
        let subscription = null;
        const { data: subByTenant } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        subscription = subByTenant || null;

        if (!subscription) {
          const { data: subByOwner } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("owner_id", tenantId)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle();
          subscription = subByOwner || null;
        }

        // 3. الخطة - من PACKAGES فقط، ده الربط الصح مع Plans.jsx
        // subscription.plan_id لازم يكون free / pro / vip
        let plan = null;
        if (subscription?.plan_id) {
          plan = PACKAGES[subscription.plan_id] || null;
        }
        // لو ما في اشتراك، اعتبرها free تجريبية - ما تجيب monthly
        if (!plan) {
          plan = PACKAGES.free;
        }

        const now = new Date();
        let isExpired = false;
        let isBlocked = isBlockedVendor;
        let updatedSubscription = subscription;

        // 4. انتهاء + Grace 3 أيام + حظر
        if (subscription?.end_date) {
          const endDate = new Date(subscription.end_date);

          if (now > endDate && ["trial", "active"].includes(subscription.status)) {
            const grace = new Date(now.getTime() + 3 * DAY).toISOString();
            await supabase.from("subscriptions").update({ status: "expired", grace_until: grace }).eq("id", subscription.id);
            await supabase.from("profiles").update({ vendor_status: "expired" }).eq("id", tenantId);
            updatedSubscription = { ...subscription, status: "expired", grace_until: grace };
            isExpired = true;
          }

          if (updatedSubscription?.status === "expired") {
            isExpired = true;
            const graceUntil = updatedSubscription.grace_until ? new Date(updatedSubscription.grace_until) : null;
            if (graceUntil && now > graceUntil) {
              await supabase.from("profiles").update({ vendor_status: "blocked" }).eq("id", tenantId);
              isBlocked = true;
            }
          }
        } else if (!subscription) {
          // ما عندو اشتراك أصلا
          isExpired = true;
        }

        // 5. حد المنتجات - من PACKAGES
        const { count } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);

        const maxProducts = plan?.max_products ?? 10;
        const canAddProduct =
          !isPendingVendor &&
          !isBlocked &&
          !isExpired &&
          Number(count || 0) < Number(maxProducts);

        const daysLeft = updatedSubscription?.end_date
          ? Math.ceil((new Date(updatedSubscription.end_date).getTime() - now.getTime()) / DAY)
          : 0;

        const graceDaysLeft = updatedSubscription?.grace_until
          ? Math.max(0, Math.ceil((new Date(updatedSubscription.grace_until).getTime() - now.getTime()) / DAY))
          : 0;

        if (!active) return;

        setState({
          plan,
          subscription: updatedSubscription,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          graceDaysLeft,
          isExpired,
          isBlocked,
          isExpiringSoon: !isExpired && daysLeft > 0 && daysLeft <= 5,
          isPending: isPendingVendor,
          canAddProduct,
          loading: false,
          vendor: profile,
          productCount: Number(count || 0),
          maxProducts,
        });
      } catch (error) {
        console.error("useSubscription error:", error);
        if (active) {
          setState((s) => ({ ...s, loading: false, canAddProduct: false }));
        }
      }
    }

    load();
    return () => { active = false; };
  }, [tenantId]);

  return state;
}
