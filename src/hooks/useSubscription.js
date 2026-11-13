import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PACKAGES } from "../lib/Package";

const DAY = 24 * 60 * 60 * 1000;

// Hook نهائي - مصدر الباقات هو PACKAGES فقط
// Plans.jsx + useSubscription + Admin كلهم بيقروا من نفس الملف
export default function useSubscription(ownerId) {
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
      if (!ownerId) {
        setState((s) => ({ ...s, loading: false, canAddProduct: false }));
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, store_name, store_slug, vendor_status, is_vendor_approved, role, requested_plan_id")
          .eq("id", ownerId)
          .maybeSingle();

        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .select("id, plan")
          .eq("owner_id", ownerId)
          .maybeSingle();
        if (tenantError) throw tenantError;

        if (!tenant) {
          if (!active) return;
          setState((s) => ({
            ...s,
            plan: PACKAGES[profile?.requested_plan_id] || PACKAGES.free,
            isPending: profile?.vendor_status === "pending",
            isBlocked: ["blocked", "rejected"].includes(profile?.vendor_status),
            canAddProduct: false,
            loading: false,
            vendor: profile,
          }));
          return;
        }

        const tenantId = tenant.id;
        const { data: vendorStatus, error: statusError } = await supabase.rpc(
          "refresh_vendor_subscription_status",
          { target_tenant: tenantId }
        );
        if (statusError) throw statusError;

        const { data: refreshedProfile, error: refreshedProfileError } = await supabase
          .from("profiles")
          .select("id, store_name, store_slug, vendor_status, is_vendor_approved, role, requested_plan_id")
          .eq("id", ownerId)
          .maybeSingle();
        if (refreshedProfileError) throw refreshedProfileError;
        const currentProfile = refreshedProfile || profile;
        const isPendingVendor = currentProfile?.vendor_status === "pending";
        const isBlockedVendor = ["blocked", "rejected"].includes(currentProfile?.vendor_status);

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        let plan = null;
        if (subscription?.plan_id) {
          plan = PACKAGES[subscription.plan_id] || null;
        }
        if (!plan) {
          plan = PACKAGES[tenant.plan] || PACKAGES.free;
        }

        const now = new Date();
        let isExpired = false;
        let isBlocked = isBlockedVendor || vendorStatus === "blocked";
        let updatedSubscription = subscription;

        if (subscription?.end_date) {
          const endDate = new Date(subscription.end_date);

          if (now > endDate && ["trial", "active"].includes(subscription.status)) {
            isExpired = true;
          }

          if (updatedSubscription?.status === "expired") {
            isExpired = true;
            const graceUntil = updatedSubscription.grace_until ? new Date(updatedSubscription.grace_until) : null;
            if (graceUntil && now > graceUntil) isBlocked = true;
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
          vendor: currentProfile,
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
  }, [ownerId]);

  return state;
}
